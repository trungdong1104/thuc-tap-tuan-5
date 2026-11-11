import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductThumbnailProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProductThumbnail({
  src,
  alt,
  className = 'h-10 w-10',
}: ProductThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400 ${className}`}
      >
        <Package className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
