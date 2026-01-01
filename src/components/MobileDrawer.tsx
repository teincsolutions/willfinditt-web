'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Category } from '@/types/category';
import { useLocation } from '@/contexts/LocationContext';
import { OptimizedImage } from './OptimizedImage';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export const MobileDrawer = ({ isOpen, onClose, categories }: MobileDrawerProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { selectedCountry, setSelectedCountry, countries } = useLocation();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-custom bg-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-background/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            {isAuthenticated ? (
              <div>
                <p className="text-white font-semibold">{user?.name || 'User'}</p>
                <p className="text-white/70 text-sm">{user?.email}</p>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={onClose}
                className="text-white font-semibold hover:underline"
              >
                Sign in / Register
              </Link>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-border-custom">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/ads/new"
              onClick={onClose}
              className="flex flex-col items-center gap-2 p-4 bg-successLight rounded-xl text-success hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">➕</span>
              <span className="font-medium text-sm">Sell</span>
            </Link>
            <Link
              href="/favorites"
              onClick={onClose}
              className="flex flex-col items-center gap-2 p-4 bg-errorLight rounded-xl text-error hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">❤️</span>
              <span className="font-medium text-sm">Favorites</span>
            </Link>
            <Link
              href="/messages"
              onClick={onClose}
              className="flex flex-col items-center gap-2 p-4 bg-primaryLight rounded-xl text-primary hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">💬</span>
              <span className="font-medium text-sm">Messages</span>
            </Link>
            <Link
              href="/account"
              onClick={onClose}
              className="flex flex-col items-center gap-2 p-4 bg-background-primary/50 rounded-xl text-brown hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">👤</span>
              <span className="font-medium text-sm">Account</span>
            </Link>
          </div>
        </div>

        {/* Location Selection */}
        <div className="p-4 border-b border-border-custom bg-background-primary/20">
            <h3 className="text-xs font-semibold text-text-light-gray uppercase tracking-wider mb-3 px-1">
                Local Targeting
            </h3>
            <div className="relative group">
                <select
                    value={selectedCountry?.id || ''}
                    onChange={(e) => {
                        const country = countries.find(c => c.id === e.target.value);
                        if (country) setSelectedCountry(country);
                    }}
                    className="w-full appearance-none bg-background border border-border-custom rounded-xl px-4 py-3 text-sm font-bold text-text outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                >
                    {countries.map(country => (
                        <option key={country.id} value={country.id}>
                            🇬🇭 {country.name}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-gray">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            <p className="mt-2 px-1 text-[11px] text-text-light-gray font-medium">Currently browsing ads in {selectedCountry?.name || 'your region'}</p>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-text-light-gray uppercase tracking-wider mb-3">
              Browse Categories
            </h3>
            <ul className="space-y-1">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug || category.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-text hover:bg-background transition-colors"
                  >
                    {category.icon ? (
                      <OptimizedImage
                        src={category.icon}
                        alt=""
                        width={32}
                        height={32}
                        className="w-8 h-8 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-background-primary rounded-lg flex items-center justify-center">
                        <span className="text-sm">📦</span>
                      </div>
                    )}
                    <span className="font-medium flex-1">{category.name}</span>
                    <svg
                      className="w-4 h-4 text-text-light-gray"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        {isAuthenticated && (
          <div className="p-4 border-t border-border-custom">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-error hover:bg-errorLight rounded-xl transition-colors"
            >
              <span>🚪</span>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
