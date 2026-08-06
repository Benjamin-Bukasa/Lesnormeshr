import React, { useMemo } from 'react';
import { Breadcrumbs, Button, Card, StatusBadge } from '../components/ui';
import useRealtimeStore from '../stores/realtimeStore';

function Tasks() {
  const tasks = useRealtimeStore((state) => state.tasks);
  const toggleTaskDone = useRealtimeStore((state) => state.toggleTaskDone);
  const clearCompletedTasks = useRealtimeStore((state) => state.clearCompletedTasks);

  const summary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.done).length;
    const pendingToday = tasks.filter((task) => task.dueToday && !task.done).length;

    return {
      total,
      completed,
      pendingToday,
    };
  }, [tasks]);

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/' },
          { label: 'Taches' },
        ]}
      />

      <Card
        title="Toutes les tâches"
        subtitle="Retrouvez les tâches du jour, suivez leur avancement et cochez-les lorsqu elles sont terminées."
        action={(
          <Button
            variant="secondary"
            size="sm"
            onClick={clearCompletedTasks}
            disabled={!tasks.some((task) => task.done)}
          >
            Nettoyer les tâches terminées
          </Button>
        )}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Total</p>
            <p className="mt-2 text-lg font-semibold text-text">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">A faire aujourd hui</p>
            <p className="mt-2 text-lg font-semibold text-text">{summary.pendingToday}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Terminées</p>
            <p className="mt-2 text-lg font-semibold text-text">{summary.completed}</p>
          </div>
        </div>
      </Card>

      <Card
        title="Liste des tâches"
        subtitle="Les tâches cochées disparaîtront du dropdown du jour mais restent visibles ici tant que vous ne les nettoyez pas."
      >
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted">Aucune tâche disponible.</p>
          ) : (
            tasks.map((task) => (
              <article key={task.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <label className="flex min-w-0 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTaskDone(task.id)}
                      className="mt-1 h-4 w-4 rounded border-border accent-primary"
                    />
                    <div className="min-w-0">
                      <p className={['text-sm font-medium text-text', task.done ? 'line-through opacity-60' : ''].join(' ')}>
                        {task.label}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-text">
                          {task.category}
                        </span>
                        <span className="text-xs text-muted">{task.date}</span>
                      </div>
                    </div>
                  </label>

                  <StatusBadge
                    status={task.done ? 'completed' : 'pending'}
                    label={task.done ? 'Terminée' : (task.dueToday ? 'Aujourd hui' : 'A venir')}
                    tone={task.done ? 'success' : (task.dueToday ? 'warning' : 'info')}
                    size="sm"
                  />
                </div>
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

export default Tasks;
