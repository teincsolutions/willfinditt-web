'use client';

/* eslint-disable @next/next/no-img-element -- short-lived signed links */
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { apiError, uploadCommunityImage } from '@/services/community.service';

export interface UploadedImage {
  assetId: string;
  url: string | null;
}

/** Same limit as the server (POST /community/media). */
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Image picker for community posts. Each file is uploaded on its own to the
 * private community store, which strips location data, and the form keeps
 * the returned asset ids. Uploading one at a time means the number of
 * photos is limited only by the form, not by the upload endpoint.
 */
export function CommunityImageUploader({
  images,
  onChange,
  max,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max: number;
}) {
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (files: File[]) => {
      setError(null);
      const room = max - images.length;
      if (files.length > room) {
        setError(`You can add up to ${max} image${max === 1 ? '' : 's'} here.`);
        files = files.slice(0, Math.max(room, 0));
      }
      let current = images;
      for (const file of files) {
        setUploading((n) => n + 1);
        try {
          const uploaded = await uploadCommunityImage(file);
          current = [...current, uploaded];
          onChange(current);
        } catch (err) {
          setError(apiError(err, `Could not upload ${file.name}.`));
        } finally {
          setUploading((n) => n - 1);
        }
      }
    },
    [images, max, onChange]
  );

  const full = images.length >= max;
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic'] },
    maxSize: MAX_BYTES,
    disabled: uploading > 0 || full,
    onDropRejected: () => setError('Use a JPG, PNG, WEBP or HEIC photo up to 8 MB.'),
  });

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div
              key={img.assetId}
              className="relative aspect-square rounded-lg overflow-hidden bg-background-primary"
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-text-gray">
                  Photo
                </div>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white text-sm"
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {!full && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-background-primary'
              : 'border-border-custom hover:border-primary/50'
          } ${uploading ? 'opacity-60 cursor-wait' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <p className="text-primary font-medium">Uploading…</p>
          ) : (
            <>
              <p className="font-medium">Tap to add photos, or drag them here</p>
              <p className="text-text-gray text-sm mt-1">
                JPG, PNG, WEBP or HEIC, up to 8 MB. Location data is removed.
              </p>
            </>
          )}
        </div>
      )}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
