import api from './api';

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

  const response = await api.post<string[]>('/upload/ad-images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
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
