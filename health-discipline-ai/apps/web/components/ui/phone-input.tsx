'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: 'India (+91)' },
  { code: '+1', country: 'US', label: 'US (+1)' },
  { code: '+44', country: 'GB', label: 'UK (+44)' },
  { code: '+1', country: 'CA', label: 'Canada (+1)' },
  { code: '+61', country: 'AU', label: 'Australia (+61)' },
  { code: '+65', country: 'SG', label: 'Singapore (+65)' },
  { code: '+971', country: 'AE', label: 'UAE (+971)' },
  { code: '+966', country: 'SA', label: 'Saudi (+966)' },
  { code: '+60', country: 'MY', label: 'Malaysia (+60)' },
  { code: '+49', country: 'DE', label: 'Germany (+49)' },
];

interface PhoneInputProps {
  value: string;
  onChange: (e164: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({ value, onChange, disabled, className }: PhoneInputProps) {
  const [countryCode, setCountryCode] = React.useState('+91');
  const [localNumber, setLocalNumber] = React.useState('');

  React.useEffect(() => {
    if (value) {
      const match = COUNTRY_CODES.find((c) => value.startsWith(c.code));
      if (match) {
        setCountryCode(match.code);
        setLocalNumber(value.slice(match.code.length));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocalChange = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    setLocalNumber(cleaned);
    onChange(countryCode + cleaned);
  };

  const handleCodeChange = (code: string) => {
    setCountryCode(code);
    onChange(code + localNumber);
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <select
        value={countryCode}
        onChange={(e) => handleCodeChange(e.target.value)}
        disabled={disabled}
        className="h-10 rounded-xl border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-[140px]"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.country} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        placeholder="98765 43210"
        value={localNumber}
        onChange={(e) => handleLocalChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'flex-1 h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      />
    </div>
  );
}
