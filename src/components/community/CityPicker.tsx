'use client';

import { useState } from 'react';
import { useCities, useCountries, useStates } from '@/hooks/useLocations';

const selectClass =
  'w-full rounded-lg border border-border-custom bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

/**
 * Region -> city picker (Ghana first). Reports the chosen city id, or ''
 * for none. Starting with an existing city shows it as a single option.
 */
export function CityPicker({
  value,
  initialName,
  onChange,
  label = 'City / town',
}: {
  value: string;
  initialName?: string | null;
  onChange: (cityId: string) => void;
  label?: string;
}) {
  const { data: countries } = useCountries();
  const country =
    countries?.find((c) => c.name.toLowerCase() === 'ghana') ?? countries?.[0];
  const [stateId, setStateId] = useState('');
  const { data: states } = useStates(country?.id);
  const { data: cities } = useCities(stateId || undefined);
  // Shows the saved city until the user chooses to change it.
  const [keepInitial, setKeepInitial] = useState(Boolean(value));

  return (
    <div>
      <span className="block text-sm font-semibold mb-1">{label}</span>
      {keepInitial && value ? (
        <div className="flex items-center gap-3">
          <span className="text-sm">{initialName || 'Selected city'}</span>
          <button
            type="button"
            className="text-sm text-primary font-semibold"
            onClick={() => {
              setKeepInitial(false);
              onChange('');
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            aria-label="Region"
            className={selectClass}
            value={stateId}
            onChange={(e) => {
              setStateId(e.target.value);
              onChange('');
            }}
          >
            <option value="">Region</option>
            {states?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            aria-label="City"
            className={selectClass}
            value={value}
            disabled={!stateId}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">City / town</option>
            {cities?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
