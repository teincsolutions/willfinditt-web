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
          'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-primary text-white hover:opacity-90 shadow-md hover:shadow-lg':
              variant === 'primary',
            'bg-secondary text-black hover:opacity-90': variant === 'secondary',
            'border-2 border-border-custom text-foreground hover:bg-background-primary':
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
