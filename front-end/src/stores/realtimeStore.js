import { create } from 'zustand';
import {
  clearCompletedWorkspaceTasks,
  getWorkspaceSummary,
  markWorkspaceMessagesRead,
  markWorkspaceNotificationsRead,
  updateWorkspaceTask,
} from '../services/workspaceApi';

function isToday(value) {
  if (!value) return false;

  const date = new Date(value);
  const today = new Date();

  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

function formatTaskDate(value) {
  if (!value) return 'Sans echeance';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sans echeance';

  const time = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  if (isToday(value)) return `Aujourd hui, ${time}`;

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function normalizeSummary(payload = {}) {
  return {
    tasks: (payload.tasks || []).map((task) => ({
      ...task,
      date: formatTaskDate(task.dueAt),
      dueToday: isToday(task.dueAt),
    })),
    notifications: payload.notifications || [],
    messages: payload.messages || [],
  };
}

const useRealtimeStore = create((set, get) => ({
  notifications: [],
  messages: [],
  tasks: [],
  isLoading: false,
  hasLoaded: false,
  loadWorkspace: async () => {
    if (get().isLoading) return;

    try {
      set({ isLoading: true });
      const payload = await getWorkspaceSummary();
      set({ ...normalizeSummary(payload), hasLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },
  addMessage: (message) => {
    set((state) => ({
      messages: [message, ...state.messages],
    }));
  },
  toggleTaskDone: async (taskId) => {
    const currentTask = get().tasks.find((task) => task.id === taskId);
    if (!currentTask) return;

    const nextDone = !currentTask.done;
    set((state) => ({
      tasks: state.tasks.map((task) => (
        task.id === taskId ? { ...task, done: nextDone } : task
      )),
    }));

    try {
      const updatedTask = await updateWorkspaceTask(taskId, nextDone);
      set((state) => ({
        tasks: state.tasks.map((task) => (
          task.id === taskId
            ? { ...task, ...updatedTask, date: formatTaskDate(updatedTask.dueAt), dueToday: isToday(updatedTask.dueAt) }
            : task
        )),
      }));
    } catch (error) {
      set((state) => ({
        tasks: state.tasks.map((task) => (
          task.id === taskId ? { ...task, done: currentTask.done } : task
        )),
      }));
      throw error;
    }
  },
  clearNotifications: async () => {
    const previousNotifications = get().notifications;
    set({ notifications: [] });

    try {
      await markWorkspaceNotificationsRead();
    } catch (error) {
      set({ notifications: previousNotifications });
      throw error;
    }
  },
  clearMessages: async () => {
    const previousMessages = get().messages;
    set({ messages: [] });

    try {
      await markWorkspaceMessagesRead();
    } catch (error) {
      set({ messages: previousMessages });
      throw error;
    }
  },
  clearCompletedTasks: async () => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((task) => !task.done),
    }));

    try {
      await clearCompletedWorkspaceTasks();
    } catch (error) {
      set({ tasks: previousTasks });
      throw error;
    }
  },
}));

export default useRealtimeStore;
