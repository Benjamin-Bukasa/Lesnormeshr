import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  ListTodo,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Settings,
  ShoppingCart,
  SlidersHorizontal,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import DropdownAction from '../ui/dropdownAction';
import ConfirmModal from '../ui/confirm-modal';
import useThemeStore from '../../stores/themeStore';
import useRealtimeStore from '../../stores/realtimeStore';
import useAuthStore from '../../stores/authStore';
import { resolveMediaUrl } from '../../utils/media';
import useUiStore from '../../stores/uiStore';
import useCounterStore from '../../stores/counterStore';
import { formatName } from '../../utils/formatters';

const SEARCH_CATALOG = [
  { id: 'dashboard', label: 'Tableau de bord', path: '/', summary: "Vue generale de l'activite", order: 1 },
  { id: 'recruitment-planification', label: 'Planification recrutement', path: '/Recruitment/Planification', summary: 'Besoins et campagnes', order: 2 },
  { id: 'recruitment-publication', label: 'Publication recrutement', path: '/Recruitment/Publication', summary: 'Diffusion des annonces', order: 3 },
  { id: 'recruitment-selection', label: 'Selection et entretiens', path: '/Recruitment/Selection-Entretiens', summary: 'Candidatures et evaluation', order: 4 },
  { id: 'recruitment-onboarding', label: 'Integration', path: '/Recruitment/Onboarding', summary: 'Integration des recrues', order: 5 },
  { id: 'employees-list', label: 'Liste employés', path: '/Employees/Liste-Employes', summary: 'Fichier des employés', order: 6 },
  { id: 'employees-create', label: 'Créer employé', path: '/Employees/Creer-Employe', summary: 'Nouveau profil employé', order: 7 },
  { id: 'employees-documents', label: 'Documents employés', path: '/Employees/Documents', summary: 'Documents RH et contrats', order: 8 },
  { id: 'payroll-dashboard', label: 'Tableau de bord paie', path: '/Payroll/Dashboard', summary: 'Suivi global de la paie', order: 9 },
  { id: 'payroll-list', label: 'Liste de paie', path: '/Payroll/Liste-Paie', summary: 'Historique des paies', order: 10 },
  { id: 'payroll-generation', label: 'Generation de paie', path: '/Payroll/Generation-Paie', summary: 'Calcul des bulletins', order: 11 },
  { id: 'attendance', label: 'Pointages et presences', path: '/TimeAttendance', summary: 'Heures et presences', order: 12 },
  { id: 'leave', label: 'Conges', path: '/Leave', summary: 'Gestion des conges', order: 13 },
  { id: 'performances', label: 'Performances', path: '/Performances', summary: 'Suivi des performances', order: 14 },
  { id: 'indicators', label: 'Indicateurs', path: '/Kpiboard', summary: 'Tableau des indicateurs', order: 15 },
  { id: 'notifications', label: 'Notifications', path: '/notifications', summary: 'Alertes et evenements', order: 16 },
  { id: 'messages', label: 'Messages', path: '/messages', summary: 'Messagerie interne', order: 17 },
  { id: 'tasks', label: 'Taches', path: '/Tasks', summary: 'Liste des taches a suivre', order: 18 },
  { id: 'profile', label: 'Profil', path: '/Profile', summary: 'Informations du compte', order: 19 },
  { id: 'settings', label: 'Parametres', path: '/Settings/Appearance', summary: 'Preferences et apparence', order: 20 },
];

const normalizeSearchText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const scoreSearchItem = (item, query) => {
  const normalizedQuery = normalizeSearchText(query);
  const label = normalizeSearchText(item.label);
  const summary = normalizeSearchText(item.summary);
  const path = normalizeSearchText(item.path);

  if (!normalizedQuery) return 0;
  if (label === normalizedQuery) return 100;
  if (label.startsWith(normalizedQuery)) return 80;
  if (label.includes(normalizedQuery)) return 60;
  if (summary.includes(normalizedQuery)) return 40;
  if (path.includes(normalizedQuery)) return 20;
  return 0;
};

const Navbar = () => {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === 'dark';
  const [searchScope, setSearchScope] = useState('Tous');
  const [searchSort, setSearchSort] = useState('Pertinence');
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);
  const toggleMobileCart = useUiStore((state) => state.toggleMobileCart);
  const authUser = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const cartItems = useCounterStore((state) => state.cartItems);
  const [searchValue, setSearchValue] = useState('');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const scopeItems = [
    { id: 'all', label: 'Tous' },
    { id: 'recruitment', label: 'Recrutement' },
    { id: 'employees', label: 'Employés' },
    { id: 'payroll', label: 'Paie' },
    { id: 'settings', label: 'Parametres' },
  ];

  const sortItems = [
    { id: 'relevance', label: 'Pertinence' },
    { id: 'az', label: 'A-Z' },
    { id: 'za', label: 'Z-A' },
    { id: 'recent', label: 'Plus recent' },
    { id: 'old', label: 'Plus ancien' },
  ];

  const realtimeNotifications = useRealtimeStore((state) => state.notifications);
  const realtimeMessages = useRealtimeStore((state) => state.messages);
  const realtimeTasks = useRealtimeStore((state) => state.tasks);
  const clearNotifications = useRealtimeStore((state) => state.clearNotifications);
  const clearMessages = useRealtimeStore((state) => state.clearMessages);
  const toggleTaskDone = useRealtimeStore((state) => state.toggleTaskDone);
  const notifications = realtimeNotifications;
  const messages = realtimeMessages;
  const tasks = realtimeTasks;
  const notificationCount = notifications.length;
  const messageCount = messages.length;
  const pendingTodayTasks = useMemo(
    () => tasks.filter((task) => task.dueToday && !task.done),
    [tasks],
  );
  const pendingTodayTaskCount = pendingTodayTasks.length;

  const roleLabel = useMemo(() => {
    const role = authUser?.role;
    if (!role) return 'Utilisateur';
    if (role === 'SUPERADMIN') return 'Super admin';
    if (role === 'ADMIN') return 'Administrateur';
    if (role === 'SELLER') return 'Vendeur';
    return 'Utilisateur';
  }, [authUser?.role]);

  const fullName = useMemo(() => {
    const name = formatName(authUser);
    if (!name || name === 'N/A') return 'Utilisateur';
    return name;
  }, [authUser]);

  const firstName = useMemo(() => {
    const rawFirst = authUser?.firstName?.trim();
    if (rawFirst) return rawFirst;
    if (fullName.includes('@')) return 'Utilisateur';
    const fallback = fullName.split(' ').filter(Boolean);
    return fallback[0] || 'Utilisateur';
  }, [authUser?.firstName, fullName]);

  const avatarUrl = resolveMediaUrl(authUser?.avatarUrl);
  const isCounterPage = location.pathname === '/counter';
  const cartItemsCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.cartQty || 0), 0),
    [cartItems],
  );

  useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  const globalSearchResults = useMemo(() => {
    if (normalizeSearchText(searchScope) !== 'tous') return [];
    const query = searchValue.trim();
    if (!query) return [];

    const matched = SEARCH_CATALOG.map((item) => ({
      ...item,
      score: scoreSearchItem(item, query),
    })).filter((item) => item.score > 0);

    if (searchSort === 'A-Z') {
      return matched.sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    }
    if (searchSort === 'Z-A') {
      return matched.sort((a, b) => b.label.localeCompare(a.label, 'fr'));
    }
    if (searchSort === 'Plus recent') {
      return matched.sort((a, b) => b.order - a.order);
    }
    if (searchSort === 'Plus ancien') {
      return matched.sort((a, b) => a.order - b.order);
    }

    return matched.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.order - b.order;
    });
  }, [searchScope, searchSort, searchValue]);

  const resolveSearchTarget = () => {
    const scope = normalizeSearchText(searchScope);
    if (scope === 'recrutement') return '/Recruitment';
    if (scope === 'employes') return '/Employees/Liste-Employes';
    if (scope === 'paie') return '/Payroll/Dashboard';
    if (scope === 'parametres') return '/Settings/Appearance';
    return location.pathname;
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (normalizeSearchText(searchScope) === 'tous') {
      const firstResult = globalSearchResults[0];
      if (firstResult) {
        navigate(firstResult.path);
      }
      return;
    }
    const targetPath = resolveSearchTarget();
    const nextParams = new URLSearchParams();
    if (searchValue.trim()) {
      nextParams.set('q', searchValue.trim());
    }
    navigate(`${targetPath}${nextParams.toString() ? `?${nextParams.toString()}` : ''}`);
  };

  return (
    <>
      <nav className="sticky top-0 z-30 border-b border-border bg-surface px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={toggleMobileSidebar}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-text-primary transition hover:bg-surface lg:hidden"
            aria-label={mobileSidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileSidebarOpen}
            aria-controls="mobile-sidebar"
          >
            {mobileSidebarOpen ? (
              <X size={20} strokeWidth={1.8} />
            ) : (
              <Menu size={20} strokeWidth={1.8} />
            )}
          </button>

          <div className="min-w-0 flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-xl font-semibold text-text-secondary">
                Bienvenue
              </p>
              <h1 className="truncate text-xl font-semibold text-text-primary">
                {firstName}
              </h1>
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-[30%] md:min-w-[360px] md:max-w-none">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
          >
            <button
              type="submit"
              className="text-text-secondary"
              aria-label="Lancer la recherche"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>
            <input
              type="text"
              placeholder={`Rechercher (${searchScope.toLowerCase()})`}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
            />
            <DropdownAction
              label={(
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-primary">{searchScope}</span>
                  <ChevronDown size={16} strokeWidth={1.5} />
                </div>
              )}
              items={scopeItems}
              onSelect={(item) => setSearchScope(item.label)}
              buttonClassName="bg-transparent px-2 py-1 hover:bg-surface/70"
              menuClassName="min-w-[160px]"
            />
            <DropdownAction
              label={(
                <div
                  className="flex items-center gap-2"
                  title={`Trier: ${searchSort}`}
                >
                  <SlidersHorizontal size={18} strokeWidth={1.5} />
                </div>
              )}
              items={sortItems}
              onSelect={(item) => setSearchSort(item.label)}
              buttonClassName="bg-background p-2 text-text-primary hover:bg-surface dark:bg-surface dark:border dark:border-border dark:hover:bg-surface/70"
              menuClassName="min-w-[180px]"
            />
          </form>
          {normalizeSearchText(searchScope) === 'tous' && searchValue.trim() ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
              {globalSearchResults.length > 0 ? (
                <div className="max-h-80 overflow-y-auto py-2">
                  {globalSearchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-background"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {item.label}
                        </p>
                        <p className="truncate text-xs text-text-secondary">
                          {item.summary}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-text-secondary">
                        {item.path}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-text-secondary">
                  Aucun resultat.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 md:gap-3 md:overflow-visible md:pb-0">
          {isCounterPage ? (
            <button
              type="button"
              onClick={toggleMobileCart}
              className="relative rounded-lg p-2 text-text-primary hover:bg-surface/70 xl:hidden"
              aria-label="Afficher le panier"
            >
              <ShoppingCart size={20} strokeWidth={1.5} />
              {cartItemsCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] text-white">
                  {cartItemsCount}
                </span>
              ) : null}
            </button>
          ) : null}

          <DropdownAction
            label={(
              <div className="relative rounded-lg p-2">
                <ListTodo size={20} strokeWidth={1.5} />
                {pendingTodayTaskCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
                    {pendingTodayTaskCount}
                  </span>
                ) : null}
              </div>
            )}
            buttonClassName="bg-transparent p-0 hover:bg-surface/70"
            menuClassName="w-80"
            menuBodyClassName="p-0"
          >
            {({ closeMenu }) => (
              <div className="w-full">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      Tâches du jour
                    </p>
                    <p className="text-xs text-text-secondary">
                      {pendingTodayTaskCount} tâche(s) non faite(s)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/Tasks');
                      closeMenu();
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Toutes les tâches
                  </button>
                </div>
                <div className="flex flex-col gap-2 p-3">
                  {pendingTodayTasks.length === 0 ? (
                    <p className="text-xs text-text-secondary">
                      Aucune tâche en attente aujourd hui.
                    </p>
                  ) : (
                    pendingTodayTasks.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-surface/80 px-3 py-2"
                      >
                        <label className="flex cursor-pointer items-start gap-2">
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => toggleTaskDone(item.id)}
                            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary">
                              {item.label}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {item.category} • {item.date}
                            </p>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </DropdownAction>

          <DropdownAction
            label={(
              <div className="relative rounded-lg p-2">
                <Bell size={20} strokeWidth={1.5} />
                {notificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
                    {notificationCount}
                  </span>
                ) : null}
              </div>
            )}
            buttonClassName="bg-transparent p-0 hover:bg-surface/70"
            menuClassName="w-72"
            menuBodyClassName="p-0"
          >
            {({ closeMenu }) => (
              <div className="w-full">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-text-primary">
                    Notifications
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      clearNotifications();
                      closeMenu();
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Tout marquer lu
                  </button>
                </div>
                <div className="flex flex-col gap-2 p-3">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-text-primary">
                      Aucune notification
                    </p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-surface/80 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-text-primary">
                          {item.title}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {item.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </DropdownAction>

          <DropdownAction
            label={(
              <div className="relative rounded-lg p-2">
                <MessageCircle size={20} strokeWidth={1.5} />
                {messageCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
                    {messageCount}
                  </span>
                ) : null}
              </div>
            )}
            buttonClassName="bg-transparent p-0 hover:bg-surface/70"
            menuClassName="w-72"
            menuBodyClassName="p-0"
          >
            {({ closeMenu }) => (
              <div className="w-full">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-text-primary">
                    Messages
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      closeMenu();
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Tout marquer lu
                  </button>
                </div>
                <div className="flex flex-col gap-2 p-3">
                  {messages.length === 0 ? (
                    <p className="text-xs text-text-primary">
                      Aucun message
                    </p>
                  ) : (
                    messages.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-surface/80 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-text-primary">
                          {item.title}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {item.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </DropdownAction>

          <button
            type="button"
            className="rounded-lg p-2 text-text-primary hover:bg-surface/70"
            aria-label="Changer de theme"
            onClick={toggleTheme}
          >
            {isDark ? (
              <Sun size={20} strokeWidth={1.5} />
            ) : (
              <Moon size={20} strokeWidth={1.5} />
            )}
          </button>

          <DropdownAction
            label={(
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-background text-text-primary dark:border dark:border-border dark:bg-surface">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`Avatar ${fullName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={18} strokeWidth={1.5} />
                  )}
                </div>
                <div className="hidden flex-col items-start leading-tight sm:flex">
                  <span className="text-sm font-semibold text-text-primary">
                    {fullName}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown size={16} strokeWidth={1.5} className="hidden sm:block" />
              </div>
            )}
            items={[
              {
                id: 'profile',
                label: (
                  <div className="flex items-center justify-between gap-2">
                    <User size={16} strokeWidth={1.5} />
                    <p>Profil</p>
                  </div>
                ),
              },
              {
                id: 'settings',
                label: (
                  <div className="flex items-center justify-between gap-2">
                    <Settings size={16} strokeWidth={1.5} />
                    <p>Parametres</p>
                  </div>
                ),
              },
              {
                id: 'logout',
                label: (
                  <div className="flex items-center justify-between gap-2">
                    <LogOut size={16} strokeWidth={1.5} />
                    <p>Deconnexion</p>
                  </div>
                ),
                variant: 'danger',
              },
            ]}
            onSelect={(item) => {
              if (item.id === 'profile') navigate('/Profile');
              if (item.id === 'settings') navigate('/Settings/Appearance');
              if (item.id === 'logout') setIsLogoutConfirmOpen(true);
            }}
            buttonClassName="bg-transparent p-1 hover:bg-surface/70"
            menuClassName="min-w-[180px]"
          />
        </div>
      </div>
      </nav>

      <ConfirmModal
        open={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          clearUser();
          setIsLogoutConfirmOpen(false);
          navigate('/Login', { replace: true });
        }}
        title="Confirmation de deconnexion"
        description="Voulez-vous vraiment vous deconnecter de l'application ?"
        confirmLabel="Se deconnecter"
        cancelLabel="Annuler"
        confirmVariant="danger"
      />
    </>
  );
};

export default Navbar;
