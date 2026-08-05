import {
  AlertTriangle,
  BanknoteArrowUp,
  Bell,
  CalendarRange,
  ChartPie,
  ClipboardClock,
  FileText,
  FileChartColumn,
  UserPlus,
  Users,
  Calculator,
  LayoutDashboard,
  LogIn,
  MessageCircleMore,
  Settings,
  User,
  UserRoundPlus,
} from 'lucide-react';

const sidebarSections = [
  {
    id: 'exploitation',
    title: 'Exploitation',
    items: [
      { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
      {
        path: '/Recruitment',
        label: 'Recrutement',
        icon: UserRoundPlus,
        children: [
          { path: '/Recruitment/Planification', label: 'Planification', icon: CalendarRange },
          { path: '/Recruitment/Publication', label: 'Publication', icon: Bell },
          { path: '/Recruitment/Selection-Entretiens', label: 'Selection & entretiens', icon: ClipboardClock },
          { path: '/Recruitment/Onboarding', label: 'Integration', icon: User },
        ],
      },
      {
        path: '/Employees',
        label: 'Employés',
        icon: User,
        children: [
          { path: '/Employees/Liste-Employes', label: 'Liste employés', icon: Users },
          { path: '/Employees/Creer-Employe', label: 'Créer employé', icon: UserPlus },
          { path: '/Employees/Documents', label: 'Documents', icon: FileText },
        ],
      },
      { path: '/TimeAttendance', label: 'Pointages et Presences', icon: ClipboardClock },
      { path: '/Leave', label: 'Conge', icon: CalendarRange },
      { path: '/Performances', label: 'Performances', icon: ChartPie },
      { path: '/Kpiboard', label: 'Indicateurs', icon: FileChartColumn },
      {
        path: '/Payroll',
        label: 'Gestion de paie',
        icon: BanknoteArrowUp,
        children: [
          { path: '/Payroll/Dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
          { path: '/Payroll/Liste-Paie', label: 'Liste de paie', icon: FileText },
          { path: '/Payroll/Generation-Paie', label: 'Generation de paie', icon: Calculator },
        ],
      },
    ],
  },
  {
    id: 'configuration',
    title: 'Configuration',
    items: [
      { path: '/Messages', label: 'Messages', icon: MessageCircleMore },
      { path: '/Notifications', label: 'Notifications', icon: Bell },
      { path: '/Settings', label: 'Parametres', icon: Settings },
      { path: '/Help', label: 'Assistance', icon: AlertTriangle },
      { path: '/Logout', label: 'Deconnexion', icon: LogIn },
    ],
  },
];

export default sidebarSections;
