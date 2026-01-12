'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.id === value),
    [options, value]
  );

  const filteredOptions = useMemo(
    () =>
      options.filter((opt) =>
        opt.name.toLowerCase().includes(search.toLowerCase())
      ),
    [options, search]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={`w-full border border-border-custom rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer transition-all bg-background ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'
        } ${isOpen ? 'ring-2 ring-primary border-primary' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span
          className={`truncate ${!selectedOption ? 'text-text-light-gray' : 'text-text'}`}
        >
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-text-gray transition-transform ${
            isOpen ? 'rotate-180' : ''
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
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border-custom rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 border-b border-border-custom bg-background-primary/50">
            <input
              type="text"
              autoFocus
              className="w-full px-3 py-1.5 text-sm bg-background border border-border-custom rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-primary/5 transition-colors ${
                    opt.id === value
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-text'
                  }`}
                  onClick={() => handleSelect(opt.id)}
                >
                  {opt.name}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-text-light-gray italic text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
