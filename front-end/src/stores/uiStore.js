import { create } from 'zustand';

const useUiStore = create((set) => ({
  mobileSidebarOpen: false,
  mobileCartOpen: false,
  desktopSidebarCollapsed: false,
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  toggleMobileSidebar: () => {
    set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen }));
  },
  toggleDesktopSidebar: () => {
    set((state) => ({ desktopSidebarCollapsed: !state.desktopSidebarCollapsed }));
  },
  toggleMobileCart: () => {
    set((state) => ({ mobileCartOpen: !state.mobileCartOpen }));
  },
}));

export default useUiStore;
