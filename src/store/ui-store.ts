import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  notifications: Notification[];
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      sidebarOpen: true,
      mobileMenuOpen: false,
      notifications: [],
      setSidebarOpen: (sidebarOpen) =>
        set({ sidebarOpen }, false, 'setSidebarOpen'),
      setMobileMenuOpen: (mobileMenuOpen) =>
        set({ mobileMenuOpen }, false, 'setMobileMenuOpen'),
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = { ...notification, id };
        set(
          { notifications: [...get().notifications, newNotification] },
          false,
          'addNotification'
        );
      },
      removeNotification: (id) =>
        set(
          {
            notifications: get().notifications.filter((n) => n.id !== id),
          },
          false,
          'removeNotification'
        ),
      clearNotifications: () =>
        set({ notifications: [] }, false, 'clearNotifications'),
    }),
    {
      name: 'ui-store',
    }
  )
);