import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Button, Card } from '../components/ui';

function RecruitmentPlanningPipeline() {
  const {
    loading,
    pipelineSteps,
    startEditPipeline,
    requestDelete,
  } = useOutletContext();

  return (
    <Card title="Pipeline recrutement" subtitle="Gerez les etapes et SLA du processus.">
      <div className="overflow-auto rounded-lg border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background">
            <tr className="border-b border-border">
              <th className="px-3 py-2 font-semibold text-text-primary">Etape</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Entree</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Sortie</th>
              <th className="px-3 py-2 font-semibold text-text-primary">Responsable</th>
              <th className="px-3 py-2 font-semibold text-text-primary">SLA</th>
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

            {!loading && pipelineSteps.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-text-secondary">
                  Aucune etape pipeline pour le moment.
                </td>
              </tr>
            ) : null}

            {!loading ? pipelineSteps.map((item) => (
              <tr key={item.id} className="border-b border-border/60">
                <td className="px-3 py-2 text-text-primary">{item.stepName}</td>
                <td className="px-3 py-2 text-text-primary">{item.entryCriteria}</td>
                <td className="px-3 py-2 text-text-primary">{item.exitCriteria}</td>
                <td className="px-3 py-2 text-text-primary">{item.ownerLabel}</td>
                <td className="px-3 py-2 text-text-primary">{item.slaDays} jours</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="ghost" onClick={() => startEditPipeline(item)}>
                      <Pencil size={14} />
                      Modifier
                    </Button>
                    <Button type="button" size="sm" variant="danger" onClick={() => requestDelete('pipeline', item.id, item.stepName)}>
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

export default RecruitmentPlanningPipeline;
