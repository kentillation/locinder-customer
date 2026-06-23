import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/axios';

export const useAuthStore = defineStore('auth', () => {

    // =====================
    // STATE (memory only)
    // =====================
    const token = ref(null);
    const firstName = ref(null);
    const userId = ref(null);
    const recovery_code = ref(null);
    const error = ref(null);

    const initialized = ref(false);
    const checkingAuth = ref(false);

    // =====================
    // GETTERS
    // =====================
    const isAuthenticated = computed(() => !!token.value);
    const getFirstName = computed(() => firstName.value);

    // =====================
    // AUTH HELPERS
    // =====================
    const setAuth = (data) => {
        token.value = data.access_token;
        userId.value = data.user_id;
        firstName.value = data.first_name;
    };

    const clearAuth = () => {
        token.value = null;
        userId.value = null;
        firstName.value = null;
        error.value = null;
        recovery_code.value = null;
    };

    // =====================
    // LOGIN
    // =====================
    const customerLogin = async (credentials) => {
        error.value = null;

        try {
            const response = await apiClient.post('v1/customer/login', credentials);

            const data = response.data;

            setAuth(data);

            return {
                success: true,
                user_id: data.user_id,
                first_name: data.first_name,
            };

        } catch (err) {
            error.value = err.response?.data?.message ||
                err.message ||
                'Login failed. Please try again.';
            throw new Error(error.value);
        }
    };

    // =====================
    // REGISTRATION
    // =====================
    const customerRegistration = async (credentials) => {
        error.value = null;

        try {
            const response = await apiClient.post('v1/customer/registration', credentials);

            const data = response.data;

            setAuth(data);

            return {
                success: data.success,
                message: data.message,
                user_id: data.user_id,
                first_name: data.first_name,
            };

        } catch (err) {
            error.value = err.response?.data?.message ||
                err.message ||
                'Registration failed. Please try again.';
            throw err;
        }
    };

    // =====================
    // PASSWORD RECOVERY FLOW
    // =====================
    const submitEmail = async (credentials) => {
        error.value = null;

        try {
            const { data } = await apiClient.post('v1/customer/verify-email', credentials);

            recovery_code.value = data.recovery_code;

            return {
                success: true,
                recovery_code: data.recovery_code,
            };

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
            const { data } = await apiClient.post(
                'v1/customer/verify-recovery-code',
                credentials
            );

            return {
                success: true,
                data,
            };

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
            const response = await apiClient.post('v1/customer/recover-account', credentials);

            const data = response.data;

            setAuth(data);

            return {
                success: true,
                data,
            };

        } catch (err) {
            error.value = err.response?.data?.message ||
                err.message ||
                'Password reset failed.';
            throw err;
        }
    };

    // =====================
    // LOGOUT
    // =====================
    const logout = async (redirect = true) => {

        const currentToken = token.value;

        clearAuth();

        try {
            if (currentToken) {
                await apiClient.post(
                    'v1/customer/logout',
                    null,
                    {
                        headers: {
                            Authorization: `Bearer ${currentToken}`
                        }
                    }
                );
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            if (redirect) {
                window.location.href = '/';
            }
        }
    };

    // =====================
    // TOKEN VALIDATION
    // =====================
    const validateToken = async () => {
        if (!token.value) return false;

        try {
            const response = await apiClient.get('v1/customer/verify-token', {
                headers: {
                    Authorization: `Bearer ${token.value}`
                }
            });

            return response.status === 200;

        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                clearAuth();
            }
            return false;
        }
    };

    const checkAuth = async () => {
        if (checkingAuth.value) return false;

        checkingAuth.value = true;

        try {
            if (!token.value) {
                clearAuth();
                return false;
            }

            const valid = await validateToken();

            if (!valid) {
                clearAuth();
                return false;
            }

            return true;

        } finally {
            checkingAuth.value = false;
            initialized.value = true;
        }
    };

    // =====================
    // INIT (no storage anymore)
    // =====================
    const initAuth = () => {
        initialized.value = true;
    };

    return {
        // state
        token,
        userId,
        firstName,
        recovery_code,
        error,
        initialized,
        checkingAuth,

        // getters
        isAuthenticated,
        getFirstName,

        // actions
        customerLogin,
        customerRegistration,
        submitEmail,
        submitRecoveryCode,
        submitNewPassword,
        logout,
        clearAuth,
        validateToken,
        checkAuth,
        initAuth,
    };
});    const submitRecoveryCode = async (credentials) => {
        error.value = null;
        try {
            const response = await apiClient.post('v1/customer/verify-recovery-code', credentials);
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
            const response = await apiClient.post('v1/customer/recover-account', credentials);
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
