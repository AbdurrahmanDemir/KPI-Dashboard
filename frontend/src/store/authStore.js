import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Başlangıçta true — token kontrolü yapılıyor

    // ─── Token'dan kullanıcı yükle (sayfa yenilenince) ───────────────────────────
    init: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
        }
        try {
            const res = await api.get('/auth/me');
            set({ user: res.data.data, isAuthenticated: true, isLoading: false });
        } catch {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    // ─── Giriş ───────────────────────────────────────────────────────────────────
    login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { access_token, refresh_token, user } = res.data.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        set({ user, isAuthenticated: true });
        return user;
    },

    // ─── Çıkış ──────────────────────────────────────────────────────────────────
    logout: async () => {
        try {
            await api.post('/auth/logout', {
                refresh_token: localStorage.getItem('refresh_token')
            });
        } catch (_) { }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
    },
}));

export default useAuthStore;
