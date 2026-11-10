'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { apiError } from '@/services/community.service';

/** Sends signed-out users to login and brings them back here after. */
function useRequireLogin() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  return () => {
    if (isAuthenticated) return true;
    router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    return false;
  };
}

/** Opens (or reuses) a chat with the poster, then goes to it. */
export function ChatButton({
  startChat,
  disabled,
  label = 'Message',
}: {
  startChat: () => Promise<{ chatId: string }>;
  disabled?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const requireLogin = useRequireLogin();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={async () => {
        if (!requireLogin()) return;
        setBusy(true);
        try {
          const { chatId } = await startChat();
          router.push(`/messages/${chatId}`);
        } catch (error) {
          toast.error(apiError(error, 'Could not open the chat'));
        } finally {
          setBusy(false);
        }
      }}
      className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 disabled:opacity-60"
    >
      {busy ? 'Opening…' : label}
    </button>
  );
}

/** Lost & Found phone: hidden until an explicit tap (signed-in only). */
export function RevealPhoneButton({
  reveal,
}: {
  reveal: () => Promise<string>;
}) {
  const requireLogin = useRequireLogin();
  const [phone, setPhone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (phone) {
    return (
      <a
        href={`tel:${phone.replace(/[^\d+]/g, '')}`}
        className="block w-full text-center py-3 rounded-xl border-2 border-primary text-primary font-bold"
      >
        {phone}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!requireLogin()) return;
        setBusy(true);
        try {
          setPhone(await reveal());
        } catch (error) {
          toast.error(apiError(error, 'Could not show the number'));
        } finally {
          setBusy(false);
        }
      }}
      className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primaryLight disabled:opacity-60"
    >
      {busy ? 'Loading…' : 'Show phone number'}
    </button>
  );
}
