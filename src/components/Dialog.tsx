'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (dialog && e.target === dialog) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // We use a portal to ensure the dialog is rendered at the root level, avoiding z-index issues
  // But standard <dialog> works well too. Let's stick to standard <dialog> behavior but styled nicely.

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/50 bg-background rounded-xl shadow-2xl p-0 w-full max-w-md border border-border-custom outline-none open:animate-in open:fade-in open:zoom-in-95 backdrop:animate-in backdrop:fade-in"
      onCancel={onClose}
      onClick={handleBackdropClick}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-gray hover:text-text transition-colors"
          >
            <svg
              className="w-5 h-5"
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
        </div>
        <div className="text-text-gray mb-6">{children}</div>
        {footer && <div className="mt-4 flex justify-end gap-3">{footer}</div>}
      </div>
    </dialog>
  );
};
