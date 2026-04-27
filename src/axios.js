import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const apiClient = axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL,
    headers: {
        'Content-Type': process.env.VUE_APP_MIME_TYPE,
        'Accept': process.env.VUE_APP_MIME_TYPE
    },
    withCredentials: process.env.VUE_APP_WITH_CREDENTIALS === 'true'
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            const authStore = useAuthStore();
            authStore.clearAuth();
            
            // Redirect to login if not already there
            if (window.location.pathname !== '/' && window.location.pathname !== '/register') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
