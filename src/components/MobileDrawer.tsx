'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Category } from '@/types/category';
import { useLocation } from '@/contexts/LocationContext';
import { OptimizedImage } from './OptimizedImage';
import { CommunityNavLinks } from './community/CommunityNavLinks';

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
        className={`fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-custom bg-background-primary">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <div className="relative w-10 h-10 overflow-hidden rounded-xl">
              <OptimizedImage
                src="/images/logo-favicon.png"
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

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* User Profile Summary (if authenticated) */}
          {isAuthenticated && (
            <div className="px-5 py-4 bg-background-primary/30 border-b border-border-custom">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-black text-lg shadow-sm">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text font-bold truncate">
                    {user?.firstName} {user?.lastName}
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
                href="/post"
                onClick={onClose}
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-background-primary transition-all group"
              >
                <div className="w-11 h-11 bg-successLight flex items-center justify-center rounded-xl text-success group-hover:scale-110 transition-transform">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="font-bold text-text block">Post an Ad</span>
                  <span className="text-[11px] text-text-light-gray font-medium">
                    Sell items quickly
                  </span>
                </div>
              </Link>

              <CommunityNavLinks onNavigate={onClose} />

              <Link
                href="/favorites"
                onClick={onClose}
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-background-primary transition-all group"
              >
                <div className="w-11 h-11 bg-errorLight flex items-center justify-center rounded-xl text-error group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
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
                <div className="w-11 h-11 bg-primaryLight flex items-center justify-center rounded-xl text-primary group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M21 16c0 1.1-.9 2-2 2H7l-4 4V4c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v12z"
                    />
                  </svg>
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
                <div className="w-11 h-11 bg-background-primary flex items-center justify-center rounded-xl text-brown group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
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
                  const country = countries.find(
                    (c) => c.id === e.target.value
                  );
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
          <div className="p-4 lowercase">
            <h3 className="text-xs font-semibold text-text-light-gray uppercase tracking-wider mb-3">
              Browse Categories
            </h3>
            <ul className="space-y-1">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}?categoryId=${category.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-text hover:bg-background transition-colors"
                  >
                    {category.icon ? (
                      <OptimizedImage
                        src={category.icon}
                        alt=""
                        width={32}
                        height={32}
                        className="w-8 h-8 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-background-primary rounded-lg flex items-center justify-center text-text-light-gray">
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
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                    )}
                    <span className="font-medium capitalize flex-1">
                      {category.name}
                    </span>
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
