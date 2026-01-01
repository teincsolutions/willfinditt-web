'use client';

import { useState, useEffect } from 'react';
import { useCountries, useStates, useCities } from '@/hooks/useLocations';

interface LocationSelectorProps {
  onLocationChange: (location: {
    countryId: string;
    stateId?: string;
    cityId?: string;
    addressString?: string;
  }) => void;
  initialCityId?: string;
}

export const LocationSelector = ({
  onLocationChange,
  initialCityId,
}: LocationSelectorProps) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  const { data: countries } = useCountries();
  const { data: states } = useStates(selectedCountry);
  const { data: cities } = useCities(selectedState);

  // If initialCityId is provided, we would ideally fetch the hierarchy backwards
  // For now, we'll start empty or rely on user selection.

  useEffect(() => {
    onLocationChange({
      countryId: selectedCountry,
      stateId: selectedState,
      cityId: selectedCity,
      addressString: `${
        cities?.find((c) => c.id === selectedCity)?.name || ''
      }, ${states?.find((s) => s.id === selectedState)?.name || ''}, ${
        countries?.find((c) => c.id === selectedCountry)?.name || ''
      }`,
    });
  }, [selectedCountry, selectedState, selectedCity]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Country</label>
        <select
          value={selectedCountry}
          onChange={(e) => {
            setSelectedCountry(e.target.value);
            setSelectedState('');
            setSelectedCity('');
          }}
          className="w-full border border-border-custom rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
        >
          <option value="">Select Country</option>
          {countries?.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">State/Region</label>
        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setSelectedCity('');
          }}
          disabled={!selectedCountry}
          className="w-full border border-border-custom rounded-lg px-3 py-2 disabled:bg-background-primary/50 disabled:text-text-gray/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
        >
          <option value="">Select State</option>
          {states?.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">City</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          disabled={!selectedState}
          className="w-full border border-border-custom rounded-lg px-3 py-2 disabled:bg-background-primary/50 disabled:text-text-gray/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
        >
          <option value="">Select City</option>
          {cities?.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
