import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Button, Card } from '../components/ui';

function RecruitmentPlanningScorecard() {
  const {
    loading,
    scorecardCriteria,
    startEditScorecard,
    requestDelete,
  } = useOutletContext();

  return (
    <Card title="Scorecard recrutement" subtitle="Configurez les criteres et poids d evaluation.">
      <div className="overflow-auto rounded-lg border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background">
            <tr className="border-b border-border">
              <th className="px-3 py-2 font-semibold text-text-primary">Critere</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Poids</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Notes</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Actions</th>
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

            {!loading && scorecardCriteria.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-text-secondary">
                  Aucun critere scorecard pour le moment.
                </td>
              </tr>
            ) : null}

            {!loading ? scorecardCriteria.map((item) => (
              <tr key={item.id} className="border-b border-border/60">
                <td className="px-3 py-2 text-text-primary">{item.criterion}</td>
                <td className="px-3 py-2 text-text-primary">{Number(item.weight).toFixed(2)}</td>
                <td className="px-3 py-2 text-text-primary">{item.notes || '-'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="ghost" onClick={() => startEditScorecard(item)}>
                      <Pencil size={14} />
                      Modifier
                    </Button>
                    <Button type="button" size="sm" variant="danger" onClick={() => requestDelete('scorecard', item.id, item.criterion)}>
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

export default RecruitmentPlanningScorecard;
