'use client';

import { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/Button';
import { MegaMenu } from '@/components/MegaMenu';
import { LocationMegaMenu } from '@/components/LocationMegaMenu';
import { MobileDrawer } from '@/components/MobileDrawer';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useParentCategories } from '@/hooks/useCategories';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useChatUnreadCount } from '@/hooks/useChat';
import { OptimizedImage } from '@/components/OptimizedImage';

export const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { selectedCountry, setSelectedCountry, countries, selectedCity } =
    useLocation();

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const locationCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (locationCloseTimeoutRef.current)
      clearTimeout(locationCloseTimeoutRef.current);
    setIsLocationMenuOpen(false);
    setIsMegaMenuOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 150);
  };

  const handleLocationMouseEnter = () => {
    if (locationCloseTimeoutRef.current)
      clearTimeout(locationCloseTimeoutRef.current);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsMegaMenuOpen(false);
    setIsLocationMenuOpen(true);
  };

  const handleLocationMouseLeave = () => {
    locationCloseTimeoutRef.current = setTimeout(() => {
      setIsLocationMenuOpen(false);
    }, 150);
  };

  // Fetch categories for navigation
  const { data: categories = [] } = useParentCategories(true);

  // Fetch unread notifications count
  const { data: unreadCount = 0 } = useUnreadCount();
  // Fetch unread chat messages count
  const unreadChatCount = useChatUnreadCount();

  return (
    <>
      <header className="bg-background shadow-sm border-b border-border-custom sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 mr-2 hover:bg-background/50 rounded-lg transition-colors"
              aria-label="Open menu"
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
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
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

            {/* Country Selector */}
            <div className="hidden lg:flex items-center ml-6 border-l border-border-custom pl-6">
              <div className="relative group">
                <select
                  value={selectedCountry?.id || ''}
                  onChange={(e) => {
                    const country = countries.find(
                      (c) => c.id === e.target.value
                    );
                    if (country) setSelectedCountry(country);
                  }}
                  className="appearance-none bg-transparent hover:bg-background-primary/50 text-text font-bold text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border-custom transition-all outline-none cursor-pointer pr-8"
                >
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      🇬🇭 {country.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-gray">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <SearchBar />
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Sell Button */}
              <Link href="/post">
                <Button
                  size="sm"
                  className="bg-primary hover:opacity-90 shadow-md flex flex-row items-center"
                >
                  <div>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span>Sell</span>
                </Button>
              </Link>

              {/* Favorites */}
              <Link
                href="/favorites"
                className="p-2 hover:bg-background/50 rounded-lg transition-colors relative"
                title="Favorites"
              >
                <svg
                  className="w-6 h-6 text-text-gray"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </Link>

              {/* Messages with notification badge */}
              <Link
                href="/messages"
                className="p-2 hover:bg-background/50 rounded-lg transition-colors relative"
                title="Messages"
              >
                <svg
                  className="w-6 h-6 text-text-gray"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <Link
                href="/notifications"
                className="p-2 hover:bg-background/50 rounded-lg transition-colors relative"
                title="Notifications"
              >
                <svg
                  className="w-6 h-6 text-text-gray"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-background/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shadow-sm bg-primary">
                    {user?.avatar ? (
                      <OptimizedImage
                        src={user.avatar}
                        alt={`${user?.firstName || 'User'} profile picture`}
                        width={32}
                        height={32}
                        className="object-cover w-8 h-8"
                      />
                    ) : (
                      <span className="text-white font-medium text-sm">
                        {user?.firstName
                          ? user.firstName.charAt(0).toUpperCase()
                          : '👤'}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 text-text-gray transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
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
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-background rounded-xl shadow-xl border border-border-custom py-2 z-50">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-3 border-b border-border-custom">
                          <p className="font-semibold text-text">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-sm text-text-gray">
                            {user?.email}
                          </p>
                        </div>
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2.5 text-text hover:bg-background transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
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
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>My Account</span>
                        </Link>
                        <Link
                          href="/account/my-ads"
                          className="flex items-center gap-3 px-4 py-2.5 text-text hover:bg-background transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
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
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                          <span>My Ads</span>
                        </Link>
                        <Link
                          href="/account/threads"
                          className="flex items-center gap-3 px-4 py-2.5 text-text hover:bg-background transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
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
                              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                          <span>Help & Support</span>
                        </Link>
                        <hr className="my-2" />
                        <button
                          onClick={() => {
                            logout();
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-error hover:bg-errorLight transition-colors w-full text-left"
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
                          <span>Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth/login"
                          className="flex items-center gap-3 px-4 py-2.5 text-text hover:bg-background transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
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
                              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                            />
                          </svg>
                          <span>Sign In</span>
                        </Link>
                        <Link
                          href="/auth/register"
                          className="flex items-center gap-3 px-4 py-2.5 text-text hover:bg-background transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
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
                              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                          </svg>
                          <span>Create Account</span>
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center space-x-1">
              <Link
                href="/messages"
                className="p-2 hover:bg-background-primary rounded-lg transition-colors relative"
              >
                <svg
                  className="w-5 h-5 text-text-gray"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </Link>
              <Link
                href="/post"
                className="p-2 bg-success hover:opacity-90 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-3">
            <SearchBar />
          </div>

          {/* Desktop Category Navigation Bar */}
          <div className="hidden lg:block border-t border-border-custom px-4">
            <nav className="flex items-center justify-between py-2 relative">
              {/* All Categories Button with Mega Menu */}
              <div
                className="py-2"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:shadow-lg transition-all cursor-pointer select-none">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  <span>All Categories</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Mega Menu - anchored via absolute positioning in the component */}
                <Suspense fallback={null}>
                  <MegaMenu
                    categories={categories}
                    isOpen={isMegaMenuOpen}
                    onClose={() => {
                      setIsMegaMenuOpen(false);
                      if (closeTimeoutRef.current)
                        clearTimeout(closeTimeoutRef.current);
                    }}
                  />
                </Suspense>
              </div>

              {/* Location Selector Button with Mega Menu */}
              <div
                className="py-2"
                onMouseEnter={handleLocationMouseEnter}
                onMouseLeave={handleLocationMouseLeave}
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-background-primary/50 text-text border border-border-custom rounded-lg font-medium shadow-sm hover:shadow-lg hover:border-primary transition-all cursor-pointer select-none">
                  <span className="text-primary">📍</span>
                  <span className="whitespace-nowrap">
                    {selectedCity?.name || 'Gh, Anywhere'}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isLocationMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                <Suspense fallback={null}>
                  <LocationMegaMenu
                    isOpen={isLocationMenuOpen}
                    onClose={() => {
                      setIsLocationMenuOpen(false);
                      if (locationCloseTimeoutRef.current)
                        clearTimeout(locationCloseTimeoutRef.current);
                    }}
                  />
                </Suspense>
              </div>

              {/* Quick Category Links */}
              <div className="flex items-center gap-1">
                {categories.slice(0, 6).map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug || category.id}?categoryId=${category.id}`}
                    className="px-3 py-2 text-sm font-medium text-text-gray hover:text-primary hover:bg-background-primary rounded-lg transition-colors whitespace-nowrap"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        categories={categories}
      />
    </>
  );
};
