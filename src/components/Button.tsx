import { clsx } from 'clsx';
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', className, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg':
              variant === 'primary',
            'bg-gray-600 text-white hover:bg-gray-700': variant === 'secondary',
            'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400':
              variant === 'outline',
            'px-3 py-2 text-sm': size === 'sm',
            'px-4 py-2.5 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
