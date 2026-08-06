import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import sections from '../../services/sidebaritems';
import ConfirmModal from '../ui/confirm-modal';
import useAuthStore from '../../stores/authStore';
import useUiStore from '../../stores/uiStore';

const getItemKey = (item) => item.path || item.to || item.label;

const sidebarStyle = {
  backgroundColor: 'hsl(var(--color-sidebar-bg) / 1)',
  color: 'hsl(var(--color-sidebar-text) / 1)',
};

const sidebarHeaderStyle = {
  backgroundColor: 'hsl(var(--color-sidebar-bg) / 1)',
  borderColor: 'hsl(var(--color-sidebar-border) / 0.16)',
  color: 'hsl(var(--color-sidebar-text) / 1)',
};

const Sidebar = ({ isMobile = false, isCollapsed = false, onRequestClose = null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const clearUser = useAuthStore((state) => state.clearUser);
  const toggleDesktopSidebar = useUiStore((state) => state.toggleDesktopSidebar);
  const [openMenus, setOpenMenus] = useState({});
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    setOpenMenus((prev) => {
      const next = { ...prev };

      sections.forEach((section) => {
        section.items.forEach((item) => {
          if (!item.children?.length) {
            return;
          }

          const itemPath = item.path || item.to || '';
          const itemKey = getItemKey(item);

          if (location.pathname.toLowerCase().startsWith(itemPath.toLowerCase())) {
            next[itemKey] = true;
          }
        });
      });

      return next;
    });
  }, [location.pathname]);

  const toggleMenu = (itemKey) => {
    setOpenMenus((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  return (
    <>
      <div className="sidebar-scroll no-scrollbar h-screen overflow-y-auto" style={sidebarStyle}>
      <div className="sticky top-0 z-10 mb-6 border-b p-4" style={sidebarHeaderStyle}>
        <div className="flex items-start justify-between gap-3">
          {!isCollapsed ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Espace de travail</p>
              <p className="mt-1 text-base font-semibold text-white">LesNormes RH</p>
            </div>
          ) : (
            <div className="flex min-h-10 items-center">
              <span className="mx-auto text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                RH
              </span>
            </div>
          )}
          {isMobile ? (
            <button
              type="button"
              onClick={onRequestClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
              aria-label="Fermer le menu"
            >
              <X size={18} strokeWidth={1.8} />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 lg:inline-flex"
              aria-label={isCollapsed ? 'Agrandir le menu' : 'Reduire le menu'}
              title={isCollapsed ? 'Agrandir le menu' : 'Reduire le menu'}
            >
              {isCollapsed ? (
                <PanelLeftOpen size={18} strokeWidth={1.8} />
              ) : (
                <PanelLeftClose size={18} strokeWidth={1.8} />
              )}
            </button>
          )}
        </div>
      </div>

      <nav className={isCollapsed ? 'space-y-8 px-3 py-4' : 'space-y-20 p-4'}>
        {sections.map((section) => (
          <div key={section.id} className="space-y-2">
            {isCollapsed ? (
              <div className="mx-auto h-px w-10 bg-white/15" aria-hidden="true" />
            ) : (
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const itemKey = getItemKey(item);
              const itemPath = item.path || item.to || '/';
              const hasChildren = Boolean(item.children?.length);
              const isOpen = !isCollapsed && Boolean(openMenus[itemKey]);
              const isParentActive = location.pathname
                .toLowerCase()
                .startsWith(itemPath.toLowerCase());
              const isLogoutItem = itemPath.toLowerCase() === '/logout';

              if (!hasChildren) {
                if (isLogoutItem) {
                  return (
                    <button
                      key={itemKey}
                      type="button"
                      onClick={() => setIsLogoutConfirmOpen(true)}
                      title={isCollapsed ? item.label : undefined}
                      className={[
                        'w-full rounded-lg border border-transparent text-left text-sm font-medium text-white/85 transition hover:border-white/20 hover:bg-white/10 hover:text-white',
                        isCollapsed
                          ? 'flex justify-center px-3 py-3'
                          : 'flex items-center gap-2 px-3 py-2',
                      ].join(' ')}
                    >
                      {item.icon ? (
                        <item.icon
                          size={18}
                          className="shrink-0"
                          aria-hidden="true"
                        />
                      ) : null}
                      {!isCollapsed ? item.label : null}
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={itemKey}
                    to={itemPath}
                    onClick={() => {
                      if (isMobile && onRequestClose) {
                        onRequestClose();
                      }
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) => [
                      'rounded-lg text-sm font-medium transition border',
                      isCollapsed
                        ? 'flex justify-center px-3 py-3'
                        : 'flex items-center gap-2 px-3 py-2',
                      isActive
                        ? 'border-transparent bg-white/14 text-white'
                        : 'border-transparent text-white/85 hover:border-white/20 hover:bg-white/10 hover:text-white',
                    ].join(' ')}
                  >
                    {item.icon ? (
                      <item.icon
                        size={18}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                    ) : null}
                    {!isCollapsed ? item.label : null}
                  </NavLink>
                );
              }

              return (
                <div key={itemKey} className="space-y-2">
                  <div
                    className={[
                      'rounded-lg text-sm font-medium transition border',
                      isCollapsed
                        ? 'flex justify-center px-3 py-3'
                        : 'flex items-center px-3 py-2',
                      isParentActive
                        ? 'border-transparent bg-white/14 text-white'
                        : 'border-transparent text-white/85 hover:border-white/20 hover:bg-white/10 hover:text-white',
                    ].join(' ')}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <NavLink
                      to={itemPath}
                      onClick={() => {
                        if (isMobile && onRequestClose) {
                          onRequestClose();
                        }
                      }}
                      className={[
                        'min-w-0 flex-1 items-center',
                        isCollapsed ? 'flex justify-center' : 'flex gap-2',
                      ].join(' ')}
                    >
                      {item.icon ? (
                        <item.icon
                          size={18}
                          className="shrink-0"
                          aria-hidden="true"
                        />
                      ) : null}
                      {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
                    </NavLink>

                    {!isCollapsed ? (
                      <button
                        type="button"
                        onClick={() => toggleMenu(itemKey)}
                        className="rounded p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                        aria-label={isOpen ? 'Fermer le sous-menu' : 'Ouvrir le sous-menu'}
                        aria-expanded={isOpen}
                      >
                        <ChevronDown
                          size={16}
                          className={['transition-transform', isOpen ? 'rotate-180' : 'rotate-0'].join(' ')}
                          aria-hidden="true"
                        />
                      </button>
                    ) : null}
                  </div>

                  {isOpen ? (
                    <div
                      className="ml-6 space-y-1 border-l pl-3"
                      style={{ borderColor: 'hsl(var(--color-sidebar-border) / 0.16)' }}
                    >
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path || child.to}
                          to={child.path || child.to || '/'}
                          onClick={() => {
                            if (isMobile && onRequestClose) {
                              onRequestClose();
                            }
                          }}
                          className={({ isActive }) => [
                            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition',
                            isActive
                              ? 'bg-white/14 text-white'
                              : 'text-white/72 hover:bg-white/10 hover:text-white',
                          ].join(' ')}
                        >
                          {child.icon ? (
                            <child.icon
                              size={15}
                              className="shrink-0"
                              aria-hidden="true"
                            />
                          ) : null}
                          <span className="truncate">{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
      </div>

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

export default Sidebar;
