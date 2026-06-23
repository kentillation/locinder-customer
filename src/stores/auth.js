import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/axios'
import { storage } from '@/utils/storage'

export const useAuthStore = defineStore('auth', () => {

    // =====================
    // STATE
    // =====================
    const token = ref(null)
    const firstName = ref(null)
    const userId = ref(null)
    const error = ref(null)

    const initialized = ref(false)
    const checkingAuth = ref(false)

    // =====================
    // GETTERS
    // =====================
    const isAuthenticated = computed(() => !!token.value)

    // =====================
    // SET AUTH
    // =====================
    const setAuth = async (data) => {
        token.value = data.access_token
        userId.value = data.user_id
        firstName.value = data.first_name

        // 🔐 persist token
        await storage.setToken(data.access_token)
    }

    const clearAuth = async () => {
        token.value = null
        userId.value = null
        firstName.value = null
        error.value = null

        await storage.removeToken()
    }

    // =====================
    // LOGIN
    // =====================
    const customerLogin = async (credentials) => {
        error.value = null

        try {
            const { data } = await apiClient.post('v1/customer/login', credentials)

            await setAuth(data)

            return {
                success: true,
                user_id: data.user_id,
                first_name: data.first_name
            }

        } catch (err) {
            error.value = err.response?.data?.message || 'Login failed'
            throw err
        }
    }

    // =====================
    // RESTORE SESSION (IMPORTANT)
    // =====================
    const restoreAuth = async () => {
        const savedToken = await storage.getToken()

        if (!savedToken) {
            initialized.value = true
            return false
        }

        token.value = savedToken

        try {
            await checkAuth()
            return true
        } catch {
            await clearAuth()
            return false
        } finally {
            initialized.value = true
        }
    }

    // =====================
    // TOKEN VALIDATION
    // =====================
    const validateToken = async () => {
        if (!token.value) return false

        const res = await apiClient.get('v1/customer/verify-token', {
            headers: {
                Authorization: `Bearer ${token.value}`
            }
        })

        return res.status === 200
    }

    const checkAuth = async () => {
        if (checkingAuth.value) return false

        checkingAuth.value = true

        try {
            return await validateToken()
        } catch {
            await clearAuth()
            return false
        } finally {
            checkingAuth.value = false
        }
    }

    // =====================
    // LOGOUT
    // =====================
    const logout = async () => {
        const currentToken = token.value

        await clearAuth()

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
                )
            }
        } catch (err) {
            console.error(err)
        }
    }

    return {
        token,
        userId,
        firstName,
        error,
        initialized,
        checkingAuth,
        isAuthenticated,
        customerLogin,
        logout,
        restoreAuth,
        checkAuth
    }
})