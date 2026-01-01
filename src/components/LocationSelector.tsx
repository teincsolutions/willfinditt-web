'use client';

import { useState, useEffect, useRef } from 'react';
import { useStates, useCities } from '@/hooks/useLocations';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from './Button';

interface LocationSelectorProps {
  onLocationChange: (loc: {
    countryId: string;
    stateId: string;
    cityId: string;
  }) => void;
  initialCityId?: string;
  initialCityName?: string;
}

export const LocationSelector = ({
  onLocationChange,
  initialCityId,
  initialCityName,
}: LocationSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedCountry } = useLocation();
  const [activeState, setActiveState] = useState<string | null>(null);
  const [activeCityName, setActiveCityName] = useState(initialCityName || '');

  const containerRef = useRef<HTMLDivElement>(null);

  const { data: states } = useStates(selectedCountry?.id);
  const { data: cities } = useCities(activeState || undefined);

  // Set first state as active when states load
  useEffect(() => {
    if (states && states.length > 0 && !activeState) {
      setActiveState(states[0].id);
    }
  }, [states, activeState]);

  // Close when clicking outside
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

  const handleCitySelect = (cityId: string, cityName: string) => {
    setActiveCityName(cityName);
    onLocationChange({
      countryId: selectedCountry?.id || '',
      stateId: activeState || '',
      cityId: cityId,
    });
    setIsOpen(false);
  };

  const activeStateName = states?.find((s) => s.id === activeState)?.name || '';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-background-primary/30 border border-border-custom rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold text-left"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-primary">📍</span>
          <span className="truncate">
            {activeCityName || 'Select Location'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-[500px] max-w-[90vw] bg-background shadow-2xl border border-border-custom rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex h-[400px]">
            {/* States List */}
            <div className="w-1/3 bg-background-primary/30 border-r border-border-custom overflow-y-auto custom-scrollbar">
              <div className="p-3">
                <p className="text-[10px] font-black text-text-light-gray uppercase tracking-widest mb-3 px-2">
                  States
                </p>
                <div className="space-y-1">
                  {states?.map((state) => (
                    <button
                      key={state.id}
                      onMouseEnter={() => setActiveState(state.id)}
                      onClick={() => setActiveState(state.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all ${
                        activeState === state.id
                          ? 'bg-background text-primary shadow-sm'
                          : 'text-text-gray hover:bg-background/50 hover:text-text'
                      }`}
                    >
                      <span className="truncate">{state.name}</span>
                      {activeState === state.id && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                  {(!states || states.length === 0) && (
                    <p className="text-xs text-text-light-gray p-2 italic text-center">
                      Loading states...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Cities List */}
            <div className="flex-1 bg-background overflow-y-auto custom-scrollbar p-4">
              <p className="text-[10px] font-black text-text-light-gray uppercase tracking-widest mb-4 px-2">
                Cities in {activeStateName || 'State'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {cities?.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city.id, city.name)}
                    className="flex items-center gap-2 p-3 rounded-xl hover:bg-background-primary text-sm font-bold text-text-gray hover:text-primary transition-all border border-transparent hover:border-primary/10 group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-border-custom group-hover:bg-primary transition-colors" />
                    <span className="truncate">{city.name}</span>
                  </button>
                ))}
                {activeState && (!cities || cities.length === 0) && (
                  <div className="col-span-2 py-10 flex flex-col items-center justify-center text-text-light-gray">
                    <svg
                      className="w-8 h-8 opacity-20 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-widest">
                      Loading cities...
                    </p>
                  </div>
                )}
                {!activeState && (
                  <div className="col-span-2 py-10 text-center text-text-light-gray italic text-xs font-medium">
                    Select a state to see cities
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-background-primary/50 border-t border-border-custom text-center">
            <button
              onClick={() => {
                setActiveCityName('');
                onLocationChange({
                  countryId: '',
                  stateId: '',
                  cityId: '',
                });
                setIsOpen(false);
              }}
              className="text-xs font-black text-text-gray hover:text-primary uppercase tracking-[0.2em] transition-colors"
            >
              Clear Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
