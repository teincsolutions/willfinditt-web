'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const menuItems = [
  { label: 'Profile Information', href: '/account/profile', icon: '👤' },
  { label: 'My Ads', href: '/account/my-ads', icon: '📦' },
  { label: 'Security', href: '/account/security', icon: '🔒' },
  { label: 'Help & Support', href: '/account/threads', icon: '🆘' },
  { label: 'Saved Items', href: '/favorites', icon: '❤️' }, // External to /account, but managed here in menu
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login?redirect=' + pathname);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading)
    return <div className="p-10 text-center">Loading account...</div>;

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold text-text mb-8">My Account</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-background rounded-xl shadow-sm border border-border-custom overflow-hidden">
              <nav className="flex flex-col p-2">
                {menuItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-background-primary text-primary'
                          : 'text-text hover:bg-background-primary/50'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}

                <hr className="my-2 border-border-custom" />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-errorLight transition-colors text-left w-full"
                >
                  <span className="text-lg">🚪</span>
                  Sign Out
                </button>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 bg-background rounded-xl shadow-sm border border-border-custom p-6 min-h-[500px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
