'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

export type Audience = 'nri' | 'hospital' | 'chronic' | 'maternal';

interface AudienceContextValue {
  audience: Audience;
  setAudience: (audience: Audience) => void;
}

const AudienceContext = createContext<AudienceContextValue | undefined>(undefined);

const VALID_AUDIENCES: Audience[] = ['nri', 'hospital', 'chronic', 'maternal'];

export function AudienceProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const paramAudience = searchParams.get('audience') as Audience | null;
  const initialAudience =
    paramAudience && VALID_AUDIENCES.includes(paramAudience) ? paramAudience : 'nri';

  const [audience, setAudienceState] = useState<Audience>(initialAudience);

  const setAudience = useCallback((newAudience: Audience) => {
    setAudienceState(newAudience);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Update URL without full navigation
    const url = newAudience === 'nri' ? '/' : `/?audience=${newAudience}`;
    window.history.replaceState({}, '', url);
  }, []);

  return (
    <AudienceContext.Provider value={{ audience, setAudience }}>
      {children}
    </AudienceContext.Provider>
  );
}

export function useAudience() {
  const ctx = useContext(AudienceContext);
  if (!ctx) throw new Error('useAudience must be used within AudienceProvider');
  return ctx;
}

/** Safe version — returns null when outside AudienceProvider (e.g. demo page) */
export function useAudienceOptional() {
  return useContext(AudienceContext) ?? null;
}
