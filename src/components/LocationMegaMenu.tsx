'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStates, useCities } from '@/hooks/useLocations';
import { useLocation } from '@/contexts/LocationContext';

interface LocationMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationMegaMenu = ({ isOpen, onClose }: LocationMegaMenuProps) => {
  const { selectedCountry, selectedState, setSelectedState, setSelectedCity } = useLocation();
  const [activeStateId, setActiveStateId] = useState<string | null>(selectedState?.id || null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: states } = useStates(selectedCountry?.id);
  const { data: cities } = useCities(activeStateId || undefined);

  // Set first state as active when states load if none is active
  useEffect(() => {
    if (states && states.length > 0 && !activeStateId) {
      setActiveStateId(states[0].id);
    }
  }, [states, activeStateId]);

  if (!isOpen) return null;

  const activeStateName = states?.find(s => s.id === activeStateId)?.name || '';

  const handleCitySelect = (cityId: string, cityName: string) => {
    const state = states?.find(s => s.id === activeStateId);
    if (state) setSelectedState({ id: state.id, name: state.name });
    setSelectedCity({ id: cityId, name: cityName });
    
    // Build new URL with cityId and cityName
    const params = new URLSearchParams(searchParams.toString());
    params.set('cityId', cityId);
    params.set('cityName', cityName);
    params.delete('page'); // Reset to page 1
    
    router.push(`/search?${params.toString()}`);
    onClose();
  };

  const handleClearLocation = () => {
    setSelectedCity(null);
    setSelectedState(null);
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete('cityId');
    params.delete('cityName');
    params.delete('page');
    
    router.push(`/search?${params.toString()}`);
    onClose();
  };

  return (
    <div
      className="absolute left-0 right-0 top-full pt-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="absolute top-0 left-0 right-0 h-4 -translate-y-full bg-transparent" />
      
      <div className="bg-background shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-border-custom rounded-b-3xl overflow-hidden">
        <div className="container mx-auto">
          <div className="flex w-full bg-background min-h-[450px] overflow-hidden">
            {/* States list */}
            <div className="w-80 flex-shrink-0 bg-background-primary/40 border-r border-border-custom p-6">
              <h3 className="text-[11px] font-bold text-text-light-gray uppercase tracking-[0.2em] mb-6 px-2">
                States / Regions
              </h3>
              <ul className="space-y-1.5 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {states?.map((state) => (
                  <li key={state.id}>
                    <button
                      onMouseEnter={() => setActiveStateId(state.id)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all duration-300 relative group ${
                        activeStateId === state.id
                          ? 'bg-background text-primary shadow-lg ring-1 ring-border-custom translate-x-1'
                          : 'text-text-gray hover:bg-background/60 hover:text-text'
                      }`}
                    >
                      <span className="font-bold text-base flex-1">{state.name}</span>
                      <svg
                        className={`w-4 h-4 transition-all duration-300 ${activeStateId === state.id ? 'opacity-100 translate-x-1 text-primary' : 'opacity-0 text-text-light-gray'}`}
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
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cities panel */}
            <div className="flex-1 min-w-0 bg-background p-10 relative overflow-y-auto max-h-[500px]">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-border-custom sticky top-0 bg-background z-10 -mx-10 px-10">
                <div>
                    <h3 className="text-3xl font-black text-text mb-2 tracking-tight">
                        {activeStateName || 'Select a State'}
                    </h3>
                    <p className="text-text-gray text-base font-medium">Browse listings in {activeStateName || 'your region'}</p>
                </div>
                <button 
                  onClick={handleClearLocation}
                  className="px-6 py-2 bg-background-primary hover:bg-background-primary/80 text-text-gray hover:text-text font-bold text-xs uppercase tracking-widest rounded-full transition-all border border-border-custom"
                >
                  Clear Location
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cities?.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city.id, city.name)}
                    className="group flex items-center gap-3 p-4 rounded-2xl border border-border-custom/50 hover:bg-background-primary hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all text-left"
                  >
                    <div className="w-2 h-2 rounded-full bg-border-custom group-hover:bg-primary transition-colors" />
                    <span className="font-bold text-text group-hover:text-primary transition-colors text-sm truncate">
                      {city.name}
                    </span>
                  </button>
                ))}
              </div>

              {activeStateId && (!cities || cities.length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 text-text-light-gray">
                   <div className="w-20 h-20 bg-background-primary rounded-full flex items-center justify-center mb-6 shadow-sm border border-border-custom">
                       <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                       </svg>
                   </div>
                   <p className="text-lg font-bold">Loading cities...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
