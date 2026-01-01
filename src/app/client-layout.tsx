'use client';

import { usePathname } from 'next/navigation';
import { Providers } from '@/components/providers';
import { Header } from '@/layouts/Header';
import { Footer } from '@/layouts/Footer';
import { Toaster } from 'sonner';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Auth pages: no header/footer
  const isAuthPage = pathname?.startsWith('/auth');

  return (
    <Providers>
      <Toaster position="top-center" richColors />
      {!isAuthPage && <Header />}
      <main className={!isAuthPage ? "min-h-screen" : ""}>{children}</main>
      {!isAuthPage && <Footer />}
    </Providers>
  );
}
