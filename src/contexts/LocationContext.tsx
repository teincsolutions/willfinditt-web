'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Country, getCountries } from '@/services/location.service';

interface LocationContextType {
  selectedCountry: Country | null;
  setSelectedCountry: (country: Country) => void;
  selectedState: { id: string; name: string } | null;
  setSelectedState: (state: { id: string; name: string } | null) => void;
  selectedCity: { id: string; name: string } | null;
  setSelectedCity: (city: { id: string; name: string } | null) => void;
  countries: Country[];
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountryState] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<{ id: string; name: string } | null>(null);
  const [selectedCity, setSelectedCity] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await getCountries();
        setCountries(data);
        if (data.length > 0 && !selectedCountry) {
          const ghana = data.find(c => c.name.toLowerCase() === 'ghana');
          setSelectedCountryState(ghana || data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const setSelectedCountry = (country: Country) => {
    setSelectedCountryState(country);
    localStorage.setItem('selectedCountryId', country.id);
  };

  const handleSetSelectedCity = (city: { id: string; name: string } | null) => {
    setSelectedCity(city);
    if (city) {
      localStorage.setItem('selectedCityId', city.id);
      localStorage.setItem('selectedCityName', city.name);
    } else {
      localStorage.removeItem('selectedCityId');
      localStorage.removeItem('selectedCityName');
    }
  };

  // Rehydrate from localStorage
  useEffect(() => {
    const savedId = localStorage.getItem('selectedCountryId');
    if (savedId && countries.length > 0) {
      const saved = countries.find(c => c.id === savedId);
      if (saved) setSelectedCountryState(saved);
    }

    const savedCityId = localStorage.getItem('selectedCityId');
    const savedCityName = localStorage.getItem('selectedCityName');
    if (savedCityId && savedCityName) {
      setSelectedCity({ id: savedCityId, name: savedCityName });
    }
  }, [countries]);

  return (
    <LocationContext.Provider value={{ 
      selectedCountry, 
      setSelectedCountry, 
      selectedState, 
      setSelectedState,
      selectedCity, 
      setSelectedCity: handleSetSelectedCity,
      countries, 
      isLoading 
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
