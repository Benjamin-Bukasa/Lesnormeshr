import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Clock3, ShieldAlert } from 'lucide-react';
import { Card, StatusBadge } from '../components/ui';
import { getLeaveComplianceAlerts, getLeaveDashboard } from '../services/leaveApi';
import { formatDate, getSeverityTone } from './leaveHelpers';

const ICON_BY_CARD = {
  available: CalendarDays,
  pending: Clock3,
  team: AlertTriangle,
  alerts: ShieldAlert,
};

function LeaveOverview() {
  const [dashboard, setDashboard] = useState(null);
  const [complianceAlerts, setComplianceAlerts] = useState([]);

  useEffect(() => {
    let active = true;

    Promise.all([getLeaveDashboard(), getLeaveComplianceAlerts()]).then(([dashboardData, alertData]) => {
      if (!active) return;
      setDashboard(dashboardData);
      setComplianceAlerts(alertData.slice(0, 3));
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(dashboard?.summary || []).map((item) => {
          const Icon = ICON_BY_CARD[item.id] || CalendarDays;

          return (
            <Card key={item.id} contentClassName="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted">{item.label}</p>
                  <p className="text-2xl font-semibold text-text">{item.value}</p>
                  <p className="text-sm text-muted">{item.hint}</p>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Icon size={20} />
                </span>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          title="Jours fériés et événements à venir"
          subtitle="Anticipe les périodes d absence et les jours chômés à intégrer au planning."
        >
          <div className="space-y-3">
            {(dashboard?.upcomingHolidays || []).map((holiday) => (
              <div
                key={holiday.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background/70 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-text">{holiday.title}</p>
                  <p className="text-sm text-muted">{holiday.scope}</p>
                </div>
                <StatusBadge
                  status={holiday.date}
                  label={formatDate(holiday.date)}
                  tone="info"
                  variant="subtle"
                  showDot={false}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Alertes de couverture"
          subtitle="Signaux opérationnels à surveiller avant validation."
        >
          <div className="space-y-3">
            {(dashboard?.staffingAlerts || []).map((alert) => (
              <div key={alert.id} className="rounded-xl border border-border bg-background/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-medium text-text">{alert.title}</p>
                  <StatusBadge
                    status={alert.severity}
                    tone={getSeverityTone(alert.severity)}
                    label={alert.severity === 'danger' ? 'Critique' : 'Alerte'}
                    variant="subtle"
                    showDot={false}
                  />
                </div>
                <p className="text-sm text-muted">{alert.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card
        title="Points de conformité prioritaires"
        subtitle="Cette vue aide RH à identifier les dossiers qui demandent une action rapide."
      >
        <div className="space-y-3">
          {complianceAlerts.map((alert) => (
            <div key={alert.id} className="rounded-xl border border-border bg-background/70 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge
                  status={alert.severity}
                  tone={getSeverityTone(alert.severity)}
                  label={alert.severity === 'CRITICAL' ? 'Critique' : 'A surveiller'}
                  showDot={false}
                />
                <p className="font-medium text-text">{alert.title}</p>
                <span className="text-sm text-muted">{alert.employee}</span>
              </div>
              <p className="mt-2 text-sm text-muted">{alert.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default LeaveOverview;
