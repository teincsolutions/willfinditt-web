'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 mr-2 hover:bg-gray-100 rounded-lg transition-colors"
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

          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Willfind8</span>
          </Link>

          {/* Search Bar - Hidden on mobile, shown on larger screens */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <SearchBar />
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Quick Actions */}
            <Link href="/ads/new">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <span className="mr-1">➕</span>
                Sell
              </Button>
            </Link>

            <Link href="/favorites">
              <Button variant="outline" size="sm">
                <span className="mr-1">❤️</span>
                Favorites
              </Button>
            </Link>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">
                  {user?.name || 'Account'}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                        Signed in as {user?.email}
                      </div>
                      <Link
                        href="/messages"
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span>💬</span>
                        <span>Messages</span>
                      </Link>
                      <Link
                        href="/account"
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span>⚙️</span>
                        <span>Account Settings</span>
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                      >
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/messages"
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span>💬</span>
                        <span>Messages</span>
                      </Link>
                      <Link
                        href="/account"
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span>⚙️</span>
                        <span>Account Settings</span>
                      </Link>
                      <hr className="my-1" />
                      <Link
                        href="/auth/login"
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span>🔐</span>
                        <span>Sign In</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search and Actions */}
          <div className="flex lg:hidden items-center space-x-2">
            {/* Mobile Search Button */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Mobile User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">👤</span>
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/ads/new"
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span>➕</span>
                    <span>Sell</span>
                  </Link>
                  <Link
                    href="/favorites"
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span>❤️</span>
                    <span>Favorites</span>
                  </Link>
                  <Link
                    href="/messages"
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span>💬</span>
                    <span>Messages</span>
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span>⚙️</span>
                    <span>Account Settings</span>
                  </Link>
                  <hr className="my-1" />
                  <Link
                    href="/auth/login"
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span>🔐</span>
                    <span>Sign In</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Full width below header on mobile */}
        <div className="md:hidden pb-3">
          <SearchBar />
        </div>
      </div>
    </header>
  );
};
