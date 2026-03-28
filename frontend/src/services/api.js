import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Request Interceptor — Token ekleme ──────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor — Token yenileme ───────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 401 → Token expired → refresh dene
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    localStorage.clear();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                const res = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
                const { access_token, refresh_token } = res.data.data;
                localStorage.setItem('access_token', access_token);
                if (refresh_token) {
                    localStorage.setItem('refresh_token', refresh_token);
                }

                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch {
                localStorage.clear();
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
