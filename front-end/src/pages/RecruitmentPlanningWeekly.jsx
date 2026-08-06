import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Button, Card, StatusBadge } from '../components/ui';

function RecruitmentPlanningWeekly() {
  const {
    loading,
    weeklyPlans,
    startEditWeekly,
    requestDelete,
    statusTone,
    statusLabel,
  } = useOutletContext();

  return (
    <Card title="Planning hebdomadaire" subtitle="Definissez objectifs, actions et KPI par semaine.">
      <div className="overflow-auto rounded-lg border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background">
            <tr className="border-b border-border">
              <th className="px-3 py-2 font-semibold text-text-primary">Semaine</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Objectif</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Responsable</th>
              <th className="px-3 py-2 font-semibold text-text-primary">KPI</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Statut</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-text-secondary">
                  Chargement des donnees...
                </td>
              </tr>
            ) : null}

            {!loading && weeklyPlans.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-text-secondary">
                  Aucun planning hebdomadaire pour le moment.
                </td>
              </tr>
            ) : null}

            {!loading ? weeklyPlans.map((item) => (
              <tr key={item.id} className="border-b border-border/60">
                <td className="px-3 py-2 text-text-primary">{item.weekLabel}</td>
                <td className="px-3 py-2 text-text-primary">{item.objective}</td>
                <td className="px-3 py-2 text-text-primary">{item.ownerLabel}</td>
                <td className="px-3 py-2 text-text-primary">{item.kpiTarget}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={item.status} label={statusLabel(item.status)} tone={statusTone(item.status)} size="sm" />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="ghost" onClick={() => startEditWeekly(item)}>
                      <Pencil size={14} />
                      Modifier
                    </Button>
                    <Button type="button" size="sm" variant="danger" onClick={() => requestDelete('weekly', item.id, `${item.weekLabel} - ${item.objective}`)}>
                      <Trash2 size={14} />
                      Supprimer
                    </Button>
                  </div>
                </td>
              </tr>
            )) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default RecruitmentPlanningWeekly;
