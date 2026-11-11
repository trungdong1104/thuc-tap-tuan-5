import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { createInitialSeed, resolveProductStatus } from './data/seed.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = IS_VERCEL ? '/tmp/pm-db.json' : path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = IS_VERCEL ? '/tmp/pm-uploads' : path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');
const THUMBS_DIR = path.join(PUBLIC_DIR, 'thumbs');

const PORT = Number(process.env.API_PORT || 3001);
const TOKEN_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update('pm-session-signing-key-v1').digest('hex');

if (!IS_VERCEL) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = createInitialSeed();
    initial.revokedTokens = [];
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.revokedTokens)) {
    parsed.revokedTokens = [];
  }
  return parsed;
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function sendSuccess(res, data, message = 'Thành công', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

function sendError(res, statusCode, code, message, details = null) {
  return res.status(statusCode).json({
    success: false,
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
  });
}

function resolvePublicUrl(req, maybeRelativeUrl) {
  if (!maybeRelativeUrl) return '';
  if (
    maybeRelativeUrl.startsWith('http://') ||
    maybeRelativeUrl.startsWith('https://') ||
    maybeRelativeUrl.startsWith('data:')
  ) {
    return maybeRelativeUrl;
  }
  const normalized = maybeRelativeUrl.startsWith('/assets/thumbs/')
    ? maybeRelativeUrl.replace('/assets/thumbs/', '/api/thumbs/')
    : maybeRelativeUrl;
  if (IS_VERCEL) {
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }
  const origin = `${req.protocol}://${req.get('host')}`;
  return `${origin}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
}

function enrichProduct(req, db, product) {
  const category = db.categories.find((c) => c.id === product.categoryId);
  return {
    ...product,
    categoryName: category ? category.name : 'Không xác định',
    imageUrl: resolvePublicUrl(req, product.imageUrl),
  };
}

function normalizeVietnamese(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

function signTokenPayload(payload) {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(encoded)
    .digest('base64url');
  return `pm_sess_${encoded}.${signature}`;
}

function verifySignedToken(token) {
  if (!token || !token.startsWith('pm_sess_')) return null;
  const raw = token.slice('pm_sess_'.length);
  const parts = raw.split('.');
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(encoded)
    .digest('base64url');
  if (signature !== expected) return null;
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function createSessionRecord(username = 'intern-react', fullName = 'Thực tập sinh React') {
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const user = {
    id: `usr-${crypto.createHash('sha1').update(username).digest('hex').slice(0, 8)}`,
    username,
    fullName,
    role: 'ADMIN',
  };
  const token = signTokenPayload({
    user,
    expiresAt,
    createdAt,
    nonce: crypto.randomBytes(6).toString('hex'),
  });
  return {
    token,
    user,
    expiresAt,
    createdAt,
  };
}

const storage = IS_VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '.png').toLowerCase();
        const safeExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)
          ? ext
          : '.png';
        cb(null, `prd-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${safeExt}`);
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ tải lên tệp hình ảnh (PNG, JPG, WEBP, SVG).'));
    }
  },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '4mb' }));
app.use('/api/thumbs', express.static(THUMBS_DIR));
app.use('/api/uploads', express.static(UPLOADS_DIR));
app.use('/assets', express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

app.use((req, res, next) => {
  const sim = req.headers['x-simulate-error'];
  if (!sim) return next();
  const code = String(sim);
  if (code === '401') {
    return sendError(
      res,
      401,
      'UNAUTHORIZED',
      'Phiên đăng nhập không hợp lệ hoặc đã hết hạn (mô phỏng 401).'
    );
  }
  if (code === '403') {
    return sendError(
      res,
      403,
      'FORBIDDEN',
      'Bạn không có quyền thực hiện thao tác này (mô phỏng 403).'
    );
  }
  if (code === '404') {
    return sendError(res, 404, 'NOT_FOUND', 'Không tìm thấy tài nguyên yêu cầu (mô phỏng 404).');
  }
  if (code === '500') {
    return sendError(
      res,
      500,
      'INTERNAL_SERVER_ERROR',
      'Lỗi máy chủ nội bộ (mô phỏng 500).'
    );
  }
  return next();
});

function requireAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return sendError(
      res,
      401,
      'UNAUTHORIZED',
      'Thiếu Authorization Bearer token. Vui lòng khởi tạo phiên làm việc.'
    );
  }

  const db = loadDb();
  if (db.revokedTokens.includes(token)) {
    return sendError(
      res,
      401,
      'TOKEN_REVOKED',
      'Phiên làm việc đã đăng xuất. Vui lòng đăng nhập lại.'
    );
  }

  const verified = verifySignedToken(token);
  if (verified) {
    if (new Date(verified.expiresAt).getTime() < Date.now()) {
      return sendError(
        res,
        401,
        'TOKEN_EXPIRED',
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      );
    }
    req.session = { token, ...verified };
    return next();
  }

  const legacySession = db.sessions.find((s) => s.token === token);
  if (!legacySession) {
    return sendError(
      res,
      401,
      'INVALID_TOKEN',
      'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
    );
  }
  if (new Date(legacySession.expiresAt).getTime() < Date.now()) {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDb(db);
    return sendError(
      res,
      401,
      'TOKEN_EXPIRED',
      'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    );
  }
  req.session = legacySession;
  return next();
}

app.get('/api/health', (_req, res) => {
  return sendSuccess(res, { status: 'UP', version: '1.0.0' }, 'API Server đang hoạt động');
});

app.post('/api/auth/session', (_req, res) => {
  const db = loadDb();
  const session = createSessionRecord('intern-react', 'Thực tập sinh React');
  db.sessions.push(session);
  if (db.sessions.length > 50) {
    db.sessions = db.sessions.slice(-50);
  }
  saveDb(db);
  return sendSuccess(res, session, 'Khởi tạo phiên làm việc thành công', 201);
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !String(username).trim() || !password || !String(password).trim()) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.', {
      username: !username ? 'Tên đăng nhập là bắt buộc' : undefined,
      password: !password ? 'Mật khẩu là bắt buộc' : undefined,
    });
  }
  if (String(password) === 'wrong') {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu không chính xác.');
  }
  const db = loadDb();
  const cleanUser = String(username).trim();
  const session = createSessionRecord(cleanUser, cleanUser === 'admin' ? 'Quản trị viên' : cleanUser);
  db.sessions.push(session);
  if (db.sessions.length > 50) {
    db.sessions = db.sessions.slice(-50);
  }
  saveDb(db);
  return sendSuccess(res, session, 'Đăng nhập thành công');
});

app.post('/api/auth/logout', (req, res) => {
  const token = extractBearerToken(req);
  if (token) {
    const db = loadDb();
    db.sessions = db.sessions.filter((s) => s.token !== token);
    if (!db.revokedTokens.includes(token)) {
      db.revokedTokens.push(token);
      if (db.revokedTokens.length > 100) {
        db.revokedTokens = db.revokedTokens.slice(-100);
      }
    }
    saveDb(db);
  }
  return sendSuccess(res, { loggedOut: true }, 'Đã đăng xuất khỏi phiên làm việc');
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  return sendSuccess(res, req.session, 'Thông tin phiên hiện tại');
});

app.post('/api/uploads', requireAuth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return sendError(res, 400, 'UPLOAD_ERROR', err.message || 'Không thể tải tệp hình ảnh.');
    }
    if (!req.file) {
      return sendError(res, 400, 'FILE_REQUIRED', 'Không tìm thấy tệp hình ảnh được gửi lên.');
    }

    if (IS_VERCEL && req.file.buffer) {
      const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      return sendSuccess(
        res,
        {
          url: dataUrl,
          relativeUrl: dataUrl,
          filename: req.file.originalname,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
        'Tải lên hình ảnh thành công',
        201
      );
    }

    const relativeUrl = `/api/uploads/${req.file.filename}`;
    return sendSuccess(
      res,
      {
        url: resolvePublicUrl(req, relativeUrl),
        relativeUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
      'Tải lên hình ảnh thành công',
      201
    );
  });
});

app.get('/api/categories', (req, res) => {
  const db = loadDb();
  const search = normalizeVietnamese(req.query.search);
  let items = db.categories.map((cat) => ({
    ...cat,
    productCount: db.products.filter((p) => p.categoryId === cat.id).length,
  }));

  if (search) {
    items = items.filter(
      (c) =>
        normalizeVietnamese(c.name).includes(search) ||
        normalizeVietnamese(c.description).includes(search)
    );
  }

  return sendSuccess(
    res,
    {
      items,
      meta: {
        page: 1,
        limit: items.length || 10,
        totalItems: items.length,
        totalPages: 1,
      },
    },
    'Lấy danh sách danh mục thành công'
  );
});

app.get('/api/categories/:id', (req, res) => {
  const db = loadDb();
  const category = db.categories.find((c) => c.id === req.params.id);
  if (!category) {
    return sendError(res, 404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục yêu cầu.');
  }
  return sendSuccess(res, {
    ...category,
    productCount: db.products.filter((p) => p.categoryId === category.id).length,
  });
});

app.post('/api/categories', requireAuth, (req, res) => {
  const { name, description = '' } = req.body || {};
  if (!name || !String(name).trim()) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Tên danh mục không được để trống.', {
      name: 'Vui lòng nhập tên danh mục',
    });
  }
  const db = loadDb();
  const trimmedName = String(name).trim();
  const duplicate = db.categories.some(
    (c) => normalizeVietnamese(c.name) === normalizeVietnamese(trimmedName)
  );
  if (duplicate) {
    return sendError(res, 409, 'DUPLICATE_CATEGORY', 'Danh mục này đã tồn tại.');
  }
  const now = new Date().toISOString();
  const slug =
    normalizeVietnamese(trimmedName)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'category';
  const newCategory = {
    id: `cat-${crypto.randomBytes(4).toString('hex')}`,
    name: trimmedName,
    slug,
    description: String(description || '').trim(),
    createdAt: now,
    updatedAt: now,
  };
  db.categories.push(newCategory);
  saveDb(db);
  return sendSuccess(res, { ...newCategory, productCount: 0 }, 'Thêm danh mục mới thành công', 201);
});

app.put('/api/categories/:id', requireAuth, (req, res) => {
  const db = loadDb();
  const index = db.categories.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return sendError(res, 404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục cần cập nhật.');
  }
  const { name, description } = req.body || {};
  if (name !== undefined && !String(name).trim()) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Tên danh mục không được để trống.', {
      name: 'Tên danh mục không hợp lệ',
    });
  }
  const current = db.categories[index];
  const updatedName = name !== undefined ? String(name).trim() : current.name;
  const updated = {
    ...current,
    name: updatedName,
    slug:
      normalizeVietnamese(updatedName)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || current.slug,
    description: description !== undefined ? String(description).trim() : current.description,
    updatedAt: new Date().toISOString(),
  };
  db.categories[index] = updated;
  saveDb(db);
  return sendSuccess(
    res,
    { ...updated, productCount: db.products.filter((p) => p.categoryId === updated.id).length },
    'Cập nhật danh mục thành công'
  );
});

app.delete('/api/categories/:id', requireAuth, (req, res) => {
  const db = loadDb();
  const exists = db.categories.find((c) => c.id === req.params.id);
  if (!exists) {
    return sendError(res, 404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục cần xóa.');
  }
  const inUseCount = db.products.filter((p) => p.categoryId === req.params.id).length;
  if (inUseCount > 0) {
    return sendError(
      res,
      409,
      'CATEGORY_IN_USE',
      `Không thể xóa danh mục "${exists.name}" vì đang có ${inUseCount} sản phẩm thuộc danh mục này.`
    );
  }
  db.categories = db.categories.filter((c) => c.id !== req.params.id);
  saveDb(db);
  return sendSuccess(res, { id: req.params.id }, 'Xóa danh mục thành công');
});

app.get('/api/products/stats', (req, res) => {
  const db = loadDb();
  const products = db.products.map((p) => enrichProduct(req, db, p));
  const inStockCount = products.filter((p) => p.status === 'IN_STOCK').length;
  const lowStockCount = products.filter((p) => p.status === 'LOW_STOCK').length;
  const outOfStockCount = products.filter((p) => p.status === 'OUT_OF_STOCK').length;
  const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const categoryBreakdown = db.categories.map((cat) => ({
    categoryId: cat.id,
    categoryName: cat.name,
    count: products.filter((p) => p.categoryId === cat.id).length,
  }));

  return sendSuccess(
    res,
    {
      totalProducts: products.length,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue,
      categoryBreakdown,
      recentProducts: [...products]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    },
    'Lấy thống kê sản phẩm thành công'
  );
});

app.get('/api/products', (req, res) => {
  const db = loadDb();
  const search = normalizeVietnamese(req.query.search);
  const categoryId = req.query.categoryId ? String(req.query.categoryId).trim() : '';
  const status = req.query.status ? String(req.query.status).trim() : '';
  const sortBy = req.query.sortBy ? String(req.query.sortBy) : 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || '5'), 10) || 5));

  let filtered = db.products.map((p) => enrichProduct(req, db, p));

  if (search) {
    filtered = filtered.filter(
      (p) =>
        normalizeVietnamese(p.name).includes(search) ||
        normalizeVietnamese(p.categoryName).includes(search) ||
        normalizeVietnamese(p.description).includes(search)
    );
  }

  if (categoryId) {
    filtered = filtered.filter((p) => p.categoryId === categoryId);
  }

  if (status) {
    filtered = filtered.filter((p) => p.status === status);
  }

  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'price' || sortBy === 'quantity') {
      comparison = a[sortBy] - b[sortBy];
    } else if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name, 'vi');
    } else {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);

  return sendSuccess(
    res,
    {
      items,
      meta: {
        page: safePage,
        limit,
        totalItems,
        totalPages,
      },
    },
    'Lấy danh sách sản phẩm thành công'
  );
});

app.get('/api/products/:id', (req, res) => {
  const db = loadDb();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) {
    return sendError(
      res,
      404,
      'PRODUCT_NOT_FOUND',
      `Không tìm thấy sản phẩm với mã "${req.params.id}".`
    );
  }
  return sendSuccess(res, enrichProduct(req, db, product), 'Lấy chi tiết sản phẩm thành công');
});

function validateProductPayload(db, payload, isPartial = false) {
  const errors = {};
  if (!isPartial || payload.name !== undefined) {
    if (!payload.name || !String(payload.name).trim()) {
      errors.name = 'Tên sản phẩm không được để trống.';
    } else if (String(payload.name).trim().length < 2) {
      errors.name = 'Tên sản phẩm phải có ít nhất 2 ký tự.';
    }
  }
  if (!isPartial || payload.categoryId !== undefined) {
    if (!payload.categoryId || !db.categories.some((c) => c.id === payload.categoryId)) {
      errors.categoryId = 'Vui lòng chọn danh mục hợp lệ.';
    }
  }
  if (!isPartial || payload.price !== undefined) {
    const price = Number(payload.price);
    if (
      payload.price === '' ||
      payload.price === undefined ||
      payload.price === null ||
      Number.isNaN(price) ||
      price < 0
    ) {
      errors.price = 'Giá sản phẩm phải là số lớn hơn hoặc bằng 0.';
    }
  }
  if (!isPartial || payload.quantity !== undefined) {
    const quantity = Number(payload.quantity);
    if (
      payload.quantity === '' ||
      payload.quantity === undefined ||
      payload.quantity === null ||
      Number.isNaN(quantity) ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      errors.quantity = 'Số lượng phải là số nguyên lớn hơn hoặc bằng 0.';
    }
  }
  return errors;
}

const DEFAULT_THUMB_BY_CATEGORY = {
  'cat-phone': '/api/thumbs/phone.svg',
  'cat-laptop': '/api/thumbs/laptop.svg',
  'cat-accessory': '/api/thumbs/accessory.svg',
  'cat-tablet': '/api/thumbs/tablet.svg',
  'cat-watch': '/api/thumbs/watch.svg',
};

app.post('/api/products', requireAuth, (req, res) => {
  const db = loadDb();
  const body = req.body || {};
  const errors = validateProductPayload(db, body, false);
  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Dữ liệu sản phẩm không hợp lệ.', errors);
  }

  const quantity = Number(body.quantity);
  const price = Number(body.price);
  const now = new Date().toISOString();
  const fallbackThumb = DEFAULT_THUMB_BY_CATEGORY[body.categoryId] || '/api/thumbs/accessory.svg';

  const newProduct = {
    id: `prd-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`,
    name: String(body.name).trim(),
    categoryId: String(body.categoryId),
    price,
    quantity,
    status: resolveProductStatus(quantity),
    description: body.description ? String(body.description).trim() : '',
    imageUrl:
      body.imageUrl && String(body.imageUrl).trim() ? String(body.imageUrl).trim() : fallbackThumb,
    createdAt: now,
    updatedAt: now,
  };

  db.products.unshift(newProduct);
  saveDb(db);

  return sendSuccess(res, enrichProduct(req, db, newProduct), 'Thêm sản phẩm mới thành công', 201);
});

function handleUpdateProduct(req, res, isPartial) {
  const db = loadDb();
  const index = db.products.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return sendError(
      res,
      404,
      'PRODUCT_NOT_FOUND',
      `Không tìm thấy sản phẩm với mã "${req.params.id}".`
    );
  }

  const body = req.body || {};
  const errors = validateProductPayload(db, body, isPartial);
  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Dữ liệu cập nhật sản phẩm không hợp lệ.', errors);
  }

  const current = db.products[index];
  const nextQuantity = body.quantity !== undefined ? Number(body.quantity) : current.quantity;
  const nextPrice = body.price !== undefined ? Number(body.price) : current.price;
  const nextCategoryId = body.categoryId !== undefined ? String(body.categoryId) : current.categoryId;

  const updated = {
    ...current,
    name: body.name !== undefined ? String(body.name).trim() : current.name,
    categoryId: nextCategoryId,
    price: nextPrice,
    quantity: nextQuantity,
    status: resolveProductStatus(nextQuantity),
    description: body.description !== undefined ? String(body.description).trim() : current.description,
    imageUrl:
      body.imageUrl !== undefined
        ? String(body.imageUrl).trim() || DEFAULT_THUMB_BY_CATEGORY[nextCategoryId] || current.imageUrl
        : current.imageUrl,
    updatedAt: new Date().toISOString(),
  };

  db.products[index] = updated;
  saveDb(db);

  return sendSuccess(res, enrichProduct(req, db, updated), 'Cập nhật sản phẩm thành công');
}

app.put('/api/products/:id', requireAuth, (req, res) => handleUpdateProduct(req, res, false));
app.patch('/api/products/:id', requireAuth, (req, res) => handleUpdateProduct(req, res, true));

app.delete('/api/products/:id', requireAuth, (req, res) => {
  const db = loadDb();
  const exists = db.products.find((p) => p.id === req.params.id);
  if (!exists) {
    return sendError(
      res,
      404,
      'PRODUCT_NOT_FOUND',
      `Không tìm thấy sản phẩm với mã "${req.params.id}".`
    );
  }
  db.products = db.products.filter((p) => p.id !== req.params.id);
  saveDb(db);
  return sendSuccess(res, { id: req.params.id }, `Đã xóa sản phẩm "${exists.name}" thành công`);
});

app.post('/api/system/reset', (_req, res) => {
  const current = loadDb();
  const fresh = createInitialSeed();
  fresh.sessions = current.sessions || [];
  fresh.revokedTokens = current.revokedTokens || [];
  saveDb(fresh);
  return sendSuccess(res, { totalProducts: fresh.products.length }, 'Đã khôi phục dữ liệu mẫu ban đầu');
});

app.use((_req, res) => {
  return sendError(res, 404, 'ROUTE_NOT_FOUND', 'Endpoint API không tồn tại.');
});

if (!IS_VERCEL) {
  app.listen(PORT, () => {
    loadDb();
    console.log(`[API Server] Đang chạy tại http://localhost:${PORT}/api`);
  });
}

export default app;
