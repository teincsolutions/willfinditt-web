'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Providers } from '@/components/providers';
import { Header } from '@/layouts/Header';
import { Footer } from '@/layouts/Footer';
import { CategorySidebar } from '@/components/CategorySidebar';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const handleMenuClick = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  // Determine layout based on page type
  const isAuthPage = pathname?.startsWith('/auth');
  const isMainAdsPage =
    pathname === '/' ||
    pathname?.startsWith('/category/') ||
    pathname?.startsWith('/search') ||
    pathname === '/favorites';

  if (isAuthPage) {
    return <Providers>{children}</Providers>;
  }

  if (isMainAdsPage) {
    return (
      <Providers>
        <Header onMenuClick={handleMenuClick} />
        <div className="flex min-h-screen">
          <CategorySidebar
            isOpen={isSidebarOpen}
            onClose={handleSidebarClose}
          />
          <main className="flex-1 min-h-screen">{children}</main>
        </div>
        <Footer />
      </Providers>
    );
  }

  // Other pages: header only, no sidebar
  return (
    <Providers>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </Providers>
  );
}
