'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSignedUrl } from '@/services/upload.service';

interface KycFileUploaderProps {
  label: string;
  help?: string;
  accept?: string;
  maxFiles?: number;
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  existingUrls?: string[];
}

const DEFAULT_ACCEPT = 'image/jpeg,image/png,application/pdf';
const MAX_BYTES = 10 * 1024 * 1024;

function isAllowed(file: File) {
  return (
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'application/pdf'
  );
}

function ExistingFile({ url }: { url: string }) {
  const [signedUrl, setSignedUrl] = useState('');
  const isPdf = url.toLowerCase().includes('.pdf');

  useEffect(() => {
    let cancelled = false;
    if (url.startsWith('s3://')) {
      getSignedUrl(url)
        .then((next) => {
          if (!cancelled) setSignedUrl(next);
        })
        .catch(() => undefined);
    } else {
      setSignedUrl(url);
    }
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!signedUrl) {
    return <span className="text-xs text-text-light-gray">Uploaded file</span>;
  }

  if (isPdf) {
    return (
      <a
        href={signedUrl}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-medium text-primary underline"
      >
        View uploaded PDF
      </a>
    );
  }

  return (
    <a href={signedUrl} target="_blank" rel="noreferrer">
      <img
        src={signedUrl}
        alt="Uploaded KYC document"
        className="h-16 w-16 rounded-lg border border-border-custom object-cover"
      />
    </a>
  );
}

export function KycFileUploader({
  label,
  help,
  accept = DEFAULT_ACCEPT,
  maxFiles = 5,
  files,
  onChange,
  disabled,
  existingUrls = [],
}: KycFileUploaderProps) {
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview.url) URL.revokeObjectURL(preview.url);
      });
    };
  }, [previews]);

  const addFiles = (incoming: File[]) => {
    setError('');
    const next = [...files];

    for (const file of incoming) {
      if (!isAllowed(file)) {
        setError('Use JPG, PNG or PDF files only.');
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is larger than 10 MB.`);
        continue;
      }
      if (next.length >= maxFiles) {
        setError(`You can upload up to ${maxFiles} files.`);
        break;
      }
      next.push(file);
    }

    onChange(next);
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-text">{label}</label>
        <span className="text-xs text-text-light-gray">
          {files.length}/{maxFiles}
        </span>
      </div>

      <label
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) addFiles(Array.from(event.dataTransfer.files));
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border-custom bg-background-primary/40 hover:border-primary/50'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <input
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            addFiles(Array.from(event.target.files || []));
            event.target.value = '';
          }}
        />
        <span className="text-sm font-medium text-text">
          Drop files here or click to browse
        </span>
        <span className="mt-1 text-xs text-text-light-gray">
          JPG, PNG or PDF · up to 10 MB each
        </span>
      </label>

      {help && <p className="mt-1 text-xs text-text-light-gray">{help}</p>}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}

      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {previews.map(({ file, url }) => (
            <div
              key={`${file.name}-${file.lastModified}`}
              className="relative overflow-hidden rounded-lg border border-border-custom bg-background"
            >
              {url ? (
                <img
                  src={url}
                  alt={file.name}
                  className="h-16 w-16 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center bg-background-primary text-xs font-bold text-text-gray">
                  PDF
                </div>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange(files.filter((candidate) => candidate !== file))
                }
                className="absolute right-0.5 top-0.5 rounded-full bg-black/70 px-1.5 text-xs text-white"
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && existingUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {existingUrls.map((url) => (
            <ExistingFile key={url} url={url} />
          ))}
        </div>
      )}
    </div>
  );
}
