'use client';

import { useAudience, Audience } from './audience-context';

const tabs: { key: Audience; label: string; shortLabel: string }[] = [
  { key: 'nri', label: 'For NRI Families', shortLabel: 'NRI Families' },
  { key: 'hospital', label: 'For Hospitals', shortLabel: 'Hospitals' },
  { key: 'chronic', label: 'For Chronic Care', shortLabel: 'Chronic Care' },
  { key: 'maternal', label: 'Maternal & Child', shortLabel: 'Maternal' },
];

export function AudienceTabs() {
  const { audience, setAudience } = useAudience();

  return (
    <div className="sticky top-16 sm:top-[4.5rem] z-40 border-b border-border/60 bg-white/80 backdrop-blur-xl transition-all duration-300">
      <div className="section-container flex items-center justify-center py-2.5 sm:py-3">
        <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 backdrop-blur-sm p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setAudience(tab.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-5 sm:py-2 sm:text-sm whitespace-nowrap ${
                audience === tab.key
                  ? 'bg-card text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
