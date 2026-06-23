// Helper
import { Preferences } from '@capacitor/preferences'

const TOKEN_KEY = 'access_token'

export const storage = {
    async setToken(token) {
        await Preferences.set({
            key: TOKEN_KEY,
            value: token
        })
    },

    async getToken() {
        const { value } = await Preferences.get({ key: TOKEN_KEY })
        return value
    },

    async removeToken() {
        await Preferences.remove({ key: TOKEN_KEY })
    }
}