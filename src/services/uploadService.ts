import type { ApiResponse, UploadedFileResponse } from '@/types/api';
import { httpClient } from './httpClient';

export const uploadService = {
  async uploadImage(file: File): Promise<ApiResponse<UploadedFileResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await httpClient.post<ApiResponse<UploadedFileResponse>>(
      '/uploads',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },
};
