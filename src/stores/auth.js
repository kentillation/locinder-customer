import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/axios';

export const useAuthStore = defineStore('auth', () => {
    // State
    const token = ref(localStorage.getItem('auth_token') || null);
    const firstName = ref(localStorage.getItem('first_name') || null);
    const userId = ref(localStorage.getItem('user_id') || null);
    const recovery_code = ref(null);
    const error = ref(null);
    const initialized = ref(false);
    const checkingAuth = ref(false);

    // Getters
    const isAuthenticated = computed(() => !!token.value);
    const getfirstName = computed(() => firstName.value);

    // Actions
    const customerLogin = async (credentials) => {
        error.value = null;
        try {
            const response = await apiClient.post('v1/customer/login', credentials);

            if (response.status === 200) {
                const data = response.data;

                localStorage.setItem('auth_token', data.access_token);
                localStorage.setItem('user_id', data.user_id);
                localStorage.setItem('first_name', data.first_name);

                token.value = data.access_token;
                userId.value = data.user_id;
                firstName.value = data.first_name;

                return {
                    success: true,
                    user_id: data.user_id,
                    first_name: data.first_name,
                };
            }
        } catch (err) {
            error.value = err.response?.data?.message ||
                err.message ||
                'Login failed. Please try again.';
            throw new Error(error.value);
        }
    };

    const customerRegistration = async (credentials) => {
        error.value = null;
        try {
            const response = await apiClient.post('v1/customer/registration', credentials);

            if (response.status === 200) {
                const data = response.data;

                localStorage.setItem('auth_token', data.access_token);
                localStorage.setItem('user_id', data.user_id);
                localStorage.setItem('first_name', data.first_name);

                token.value = data.access_token;
                userId.value = data.user_id;
                firstName.value = data.first_name;

                return {
                    success: data.success,
                    message: data.message,
                    user_id: data.user_id,
                    first_name: data.first_name,
                };
            }
        } catch (err) {
            error.value = err.response?.data?.message ||
                err.message ||
                'Registration failed. Please try again.';
            throw err;
        }
    };

    const submitEmail = async (credentials) => {
        error.value = null;
        try {
            const response = await apiClient.post('v1/customer/verify-email', credentials);

            if (response.status === 200) {
                const data = response.data;

                recovery_code.value = data.recovery_code;

                return {
                    success: true,
                    recovery_code: data.recovery_code,
                };
            }
        } catch (err) {
            error.value = err.response?.data?.message ||
                err.message ||
                'Verifying email failed. Please try again.';
            throw new Error(error.value);
        }
    };

    const submitRecoveryCode = async (credentials) => {
        error.value = null;
        try {
            const response = await apiClient.post('v1/public/verify-recovery-code', credentials);
            const data = response.data;
            if (response.status === 200) {
                return {
                    success: true,
                    data: data
                };
            }
        } catch (err) {
            error.value = err.response?.data?.message ||
                err.message ||
                'Recovery code failed. Please try again.';
            throw new Error(error.value);
        }
    };

    const submitNewPassword = async (credentials) => {
        error.value = null;
        try {
            const response = await apiClient.post('v1/public/recover-account', credentials);
            if (response.status === 200) {
                const data = response.data;

                localStorage.setItem('auth_token', data.access_token);
                localStorage.setItem('user_id', data.user_id);
                localStorage.setItem('first_name', data.first_name);

                token.value = data.access_token;
                userId.value = data.user_id;
                firstName.value = data.first_name;

                return {
                    success: true,
                    data: data,
                    user_id: data.user_id,
                    first_name: data.first_name,
                };
            }
        } catch (err) {
            error.value = err.response?.data?.message ||
                err.message ||
                'Recovery code failed. Please try again.';
            throw new Error(error.value);
        }
    };

    const clearAuth = () => {
        token.value = null;
        userId.value = null;
        firstName.value = null;
        error.value = null;

        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('first_name');
    };

    const logout = async (redirect = true) => {
        const currentToken = token.value;

        clearAuth();

        try {
            if (currentToken) {
                await Promise.race([
                    apiClient.post('v1/customer/logout', null, {
                        headers: {
                            Authorization: `Bearer ${currentToken}`
                        }
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
                ]).catch(err => {
                    console.error('Logout API error:', err);
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            if (redirect) {
                window.location.href = '/';
            }
        }
    };

    const checkAuth = async () => {
        if (checkingAuth.value) {
            return;
        }

        checkingAuth.value = true;

        try {
            if (!token.value) {
                clearAuth();
                return false;
            }

            const isValid = await validateToken();

            if (!isValid) {
                clearAuth();
                return false;
            }

            return true;
        } catch (err) {
            console.error('Auth check error:', err);
            clearAuth();
            initialized.value = true;
            return false;
        } finally {
            checkingAuth.value = false;
        }
    };

    const syncFromLocalStorage = () => {
        const storedToken = localStorage.getItem('auth_token');
        const storeduserId = localStorage.getItem('user_id');
        const storedfirstName = localStorage.getItem('first_name');

        if (storedToken && storeduserId && storedfirstName) {
            token.value = storedToken;
            userId.value = storeduserId;
            firstName.value = storedfirstName;
        } else {
            clearAuth();
        }

        initialized.value = true;
    };

    const validateToken = async () => {
        if (!token.value) return false;

        try {
            const response = await apiClient.get('v1/customer/verify-token', {
                headers: {
                    Authorization: `Bearer ${token.value}`
                },
                timeout: 5000
            });

            return response.status === 200;
        } catch (err) {
            console.error('Token validation failed:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                clearAuth();
            }
            return false;
        }
    };

    syncFromLocalStorage();

    return {
        token,
        userId,
        firstName,
        error,
        initialized,
        checkingAuth,
        isAuthenticated,
        getfirstName,
        customerLogin,
        customerRegistration,
        submitEmail,
        submitRecoveryCode,
        submitNewPassword,
        logout,
        clearAuth,
        syncFromLocalStorage,
        checkAuth,
        validateToken,
    };
});