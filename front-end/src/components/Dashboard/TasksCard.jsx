import React from 'react';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '../ui';
import useRealtimeStore from '../../stores/realtimeStore';

const TasksCard = () => {
  const tasks = useRealtimeStore((state) => state.tasks);
  const toggleTask = useRealtimeStore((state) => state.toggleTaskDone);

  return (
    <section className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Taches</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 rounded-full p-0"
          aria-label="Plus d'options"
        >
          <EllipsisVertical size={14} />
        </Button>
      </div>

      <div className="mt-2.5 space-y-2.5">
        {tasks.slice(0, 2).map((task) => (
          <article key={task.id} className="space-y-1.5 rounded-lg border border-border bg-background p-2.5">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <span
                className={[
                  'text-sm text-text-primary',
                  task.done ? 'line-through opacity-65' : '',
                ].join(' ')}
              >
                {task.label}
              </span>
            </label>

            <div className="pl-6">
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-text-primary">
                {task.category}
              </span>
              <span className="ml-2 text-xs text-text-secondary">{task.date}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TasksCard;
