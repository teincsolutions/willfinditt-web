'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';

export const SearchBar = () => {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex flex-1 max-w-md">
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ads..."
          className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-l-lg focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500 text-sm"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </div>
      </div>
      <Button
        onClick={handleSearch}
        className="rounded-l-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
      >
        Search
      </Button>
    </div>
  );
};
