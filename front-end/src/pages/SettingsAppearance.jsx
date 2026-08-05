import React from 'react';
import { Card, ThemeSwitcher } from '../components/ui';
import { useTheme } from '../theme/theme-provider';

function SettingsAppearance() {
  const { mode, palette } = useTheme();
  const modeLabel = mode === 'dark' ? 'sombre' : 'clair';

  return (
    <div className="space-y-4">
      <Card
        title="Apparence"
        subtitle="Choisissez le mode clair ou sombre, puis la palette de couleurs principale, secondaire et accent."
      >
        <ThemeSwitcher />
      </Card>

      <Card
        title="Apercu en direct"
        subtitle={`Mode actuel: ${modeLabel}. Palette actuelle: ${palette}.`}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-primary p-4 text-sm font-semibold text-on-primary">
            Primaire
          </div>
          <div className="rounded-lg bg-secondary p-4 text-sm font-semibold text-text">
            Secondaire
          </div>
          <div className="rounded-lg bg-accent p-4 text-sm font-semibold text-on-primary">
            Accent
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SettingsAppearance;
