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

export const MobileDrawer = ({
  isOpen,
  onClose,
  categories,
}: MobileDrawerProps) => {
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
        <div className="flex items-center justify-between p-5 border-b border-border-custom bg-white">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <div className="relative w-10 h-10 overflow-hidden rounded-xl">
              <OptimizedImage
                src="/images/logo-icon.png"
                alt="WillfindITT Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-text">
              Willfind<span className="font-black text-primary">ITT</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-text-gray hover:text-text transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* User Profile Summary (if authenticated) */}
        {isAuthenticated && (
          <div className="px-5 py-4 bg-background-primary/30 border-b border-border-custom">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-black text-lg shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text font-bold truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-text-light-gray text-xs truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions - Now as a LIST */}
        <div className="p-3 border-b border-border-custom">
          {!isAuthenticated && (
            <div className="px-2 mb-3">
              <Link
                href="/auth/login"
                onClick={onClose}
                className="flex items-center justify-center w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20"
              >
                Sign in / Register
              </Link>
            </div>
          )}

          <div className="space-y-1">
            <Link
              href="/ads/new"
              onClick={onClose}
              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-background-primary transition-all group"
            >
              <div className="w-11 h-11 bg-successLight flex items-center justify-center rounded-xl text-success text-xl group-hover:scale-110 transition-transform">
                ➕
              </div>
              <div className="flex-1">
                <span className="font-bold text-text block">Post an Ad</span>
                <span className="text-[11px] text-text-light-gray font-medium">
                  Sell items quickly
                </span>
              </div>
            </Link>

            <Link
              href="/favorites"
              onClick={onClose}
              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-background-primary transition-all group"
            >
              <div className="w-11 h-11 bg-errorLight flex items-center justify-center rounded-xl text-error text-xl group-hover:scale-110 transition-transform">
                ❤️
              </div>
              <div className="flex-1">
                <span className="font-bold text-text block">Favorites</span>
                <span className="text-[11px] text-text-light-gray font-medium">
                  Saved listings
                </span>
              </div>
            </Link>

            <Link
              href="/messages"
              onClick={onClose}
              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-background-primary transition-all group"
            >
              <div className="w-11 h-11 bg-primaryLight flex items-center justify-center rounded-xl text-primary text-xl group-hover:scale-110 transition-transform">
                💬
              </div>
              <div className="flex-1">
                <span className="font-bold text-text block">Messages</span>
                <span className="text-[11px] text-text-light-gray font-medium">
                  Your conversations
                </span>
              </div>
            </Link>

            <Link
              href="/account"
              onClick={onClose}
              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-background-primary transition-all group"
            >
              <div className="w-11 h-11 bg-background-primary flex items-center justify-center rounded-xl text-brown text-xl group-hover:scale-110 transition-transform">
                👤
              </div>
              <div className="flex-1">
                <span className="font-bold text-text block">
                  Account Settings
                </span>
                <span className="text-[11px] text-text-light-gray font-medium">
                  Manage profile
                </span>
              </div>
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
                const country = countries.find((c) => c.id === e.target.value);
                if (country) setSelectedCountry(country);
              }}
              className="w-full appearance-none bg-background border border-border-custom rounded-xl px-4 py-3 text-sm font-bold text-text outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
            >
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  🇬🇭 {country.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-gray">
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          <p className="mt-2 px-1 text-[11px] text-text-light-gray font-medium">
            Currently browsing ads in {selectedCountry?.name || 'your region'}
          </p>
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
