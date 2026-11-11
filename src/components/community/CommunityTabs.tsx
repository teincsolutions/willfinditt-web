'use client';

import { useSections } from '@/hooks/useCommunity';
import type { SectionFlag } from '@/types/community';

export type CommunityTab = 'notices' | 'lost-found' | 'dating';

const TABS: { value: CommunityTab; label: string; key: 'event_notices' | 'lost_found' | 'dating' }[] = [
  { value: 'notices', label: 'Events & Notices', key: 'event_notices' },
  { value: 'lost-found', label: 'Lost & Found', key: 'lost_found' },
  { value: 'dating', label: 'Dating', key: 'dating' },
];

/**
 * The web equivalent of the app's community tabs: a sticky, scrollable
 * switcher. Dating stays hidden until the Phase 2 flag is ON.
 */
export function CommunityTabs({
  value,
  onChange,
  initial,
  className = '',
}: {
  value: CommunityTab;
  onChange: (value: CommunityTab) => void;
  initial?: SectionFlag[];
  className?: string;
}) {
  const { data } = useSections(initial);
  const stateOf = (key: (typeof TABS)[number]['key']) =>
    data?.find((flag) => flag.key === key)?.state;

  const visible = TABS.filter((tab) => {
    const state = stateOf(tab.key);
    if (!state || state === 'OFF') return false;
    if (tab.key === 'dating') return state === 'ON';
    return state === 'ON' || state === 'READ_ONLY';
  });

  if (!visible.length) return null;

  return (
    <div
      role="tablist"
      aria-label="Community sections"
      className={`flex items-center gap-1 overflow-x-auto ${className}`}
    >
      {visible.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-gray hover:bg-background-primary hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
