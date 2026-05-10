import api from './api';
import { convertS3UrlToSignedRequest } from '@/lib/s3Utils';

export interface UploadResponse {
  url: string;
  key: string;
}

export interface MultiUploadResponse {
  urls: string[];
}

export const uploadAdImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await api.post<string[] | MultiUploadResponse>(
    '/upload/ad-images',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  // Handle both response shapes: direct string[] or { urls: string[] }
  const data = response.data;
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'urls' in data) {
    return (data as MultiUploadResponse).urls;
  }
  console.error('Unexpected upload response format:', data);
  throw new Error('Unexpected upload response format');
};

export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{ url: string }>('/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.url;
};

export const uploadSingle = async (
  file: File,
  bucketType: 'PUBLIC_ASSETS' | 'ADS_MEDIA' | 'USER_CONTENT'
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucketType', bucketType);

  const response = await api.post<{ url: string }>('/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.url;
};

export const getSignedUrl = async (s3Url: string): Promise<string> => {
  const requestPath = convertS3UrlToSignedRequest(s3Url);
  const response = await api.get<{ url: string }>(requestPath, {
    params: { expiresIn: 259200 },
  });
  return response.data.url;
};
