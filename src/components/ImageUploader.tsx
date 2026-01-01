'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadAdImages } from '@/services/upload.service';
import { OptimizedImage } from './OptimizedImage';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
}

export const ImageUploader = ({
  images,
  onImagesChange,
  maxImages = 5,
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > maxImages) {
        setError(`You can only upload up to ${maxImages} images.`);
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const uploadedUrls = await uploadAdImages(acceptedFiles);
        onImagesChange([...images, ...uploadedUrls]);
      } catch (err) {
        console.error('Upload failed:', err);
        setError('Failed to upload images. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [images, maxImages, onImagesChange]
  );

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    disabled: isUploading || images.length >= maxImages,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-background-primary'
            : 'border-border-custom hover:border-primary/50 hover:bg-background-primary/20'
        } ${
          isUploading || images.length >= maxImages
            ? 'opacity-50 cursor-not-allowed'
            : ''
        }`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-primary font-medium">Uploading...</p>
          </div>
        ) : images.length >= maxImages ? (
          <div className="text-text-gray">
            <svg
              className="w-10 h-10 mx-auto mb-2 text-text-light-gray"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p>Maximum images reached</p>
          </div>
        ) : (
          <div>
            <svg
              className="w-10 h-10 mx-auto mb-3 text-text-light-gray"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-text font-medium">
              Drag & drop images here, or click to select
            </p>
            <p className="text-text-gray text-sm mt-1">
              Supports JPG, PNG, WEBP (Max 5MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-errorLight text-error p-3 rounded-lg text-sm border border-error/10">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((url, index) => (
            <div key={url} className="relative group aspect-square">
              <OptimizedImage
                src={url}
                alt={`Uploaded ${index + 1}`}
                fill
                containerClassName="w-full h-full rounded-lg border border-border-custom"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-error text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-error/80"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
