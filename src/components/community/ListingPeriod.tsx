'use client';

import { useState } from 'react';
import { addDays, format } from 'date-fns';
import { toast } from 'sonner';
import { apiError } from '@/services/community.service';
import type { ListingPeriodInput, ListingRules } from '@/types/community';
import { inputClass } from './form';

/** Used until form-config has loaded (same as the server defaults). */
export const DEFAULT_LISTING: ListingRules = {
  choices: [7, 14, 30, 60, 90],
  defaultDays: 30,
  minDays: 7,
  maxDays: 90,
  purgeAfterDays: 30,
};

const dateInput = (d: Date) => format(d, 'yyyy-MM-dd');

/** The end date a choice gives, for the "Expires on" line. */
export function listingEnd(
  value: ListingPeriodInput,
  rules: ListingRules,
  from = new Date()
): Date {
  if (value.listUntil) return new Date(value.listUntil);
  return addDays(from, value.listingDays ?? rules.defaultDays);
}

/**
 * How long a post stays listed: 7 / 14 / 30 / 60 / 90 days, or a date
 * between the minimum and maximum (from form-config).
 */
export function ListingPeriodPicker({
  value,
  onChange,
  rules = DEFAULT_LISTING,
}: {
  value: ListingPeriodInput;
  onChange: (value: ListingPeriodInput) => void;
  rules?: ListingRules;
}) {
  const custom = Boolean(value.listUntil);
  const today = new Date();
  const min = dateInput(addDays(today, rules.minDays));
  const max = dateInput(addDays(today, rules.maxDays));
  const end = listingEnd(value, rules);

  return (
    <fieldset>
      <legend className="block text-sm font-semibold mb-2">
        How long should it stay up?
      </legend>
      <div className="flex flex-wrap gap-2">
        {rules.choices.map((days) => {
          const selected =
            !custom && (value.listingDays ?? rules.defaultDays) === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() => onChange({ listingDays: days })}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                selected
                  ? 'bg-primary text-white border-primary'
                  : 'border-border-custom hover:bg-background-primary'
              }`}
            >
              {days} days
            </button>
          );
        })}
        <button
          type="button"
          onClick={() =>
            onChange({
              // End of the chosen day, local time.
              listUntil: new Date(`${min}T23:59:00`).toISOString(),
            })
          }
          className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
            custom
              ? 'bg-primary text-white border-primary'
              : 'border-border-custom hover:bg-background-primary'
          }`}
        >
          Pick a date
        </button>
      </div>
      {custom && (
        <input
          type="date"
          className={`${inputClass} mt-3 max-w-xs`}
          min={min}
          max={max}
          value={value.listUntil ? dateInput(new Date(value.listUntil)) : min}
          onChange={(e) =>
            e.target.value &&
            onChange({
              listUntil: new Date(`${e.target.value}T23:59:00`).toISOString(),
            })
          }
        />
      )}
      <p className="text-xs text-text-gray mt-2">
        Expires on {format(end, 'EEEE d MMMM yyyy')}. You can renew it later.
      </p>
    </fieldset>
  );
}

/** "Expires on …" / "Ended on …" line for a post the user owns. */
export function ExpiryText({ expiresAt }: { expiresAt: string }) {
  const end = new Date(expiresAt);
  const [now] = useState(() => Date.now());
  const ended = end.getTime() <= now;
  return (
    <span>
      {ended ? 'Ended' : 'Expires'} on {format(end, 'd MMM yyyy')}
    </span>
  );
}

/** Renew and Delete for the owner's list. */
export function ListingActions({
  rules = DEFAULT_LISTING,
  canRenew,
  onRenew,
  onDelete,
}: {
  rules?: ListingRules;
  canRenew: boolean;
  onRenew: (value: ListingPeriodInput) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  const [renewing, setRenewing] = useState(false);
  const [value, setValue] = useState<ListingPeriodInput>({
    listingDays: rules.defaultDays,
  });
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, done: string, fail: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(done);
      setRenewing(false);
    } catch (error) {
      toast.error(apiError(error, fail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-4 text-sm font-semibold">
        {canRenew && (
          <button
            type="button"
            onClick={() => setRenewing((v) => !v)}
            className="text-primary"
          >
            Renew
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (
              window.confirm(
                'Delete this post and its photos? This cannot be undone.'
              )
            ) {
              void run(onDelete, 'Post deleted', 'Could not delete the post');
            }
          }}
          className="text-error disabled:opacity-60"
        >
          Delete
        </button>
      </div>
      {renewing && (
        <div className="mt-3 rounded-lg border border-border-custom p-3 space-y-3">
          <ListingPeriodPicker value={value} onChange={setValue} rules={rules} />
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(() => onRenew(value), 'Renewed', 'Could not renew the post')
            }
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Renew'}
          </button>
        </div>
      )}
    </div>
  );
}
