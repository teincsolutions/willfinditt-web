'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  containerClassName?: string;
}

export const OptimizedImage = ({
  src,
  alt,
  className,
  containerClassName,
  ...props
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    if (retryCount < 3) {
      setIsLoading(true);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 3000); // Wait 3 seconds before retry
    }
  };

  const isSmall = (props.width && Number(props.width) < 150) || (props.height && Number(props.height) < 150);

  return (
    <div 
        className={cn(
            'relative overflow-hidden bg-background-primary/30', 
            props.fill ? 'absolute inset-0 w-full h-full' : 'inline-block max-w-full',
            isLoading && !props.fill && !isSmall ? 'min-h-[200px]' : '',
            containerClassName
        )}
    >
      {/* Splash/Loading State */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-background-primary z-10 transition-opacity duration-300" />
      )}
      
      {src && (
        <Image
          key={`${src}-${retryCount}`}
          src={src}
          alt={alt}
          width={props.width || (!props.fill ? 1200 : undefined)}
          height={props.height || (!props.fill ? 800 : undefined)}
          className={cn(
            'transition-all duration-700 ease-in-out',
            (!props.fill && !props.width && !props.height) ? 'w-full h-auto' : '',
            isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100',
            className
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            handleRetry();
          }}
          unoptimized
          {...props}
        />
      )}
    </div>
  );
};
