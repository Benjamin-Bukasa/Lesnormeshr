import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Sidebar from './../components/blocs/Sidebar';
import Navbar from './../components/blocs/Navbar';
import useUiStore from '../stores/uiStore';

const sidebarPanelStyle = {
  backgroundColor: 'hsl(var(--color-sidebar-bg) / 1)',
  borderColor: 'hsl(var(--color-sidebar-border) / 0.16)',
  color: 'hsl(var(--color-sidebar-text) / 1)',
};

const AppLayout = () => {
  const location = useLocation();
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const desktopSidebarCollapsed = useUiStore((state) => state.desktopSidebarCollapsed);
  const closeMobileSidebar = useUiStore((state) => state.closeMobileSidebar);

  useEffect(() => {
    closeMobileSidebar();
  }, [closeMobileSidebar, location.pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMobileSidebar();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [closeMobileSidebar, mobileSidebarOpen]);

  return (
    <section className="flex min-h-screen bg-background text-text">
      <div
        className={[
          'fixed inset-0 z-40 lg:hidden transition-all duration-300',
          mobileSidebarOpen
            ? 'pointer-events-auto bg-black/40 opacity-100'
            : 'pointer-events-none bg-black/0 opacity-0',
        ].join(' ')}
        role="presentation"
        onClick={closeMobileSidebar}
        aria-hidden={!mobileSidebarOpen}
      >
        <aside
          id="mobile-sidebar"
          className={[
            'h-full w-[18.5rem] max-w-[85vw] border-r shadow-2xl transition-transform duration-300 ease-out',
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
          style={sidebarPanelStyle}
          onClick={(event) => event.stopPropagation()}
          aria-label="Barre laterale"
        >
          <Sidebar isMobile onRequestClose={closeMobileSidebar} />
        </aside>
      </div>

      <aside
        className={[
          'hidden border-r transition-[width] duration-300 lg:sticky lg:top-0 lg:block lg:h-screen',
          desktopSidebarCollapsed ? 'lg:w-24' : 'lg:w-72',
        ].join(' ')}
        style={sidebarPanelStyle}
      >
        <Sidebar isCollapsed={desktopSidebarCollapsed} />
      </aside>
      <main className="min-h-screen flex-1">
        <Navbar />
        <section className="mx-auto w-full  px-4 py-6">
            <Outlet/>
        </section>
      </main>
    </section>
  );
}

export default AppLayout;
