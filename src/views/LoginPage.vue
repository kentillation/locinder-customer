<template>
    <div class="login-container">
        <v-container>
            <v-card class="login-card">
                <v-row no-gutters>
                    <!-- Form Section -->
                    <v-col cols="12" class="form-section">
                        <div class="form-content">
                            <!-- Logo with enhanced animation -->
                            <div class="logo-wrapper">
                                <img :src="logo" class="logo-img" loading="lazy" alt="Poofsa Logo" />
                            </div>

                            <h1>Welcome to <span class="text-accent">Locinder</span></h1>

                            <p class="subtitle">A food discovery app for local delicacies in Sagay City</p>

                            <v-form ref="form" @submit.prevent="handleLogin" v-model="isFormValid" class="login-form">
                                
                                <v-alert v-if="error_text" type="error" variant="outlined" class="mb-5" 
                                    style="font-size: 13px;">
                                    {{ error_text }}
                                </v-alert>
                                
                                <div class="input-wrapper">
                                    <div class="input-label">
                                        <HugeiconsIcon :icon="Mail01Icon" class="label-icon" />
                                        <span>Email</span>
                                    </div>
                                    <v-text-field v-model="customer_email" :rules="[requiredRule, emailFormatRule]"
                                        :disabled="loading" placeholder="myname@example.com" variant="solo" density="comfortable"
                                        autocomplete="customer_email" class="custom-input" :error="emailError"
                                        hide-details="auto" />
                                </div>

                                <div class="input-wrapper mt-5">
                                    <div class="input-label">
                                        <HugeiconsIcon :icon="LockPasswordIcon" class="label-icon" />
                                        <span>Password</span>
                                    </div>
                                    <v-text-field v-model="customer_password" :rules="[requiredRule]"
                                        :disabled="loading" placeholder="Enter your password" variant="solo" density="comfortable"
                                        autocomplete="customer_password" :type="showPassword ? 'text' : 'password'"
                                        class="custom-input" hide-details="auto">
                                        <template v-slot:append-inner>
                                            <HugeiconsIcon :icon="showPassword ? ViewIcon : ViewOffIcon"
                                                @click="showPassword = !showPassword"
                                                class="cursor-pointer label-icon" style="z-index: 999;" />
                                        </template>
                                    </v-text-field>
                                </div>

                                <div class="forgot-pass-container">
                                    <p @click="router.push('forgot-password')" class="forgot-password">Forgot password?</p>
                                </div>

                                <v-btn :disabled="!isFormValid || loading" color="primary" type="submit" size="large"
                                    class="login-btn mt-6" height="52" block elevation="0">
                                    <span v-if="!loading">Sign In</span>
                                    <template v-else>
                                        <v-progress-circular indeterminate color="white" size="20" class="mr-2" />
                                        Signing In...
                                    </template>
                                </v-btn>

                                <div class="register-link">
                                    <span>Don't have an account?</span>
                                    <span class="register-text" @click="router.push('register')">Create one</span>
                                </div>
                            </v-form>
                        </div>
                    </v-col>
                </v-row>
            </v-card>
            <Snackbar ref="snackbarRef" />
        </v-container>
    </div>
</template>

<script setup>
import { HugeiconsIcon } from '@hugeicons/vue'
import { Mail01Icon, LockPasswordIcon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Snackbar from '@/components/Snackbar.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()

const logo = require('@/assets/Locinder-Submark.png')

const form = ref(null)
const snackbarRef = ref(null)

const customer_email = ref('')
const customer_password = ref('')
const error_text = ref('')
const showPassword = ref(false)
const isFormValid = ref(false)
const loading = ref(false)
const emailError = ref(false)
const validationErrors = ref({})

const requiredRule = (v) => {
    return !!v || 'This field is required'
}

const emailFormatRule = (v) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(v) || 'Please enter a valid email address'
}

const handleValidationErrors = (errors) => {
    if (form.value && form.value.setErrors) {
        form.value.setErrors(errors)
    }

    validationErrors.value = errors
}

const handleLogin = async () => {
    const { valid } = await form.value.validate()

    if (!valid) return

    error_text.value = ''
    loading.value = true

    try {
        const authStore = useAuthStore()

        const result = await authStore.customerLogin({
            customer_email: customer_email.value,
            customer_password: customer_password.value
        })

        if (result.success) {
            const redirectPath = route.query.redirect || '/home'

            document.body.style.opacity = '0'

            setTimeout(() => {
                window.location.href = redirectPath
            }, 300)
        } else {
            handleValidationErrors(result.errors)
        }
    } catch (error) {
        console.error(error)

        if (error.response) {
            const status = error.response.status
            const data = error.response.data

            if (status === 422 && data.errors) {
                handleValidationErrors(data.errors)
                error_text.value = Object.values(data.errors)[0][0]
            } else if (status === 500) {
                error_text.value = data.message
            } else {
                error_text.value = data.message
            }
        } else if (error.request) {
            error_text.value = 'Network error. Please check your connection.'
        } else {
            error_text.value = error.message
        }
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.login-container {
    height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: linear-gradient(135deg, #faf8f5 0%, #fff6e3 100%);
    overflow: hidden;
}

.logo-wrapper {
    position: relative;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.logo-img {
    width: 100%;
    max-width: 110px;
    height: auto;
    position: relative;
    z-index: 1;
    transition: transform 0.3s ease;
    border-radius: 15px;
}

.text-accent {
    color:#d46600;
    font-weight: 600;
}

/* Login Card */
.login-card {
    border-radius: 30px;
    overflow: hidden;
    box-shadow: none;
    max-width: 500px;
    margin: 0 auto;
    background: transparent !important;
}

/* Form Section */
.form-section {
    padding: 48px 40px;
}

.form-content {
    max-width: 400px;
    margin: 30px auto;
    padding: 25px;
}

.form-content h1 {
    font-size: 2rem;
    font-weight: 500;
    text-align: center;
    margin: 16px 0 0;
    position: relative;
    display: inline-block;
    width: 100%;
}

.subtitle {
    text-align: center;
    color: #707070;
    font-size: 1rem;
    margin-bottom: 25px;
}

/* Form Elements */
.login-form {
    margin-top: 16px;
}

.input-wrapper {
    margin-bottom: 4px;
}

.input-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
    font-size: 0.85rem;
    font-weight: 500;
    color: #8b8b8b;
}

.label-icon {
    color: #8b8b8b;
}

.v-text-field :deep(.v-field) {
    background-color: transparent !important;
}

.custom-input :deep(.v-field) {
    border-radius: 10px;
    transition: all 0.2s ease;
    box-shadow: none;
    border: 1px solid #dcdcdc;
}

.custom-input :deep(.v-field:hover) {
    border-color: #5c3a21;
}

.custom-input :deep(.v-field--focused) {
    border-color: #5c3a21;
}

.forgot-pass-container {
    text-align: right;
    margin: 5px 0 20px;
}

.forgot-password {
    font-size: 0.85rem;
    color: #d46600;
    cursor: pointer;
    font-weight: 500;
    transition: color 0.2s ease;
    display: inline-block;
}

.forgot-password:hover {
    color: #d49f00;
    text-decoration: underline;
}

.login-btn {
    background: linear-gradient(135deg, #5c3a21 0%, #d46600 100%);
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: none;
    font-size: 1rem;
    transition: all 0.3s ease;
    border-radius: 30px;
}

.login-btn:disabled {
    opacity: 0.7;
    transform: none;
}

.register-link {
    text-align: center;
    margin-top: 20px;
    font-size: 0.8rem;
    color: #525252;
}

.register-text {
    color: #d46600;
    font-weight: 500;
    cursor: pointer;
    margin-left: 5px;
    transition: color 0.2s ease;
}

.register-text:hover {
    color: #d49f00;
    text-decoration: underline;
}


/* Responsive */
@media (max-width: 960px) {
    .form-section {
        padding: 32px 24px;
    }
}

@media (max-width: 600px) {
    .form-content h1 {
        font-size: 1.5rem;
    }
}

/* Cursor pointer utility */
.cursor-pointer {
    cursor: pointer;
}
</style>