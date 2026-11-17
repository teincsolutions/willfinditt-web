'use client';

import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Share a notice or lost & found post. Uses the phone's share menu
 * (WhatsApp, Facebook, SMS…) where available; on a computer it opens
 * WhatsApp Web with the message, and the link can be copied.
 * Same message shape as the app's ad sharing (title + link).
 */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const [open, setOpen] = useState(false);
  const url =
    typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
  const text = `${title}\n\n${url}`;

  const share = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch {
        // Cancelled or not allowed: fall back to the menu below.
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={share}
        className="w-full py-3 rounded-xl border border-border-custom font-bold hover:bg-background-primary"
      >
        Share
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-border-custom bg-white p-2 space-y-1">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noreferrer"
            className="block px-3 py-2 rounded-lg hover:bg-background-primary font-semibold"
          >
            Share on WhatsApp
          </a>
          <button
            type="button"
            className="block w-full text-left px-3 py-2 rounded-lg hover:bg-background-primary font-semibold"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied');
              } catch {
                toast.error('Could not copy the link');
              }
              setOpen(false);
            }}
          >
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}
