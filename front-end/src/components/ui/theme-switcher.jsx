import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../theme/theme-provider';

const PALETTE_BADGES = {
  orange: ['bg-orange-500', 'bg-orange-200', 'bg-amber-500'],
  violet: ['bg-violet-500', 'bg-violet-200', 'bg-fuchsia-500'],
  blue: ['bg-blue-600', 'bg-blue-200', 'bg-cyan-500'],
  red: ['bg-red-500', 'bg-red-200', 'bg-rose-500'],
  green: ['bg-green-600', 'bg-green-200', 'bg-emerald-500'],
};

const ThemeSwitcher = ({ className = '' }) => {
  const { mode, palette, palettes, toggleMode, setPalette } = useTheme();

  return (
    <div className={['rounded-xl border border-border bg-surface p-3', className].join(' ')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text">Theme</p>
        <button
          type="button"
          onClick={toggleMode}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-text transition hover:bg-secondary"
        >
          {mode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {mode === 'dark' ? 'Sombre' : 'Clair'}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(palettes).map(([key, value]) => {
          const badges = PALETTE_BADGES[key] || PALETTE_BADGES.orange;
          const selected = palette === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setPalette(key)}
              className={[
                'flex items-center justify-between rounded-lg border px-3 py-2 text-left transition',
                selected
                  ? 'border-primary bg-secondary text-text ring-2 ring-primary/30'
                  : 'border-border bg-background text-text hover:bg-secondary',
              ].join(' ')}
            >
              <span className="text-sm font-medium">{value.label}</span>
              <span className="inline-flex items-center gap-1">
                <span className={['h-3 w-3 rounded-full', badges[0]].join(' ')} />
                <span className={['h-3 w-3 rounded-full', badges[1]].join(' ')} />
                <span className={['h-3 w-3 rounded-full', badges[2]].join(' ')} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
