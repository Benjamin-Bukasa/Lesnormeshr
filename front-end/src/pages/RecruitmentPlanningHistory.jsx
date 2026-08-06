import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card } from '../components/ui';

const HISTORY_ENTITY_LABELS = {
  WEEKLY_PLAN: 'Planning hebdo',
  PIPELINE_STEP: 'Etape pipeline',
  SCORECARD_CRITERION: 'Critere scorecard',
};

const HISTORY_ACTION_LABELS = {
  CREATED: 'Creation',
  UPDATED: 'Mise a jour',
  DELETED: 'Suppression',
};

function RecruitmentPlanningHistory() {
  const {
    loading,
    history,
    formatDateTime,
  } = useOutletContext();

  return (
    <Card title="Historique des modifications" subtitle="Trace des creations, mises a jour et suppressions.">
      <div className="overflow-auto rounded-lg border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background">
            <tr className="border-b border-border">
              <th className="px-3 py-2 font-semibold text-text-primary">Date</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Type</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Action</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Auteur</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-text-secondary">
                  Chargement des donnees...
                </td>
              </tr>
            ) : null}

            {!loading && history.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-text-secondary">
                  Aucun historique pour le moment.
                </td>
              </tr>
            ) : null}

            {!loading ? history.map((item) => (
              <tr key={item.id} className="border-b border-border/60">
                <td className="px-3 py-2 text-text-primary">{formatDateTime(item.createdAt)}</td>
                <td className="px-3 py-2 text-text-primary">{HISTORY_ENTITY_LABELS[item.entityType] || item.entityType}</td>
                <td className="px-3 py-2 text-text-primary">{HISTORY_ACTION_LABELS[item.action] || item.action}</td>
                <td className="px-3 py-2 text-text-primary">{item.performedBy ? `${item.performedBy.firstName || ''} ${item.performedBy.lastName || ''}`.trim() : 'Systeme'}</td>
              </tr>
            )) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default RecruitmentPlanningHistory;
