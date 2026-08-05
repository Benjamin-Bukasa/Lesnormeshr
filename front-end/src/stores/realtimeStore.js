import { create } from 'zustand';

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', title: 'Demande de conge en attente', message: '2 validations requises' },
  { id: 'n2', title: 'Paie du mois prete', message: 'Le lot de paie est disponible' },
];

const INITIAL_MESSAGES = [
  { id: 'm1', title: 'Admin RH', message: 'Merci de verifier le dossier candidat.' },
  { id: 'm2', title: 'Finance', message: 'Le rapport de paie est pret.' },
];

const INITIAL_TASKS = [
  {
    id: 'task_1',
    label: 'Completer le questionnaire avant la session Leadership Track',
    category: 'Developpement des employes',
    date: 'Aujourd hui, 11:00',
    done: false,
    dueToday: true,
  },
  {
    id: 'task_2',
    label: "Finaliser les retours du panel d'entretien pour le poste Produit",
    category: 'Acquisition des talents',
    date: 'Aujourd hui, 15:30',
    done: false,
    dueToday: true,
  },
  {
    id: 'task_3',
    label: 'Preparer la reunion hebdomadaire RH',
    category: 'Operations RH',
    date: 'Demain, 09:00',
    done: false,
    dueToday: false,
  },
];

const useRealtimeStore = create((set) => ({
  notifications: INITIAL_NOTIFICATIONS,
  messages: INITIAL_MESSAGES,
  tasks: INITIAL_TASKS,
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
  toggleTaskDone: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) => (
        task.id === taskId ? { ...task, done: !task.done } : task
      )),
    }));
  },
  clearNotifications: () => {
    set({ notifications: [] });
  },
  clearMessages: () => {
    set({ messages: [] });
  },
  clearCompletedTasks: () => {
    set((state) => ({
      tasks: state.tasks.filter((task) => !task.done),
    }));
  },
}));

export default useRealtimeStore;
