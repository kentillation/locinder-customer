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

                            <h1>Forgot Password</h1>

                            <v-form v-show="!showRecoveryForm && !showPasswordsForm" v-model="isEmailFormValid"
                                @submit.prevent="handleSubmitEmail" class="login-form" ref="email_form">
                                <h4 class="mb-5">Enter your email address and we will proceed to reset your password.</h4>
                                <div class="input-wrapper">
                                    <div class="input-label">
                                        <v-icon icon="mdi-email-outline" size="18" class="label-icon" />
                                        <span>Email Address</span>
                                    </div>
                                    <v-text-field v-model="customer_email" :rules="[requiredRule, emailFormatRule]"
                                        placeholder="customer@gmail.com" variant="outlined" density="comfortable"
                                        autocomplete="username" class="custom-input" :error="emailError"
                                        hide-details="auto" />
                                </div>

                                <v-btn :disabled="!isEmailFormValid || submittingEmail" color="primary" type="submit"
                                    size="large" class="login-btn mt-6" height="52" block :loading="submittingEmail">
                                    <span v-if="!submittingEmail">Submit Email</span>
                                    <span v-else>Submitting...</span>
                                </v-btn>

                                <div class="login-link">
                                    <span>Has already an account?</span>
                                    <span class="login-text" @click="$router.push('/')">Sign in here</span>
                                </div>
                            </v-form>

                            <v-form v-show="showRecoveryForm && !showPasswordsForm" v-model="isRecoveryCodeFormValid"
                                @submit.prevent="handleSubmitRecoveryCode" class="login-form" ref="recovery_code_form">
                                <h4 class="mb-5">To continue, we have sent a recovery code to email {{
                                    maskEmail(this.customer_email) }}
                                </h4>
                                <div class="input-wrapper">
                                    <div class="input-label">
                                        <v-icon icon="mdi-lock-outline" size="18" class="label-icon" />
                                        <span>Recovery Code</span>
                                    </div>
                                    <v-text-field v-model="recovery_code" :rules="[requiredRule]"
                                        placeholder="Enter your recovery code" variant="outlined" density="comfortable"
                                        autocomplete="recovery_code" :type="showRecoveryCode ? 'text' : 'password'"
                                        class="custom-input" hide-details="auto" maxlength="6" counter="6">
                                        <template v-slot:append-inner>
                                            <v-icon :icon="showRecoveryCode ? 'mdi-eye-off' : 'mdi-eye'"
                                                @click="showRecoveryCode = !showRecoveryCode" class="cursor-pointer" />
                                        </template>
                                    </v-text-field>
                                </div>

                                <v-btn :disabled="!isRecoveryCodeFormValid || submittingRecoveryCode" color="primary"
                                    type="submit" size="large" class="login-btn mt-6" height="52" block
                                    :loading="submittingRecoveryCode">
                                    <span v-if="!submittingRecoveryCode">Submit Recovery Code</span>
                                    <span v-else>Submitting...</span>
                                </v-btn>

                                <div class="login-link">
                                    <span>Has already an account?</span>
                                    <span class="login-text" @click="$router.push('/')">Sign in here</span>
                                </div>
                            </v-form>

                            <v-form v-show="showPasswordsForm" v-model="isPasswordsFormValid"
                                @submit.prevent="handleSubmitPasswords" class="login-form" ref="passwords_form">
                                <h4 class="mb-5">This is your last step to reset your password.</h4>
                                <div class="input-wrapper">
                                    <div class="input-label">
                                        <v-icon icon="mdi-lock-outline" size="18" class="label-icon" />
                                        <span>New Password</span>
                                    </div>
                                    <v-text-field v-model="new_password" :rules="[requiredRule, passwordRule]"
                                        placeholder="Create a new strong password" variant="outlined" density="compact"
                                        :type="showNewPassword ? 'text' : 'password'" class="custom-input"
                                        hide-details="auto">
                                        <template v-slot:append-inner>
                                            <v-icon :icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                                @click="showNewPassword = !showNewPassword" class="cursor-pointer" />
                                        </template>
                                    </v-text-field>
                                </div>

                                <div class="input-wrapper mt-4">
                                    <div class="input-label">
                                        <v-icon icon="mdi-lock-check-outline" size="18" class="label-icon" />
                                        <span>Confirm New Password</span>
                                    </div>
                                    <v-text-field v-model="confirm_new_password"
                                        :rules="[requiredRule, confirmPasswordRule]" placeholder="Confirm your new password"
                                        variant="outlined" density="compact"
                                        :type="showConfirmPassword ? 'text' : 'password'" class="custom-input"
                                        hide-details="auto">
                                        <template v-slot:append-inner>
                                            <v-icon :icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                                @click="showConfirmPassword = !showConfirmPassword"
                                                class="cursor-pointer" />
                                        </template>
                                    </v-text-field>
                                </div>

                                <v-btn :disabled="!isPasswordsFormValid || submittingNewPassword" color="primary"
                                    type="submit" size="large" class="login-btn mt-6" height="52" block
                                    :loading="submittingNewPassword">
                                    <span v-if="!submittingNewPassword">Reset Password</span>
                                    <span v-else>Resetting...</span>
                                </v-btn>

                                <v-btn color="primary" size="large" class="login-btn mt-3" height="52" block
                                    @click="tryAgain" style="background: transparent;">
                                    Try Again
                                </v-btn>

                                <div class="login-link">
                                    <span>Has already an account?</span>
                                    <span class="login-text" @click="$router.push('/')">Sign in here</span>
                                </div>
                            </v-form>
                        </div>
                    </v-col>
                </v-row>
            </v-card>
        </v-container>
    </div>
</template>

<script>
import { useToast } from 'vue-toastification';
import { useAuthStore } from '@/stores/auth';

export default {
    name: 'LoginPage',
    components: {  },
    setup() {
        const toast = useToast();

        return {
            toast,
        };
    },
    data() {
        return {
            logo: require('@/assets/Locinder-Submark.png'),
            customer_email: '',
            recovery_code: '',
            new_password: '',
            confirm_new_password: '',
            showRecoveryForm: false,
            showPasswordsForm: false,
            showNewPassword: false,
            showConfirmPassword: false,
            isEmailFormValid: false,
            isRecoveryCodeFormValid: false,
            isPasswordsFormValid: false,
            showRecoveryCode: false,
            submittingEmail: false,
            submittingRecoveryCode: false,
            submittingNewPassword: false,
            emailError: false,
        };
    },
    methods: {

        requiredRule(v) {
            return !!v || 'This field is required';
        },

        emailFormatRule(v) {
            const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return pattern.test(v) || 'Please enter a valid email address';
        },

        passwordRule(v) {
            return v.length >= 8 || 'Password must be at least 8 characters';
        },

        confirmPasswordRule() {
            return this.new_password === this.confirm_new_password || 'Passwords do not match';
        },

        maskEmail(email) {
            if (!email) return '';
            const [localPart, domain] = email.split('@');
            if (localPart.length <= 4) return email;
            return localPart.slice(0, 2) +
                '*'.repeat(localPart.length - 4) +
                localPart.slice(-2) +
                '@' + domain;
        },

        tryAgain() {
            this.isEmailFormValid = false,
            this.isRecoveryCodeFormValid = false,
            this.customer_email = null;
            this.recovery_code = null;
            this.new_password = null;
            this.confirm_new_password = null;
            delete this.confirm_new_password;
            this.showRecoveryForm = false;
            this.showPasswordsForm = false;
        },

        async handleSubmitEmail() {
            const { valid } = await this.$refs.email_form.validate();
            if (!valid) return;

            this.submittingEmail = true;

            try {
                const authStore = useAuthStore();
                const result = await authStore.submitEmail({
                    customer_email: this.customer_email,
                });

                if (result.success === true) {
                    this.showRecoveryForm = true;
                    this.recovery_code = result.recovery_code; // switch UI
                }

            } catch (error) {
                console.error(error);
                this.toast.error(error?.message);

                this.showRecoveryForm = false; // stay on email form
            } finally {
                this.submittingEmail = false;
            }
        },

        async handleSubmitRecoveryCode() {
            const { valid } = await this.$refs.recovery_code_form.validate();
            if (!valid) return;

            this.submittingRecoveryCode = true;
            try {
                const authStore = useAuthStore();
                const result = await authStore.submitRecoveryCode({
                    customer_email: this.customer_email,
                    recovery_code: this.recovery_code,
                });
                if (result.success === true) {
                    this.showPasswordsForm = true;
                }
            } catch (error) {
                console.error(error);
                this.toast.error(error?.message);

                this.showPasswordsForm = false;
            } finally {
                this.submittingRecoveryCode = false;
            }
        },

        async handleSubmitPasswords() {
            const { valid } = await this.$refs.passwords_form.validate();
            if (!valid) return;

            this.submittingNewPassword = true;
            try {
                const authStore = useAuthStore();

                delete this.confirm_new_password;

                const result = await authStore.submitNewPassword({
                    customer_email: this.customer_email,
                    recovery_code: this.recovery_code,
                    new_password: this.new_password,
                });

                if (result.success === true) {
                    this.toast.success(result.data.message);

                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                }
            } catch (error) {
                console.error(error);
                this.toast.error(error?.message);
            } finally {
                this.submittingNewPassword = false;
            }
        },

    }
};
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

/* Login Card */
.login-card {
    border-radius: 30px;
    overflow: hidden;
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