import { create } from 'zustand';

export type UserRole = 'tourist' | 'authority' | 'guard';

interface AuthRoleState {
  role: UserRole | null;
  userName: string;
  badgeId: string;
  login: (role: UserRole, userName: string, badgeId?: string) => void;
  logout: () => void;
}

export const useAuthRoleStore = create<AuthRoleState>((set) => ({
  role: (localStorage.getItem('ecosync_role') as UserRole) || null,
  userName: localStorage.getItem('ecosync_user_name') || '',
  badgeId: localStorage.getItem('ecosync_badge_id') || '',
  login: (role, userName, badgeId = '') => {
    localStorage.setItem('ecosync_role', role);
    localStorage.setItem('ecosync_user_name', userName);
    localStorage.setItem('ecosync_badge_id', badgeId);
    set({ role, userName, badgeId });
  },
  logout: () => {
    localStorage.removeItem('ecosync_role');
    localStorage.removeItem('ecosync_user_name');
    localStorage.removeItem('ecosync_badge_id');
    set({ role: null, userName: '', badgeId: '' });
  }
}));
