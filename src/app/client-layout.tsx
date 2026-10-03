'use client';

import { usePathname } from 'next/navigation';
import { Providers } from '@/components/providers';
import { Header } from '@/layouts/Header';
import { Footer } from '@/layouts/Footer';
import { Toaster } from 'sonner';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { googleClientId, isGoogleSignInConfigured } from '@/lib/google-auth';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Auth pages: no header/footer
  const isAuthPage = pathname?.startsWith('/auth');

  const content = (
    <Providers>
      <Toaster position="top-center" richColors />
      {!isAuthPage && <Header />}
      <main className={!isAuthPage ? 'min-h-screen' : ''}>{children}</main>
      {!isAuthPage && <Footer />}
    </Providers>
  );

  // Skip the provider when unconfigured: initializing Google with an empty
  // client_id surfaces as "Error 400: invalid_request" on their consent page.
  if (!isGoogleSignInConfigured) {
    return content;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>
  );
}
