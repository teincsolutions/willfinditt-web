'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  ariaLabel?: string;
  className?: string;
}

// Radix does not allow an empty string as an item value. Filters commonly use
// "" for "all", so map it to a private sentinel and translate it back.
const EMPTY_VALUE = '__all__';

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="h-4 w-4 text-text-gray"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  id,
  name,
  ariaLabel,
  className,
}: SelectProps) {
  const normalizedValue = value === '' ? EMPTY_VALUE : value;
  const normalizedOptions = options.map((option) =>
    option.value === '' ? { ...option, value: EMPTY_VALUE } : option
  );

  return (
    <SelectPrimitive.Root
      value={normalizedValue}
      onValueChange={(next) =>
        onValueChange(next === EMPTY_VALUE ? '' : next)
      }
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={clsx(
          'inline-flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-border-custom bg-background-primary/30 px-4 py-2.5 text-left text-sm font-bold text-text outline-none transition-all',
          'hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20',
          'data-[placeholder]:text-text-light-gray disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="flex-shrink-0">
          <ChevronIcon />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          className="z-[140] max-h-72 w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border-custom bg-background text-text shadow-2xl"
        >
          <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center bg-background text-text-gray">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </SelectPrimitive.ScrollUpButton>

          <SelectPrimitive.Viewport className="p-1">
            {normalizedOptions.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-9 pr-3 text-sm font-semibold outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary data-[state=checked]:text-primary"
              >
                <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <CheckIcon />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>

          <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center bg-background text-text-gray">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
