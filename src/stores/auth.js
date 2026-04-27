// stores/auth.js
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
                    success: true,
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

    // Check if the current token is still valid
    const checkAuth = async () => {
        // Prevent multiple simultaneous checks
        if (checkingAuth.value) {
            return;
        }

        checkingAuth.value = true;
        
        try {
            // If no token, auth is invalid
            if (!token.value) {
                clearAuth();
                initialized.value = true;
                return false;
            }

            // Uncomment this if you want to verify the token with your backend
            /*
            try {
                const response = await apiClient.get('v1/customer/verify-token', {
                    headers: {
                        Authorization: `Bearer ${token.value}`
                    }
                });
                
                if (response.status === 200 && response.data.valid) {
                    initialized.value = true;
                    return true;
                } else {
                    clearAuth();
                    initialized.value = true;
                    return false;
                }
            } catch (err) {
                // If token is invalid or expired, clear it
                if (err.response?.status === 401) {
                    clearAuth();
                }
                initialized.value = true;
                return false;
            }
            */
            
            // Simple validation - just check if token exists
            // This is faster but less secure
            initialized.value = true;
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

    // Sync state from localStorage (useful after page refresh)
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

    // Initialize by syncing from localStorage
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
        checkAuth, // Add checkAuth to the returned object
    };
});