<template>
    <div class="forgotpass-container">
        <v-container>
            <v-card class="forgotpass-card">
                <v-row no-gutters>
                    <!-- Form Section -->
                    <v-col cols="12" class="form-section">
                        <div class="form-content">
                            <!-- Logo with enhanced animation -->
                            <div class="logo-wrapper">
                                <img :src="logo" class="logo-img" loading="lazy" alt="Poofsa Logo" />
                            </div>

                            <h1>Forgot Password</h1>

                            <v-form v-show="!showRecoveryForm && !showPasswordsForm" v-model="isEmailFormValid"
                                @submit.prevent="handleSubmitEmail" class="login-form" ref="email_form">
                                <h4 class="mb-5">Enter your email address and we will proceed to reset your password.</h4>
                                <div class="input-wrapper">
                                    <div class="input-label">
                                        <HugeiconsIcon :icon="Mail01Icon" class="label-icon" />
                                        <span>Email Address</span>
                                    </div>
                                    <v-text-field v-model="customer_email" :rules="[requiredRule, emailFormatRule]"
                                        placeholder="customer@gmail.com" variant="outlined" density="comfortable"
                                        autocomplete="username" class="custom-input" :error="emailError"
                                        hide-details="auto" />
                                </div>

                                <v-btn :disabled="!isEmailFormValid || submittingEmail" color="primary" type="submit"
                                    size="large" class="login-btn mt-6" height="52" block>
                                    <span v-if="!submittingEmail">Submit Email</span>
                                    <span v-else class="d-flex align-center">
                                        <HugeiconsIcon :icon="Loading03Icon" 
                                            size="20" 
                                            color="#fff" 
                                            class="mr-2 loading-icon" />
                                        Submitting...
                                    </span>
                                </v-btn>

                                <div class="login-link">
                                    <span>Has already an account?</span>
                                    <span class="login-text" @click="router.push('/')">Sign in here</span>
                                </div>
                            </v-form>

                            <v-form v-show="showRecoveryForm && !showPasswordsForm" v-model="isRecoveryCodeFormValid"
                                @submit.prevent="handleSubmitRecoveryCode" class="login-form" ref="recovery_code_form">
                                <h4 class="mb-5">To continue, we have sent a recovery code to email {{
                                    maskEmail(customer_email) }}
                                </h4>
                                <div class="input-wrapper">
                                    <div class="input-label">
                                        <HugeiconsIcon :icon="LockPasswordIcon" class="label-icon" />
                                        <span>Recovery Code</span>
                                    </div>
                                    <v-text-field v-model="recovery_code" :rules="[requiredRule]"
                                        placeholder="Enter your recovery code" variant="outlined" density="comfortable"
                                        autocomplete="recovery_code" :type="showRecoveryCode ? 'text' : 'password'"
                                        class="custom-input" hide-details="auto" maxlength="6" counter="6">
                                        <template v-slot:append-inner>
                                            <HugeiconsIcon :icon="showRecoveryCode ? ViewIcon : ViewOffIcon"
                                                @click="showRecoveryCode = !showRecoveryCode"
                                                class="cursor-pointer label-icon" style="z-index: 999;" />
                                        </template>
                                    </v-text-field>
                                </div>

                                <v-btn :disabled="!isRecoveryCodeFormValid || submittingRecoveryCode" color="primary"
                                    type="submit" size="large" class="login-btn mt-4" height="52" block>
                                    <span v-if="!submittingRecoveryCode">Submit Recovery Code</span>
                                    <span v-else class="d-flex align-center">
                                        <HugeiconsIcon :icon="Loading03Icon" 
                                            size="20" 
                                            color="#fff" 
                                            class="mr-2 loading-icon" />
                                        Submitting...
                                    </span>
                                </v-btn>

                                <div class="login-link">
                                    <span>Has already an account?</span>
                                    <span class="login-text" @click="router.push('/')">Sign in here</span>
                                </div>
                            </v-form>

                            <v-form v-show="showPasswordsForm" v-model="isPasswordsFormValid"
                                @submit.prevent="handleSubmitPasswords" class="login-form" ref="passwords_form">
                                <h4 class="mb-5">This is your last step to reset your password.</h4>
                                <div class="input-wrapper">
                                    <div class="input-label">
                                        <HugeiconsIcon :icon="LockPasswordIcon" class="label-icon" />
                                        <span>New Password</span>
                                    </div>
                                    <v-text-field v-model="new_password" :rules="[requiredRule, passwordRule]"
                                        placeholder="Create a new strong password" variant="outlined" density="compact"
                                        :type="showNewPassword ? 'text' : 'password'" class="custom-input"
                                        hide-details="auto">
                                        <template v-slot:append-inner>
                                            <HugeiconsIcon :icon="showNewPassword ? ViewIcon : ViewOffIcon"
                                                @click="showNewPassword = !showNewPassword"
                                                class="cursor-pointer label-icon" style="z-index: 999;" />
                                        </template>
                                    </v-text-field>
                                </div>

                                <div class="input-wrapper mt-4">
                                    <div class="input-label">
                                        <HugeiconsIcon :icon="LockPasswordIcon" class="label-icon" />
                                        <span>Confirm New Password</span>
                                    </div>
                                    <v-text-field v-model="confirm_new_password"
                                        :rules="[requiredRule, confirmPasswordRule]" placeholder="Confirm your new password"
                                        variant="outlined" density="compact"
                                        :type="showConfirmPassword ? 'text' : 'password'" class="custom-input"
                                        hide-details="auto">
                                        <template v-slot:append-inner>
                                            <HugeiconsIcon :icon="showConfirmPassword ? ViewIcon : ViewOffIcon"
                                                @click="showConfirmPassword = !showConfirmPassword"
                                                class="cursor-pointer label-icon" style="z-index: 999;" />
                                        </template>
                                    </v-text-field>
                                </div>

                                <v-btn :disabled="!isPasswordsFormValid || submittingNewPassword" color="primary"
                                    type="submit" size="large" class="login-btn mt-6" height="52" block>
                                    <span v-if="!submittingNewPassword">Reset Password</span>
                                    <span v-else class="d-flex align-center">
                                        <HugeiconsIcon :icon="Loading03Icon" 
                                            size="20" 
                                            color="#fff" 
                                            class="mr-2 loading-icon" />
                                        Resetting password...
                                    </span>
                                </v-btn>

                                <v-btn color="primary" size="large" class="login-btn mt-3" height="52" block
                                    @click="tryAgain" style="background: transparent;">
                                    Try Again
                                </v-btn>

                                <div class="login-link">
                                    <span>Has already an account?</span>
                                    <span class="login-text" @click="router.push('/')">Sign in here</span>
                                </div>
                            </v-form>
                        </div>
                    </v-col>
                </v-row>
            </v-card>
        </v-container>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Mail01Icon, LockPasswordIcon, ViewIcon, ViewOffIcon, Loading03Icon } from '@hugeicons/core-free-icons'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

// Router
const router = useRouter()

// Toast
const toast = useToast()

// Reactive data
const logo = require('@/assets/Locinder-Submark.png')
const customer_email = ref('')
const recovery_code = ref('')
const new_password = ref('')
const confirm_new_password = ref('')
const showRecoveryForm = ref(false)
const showPasswordsForm = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isEmailFormValid = ref(false)
const isRecoveryCodeFormValid = ref(false)
const isPasswordsFormValid = ref(false)
const showRecoveryCode = ref(false)
const submittingEmail = ref(false)
const submittingRecoveryCode = ref(false)
const submittingNewPassword = ref(false)
const emailError = ref(false)

// Form refs
const email_form = ref(null)
const recovery_code_form = ref(null)
const passwords_form = ref(null)

// Validation rules
const requiredRule = (v) => !!v || 'This field is required'

const emailFormatRule = (v) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(v) || 'Please enter a valid email address'
}

const passwordRule = (v) => v.length >= 8 || 'Password must be at least 8 characters'

const confirmPasswordRule = () => {
    return new_password.value === confirm_new_password.value || 'Passwords do not match'
}

// Methods
const maskEmail = (email) => {
    if (!email) return ''
    const [localPart, domain] = email.split('@')
    if (localPart.length <= 4) return email
    return localPart.slice(0, 2) +
        '*'.repeat(localPart.length - 4) +
        localPart.slice(-2) +
        '@' + domain
}

const tryAgain = () => {
    isEmailFormValid.value = false
    isRecoveryCodeFormValid.value = false
    customer_email.value = null
    recovery_code.value = null
    new_password.value = null
    confirm_new_password.value = null
    showRecoveryForm.value = false
    showPasswordsForm.value = false
}

const handleSubmitEmail = async () => {
    const { valid } = await email_form.value.validate()
    if (!valid) return

    submittingEmail.value = true

    try {
        const authStore = useAuthStore()
        const result = await authStore.submitEmail({
            customer_email: customer_email.value,
        })

        if (result.success === true) {
            showRecoveryForm.value = true
            recovery_code.value = result.recovery_code // switch UI
        }

    } catch (error) {
        console.error(error)
        toast.error(error?.message)

        showRecoveryForm.value = false // stay on email form
    } finally {
        submittingEmail.value = false
    }
}

const handleSubmitRecoveryCode = async () => {
    const { valid } = await recovery_code_form.value.validate()
    if (!valid) return

    submittingRecoveryCode.value = true
    try {
        const authStore = useAuthStore()
        const result = await authStore.submitRecoveryCode({
            customer_email: customer_email.value,
            recovery_code: recovery_code.value,
        })
        if (result.success === true) {
            showPasswordsForm.value = true
        }
    } catch (error) {
        console.error(error)
        toast.error(error?.message)

        showPasswordsForm.value = false
    } finally {
        submittingRecoveryCode.value = false
    }
}

const handleSubmitPasswords = async () => {
    const { valid } = await passwords_form.value.validate()
    if (!valid) return

    submittingNewPassword.value = true
    try {
        const authStore = useAuthStore()

        const result = await authStore.submitNewPassword({
            customer_email: customer_email.value,
            recovery_code: recovery_code.value,
            new_password: new_password.value,
        })

        if (result.success === true) {
            toast.success(result.data.message)

            setTimeout(() => {
                window.location.href = '/'
            }, 2000)
        }
    } catch (error) {
        console.error(error)
        toast.error(error?.message)
    } finally {
        submittingNewPassword.value = false
    }
}
</script>

<style scoped>
.forgotpass-container {
    height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: linear-gradient(135deg, #faf8f5 0%, #fff6e3 100%);
    overflow: scroll;
}

/* Login Card */
.forgotpass-card {
    border-radius: 30px;
    overflow: scroll;
    box-shadow: none;
    max-width: 500px;
    margin: 0 auto;
    background: transparent !important;
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
    text-align: left;
    margin: 20px 0 0;
    position: relative;
    display: inline-block;
    width: 100%;
}

.loading-icon {
    animation: fastSpin 0.8s linear infinite;
}

@keyframes fastSpin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.subtitle {
    text-align: left;
    color: #707070;
    font-size: 1rem;
    margin-bottom: 25px;
}

/* Form Elements */
.login-form {
    margin-top: 16px;
}

.login-form h4 {
    font-weight: 600;
    color: #707070;
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

.login-link {
    text-align: center;
    margin-top: 20px;
    font-size: 0.8rem;
    color: #525252;
}

.login-text {
    color: #d46600;
    font-weight: 500;
    cursor: pointer;
    margin-left: 5px;
    transition: color 0.2s ease;
}

.login-text:hover {
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