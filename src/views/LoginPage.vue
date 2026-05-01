<template>
    <div class="login-container">
        <!-- Animated background elements -->
        <div class="animated-bg">
            <div class="gradient-sphere sphere-1"></div>
            <div class="gradient-sphere sphere-2"></div>
            <div class="gradient-sphere sphere-3"></div>
        </div>

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

                            <h1>Welcome to Locinder!</h1>

                            <p class="subtitle">A food discovery app for local delicacies in Sagay City</p>

                            <v-form ref="form" @submit.prevent="handleLogin" v-model="isFormValid" class="login-form">
                                
                                <v-alert v-if="error_text" type="error" class="mb-5" 
                                    style="font-size: 15px;">
                                    {{ error_text }}
                                </v-alert>
                                
                                <div class="input-wrapper">
                                    <div class="input-label">
                                        <v-icon icon="mdi-email-outline" size="18" class="label-icon" />
                                        <span>Email</span>
                                    </div>
                                    <v-text-field v-model="customer_email" :rules="[requiredRule, emailFormatRule]"
                                        placeholder="myname@example.com" variant="solo" density="comfortable"
                                        autocomplete="customer_email" class="custom-input" :error="emailError"
                                        hide-details="auto" />
                                </div>

                                <div class="input-wrapper mt-5">
                                    <div class="input-label">
                                        <v-icon icon="mdi-lock-outline" size="18" class="label-icon" />
                                        <span>Password</span>
                                    </div>
                                    <v-text-field v-model="customer_password" :rules="[requiredRule]"
                                        placeholder="Enter your password" variant="solo" density="comfortable"
                                        autocomplete="customer_password" :type="showPassword ? 'text' : 'password'"
                                        class="custom-input" hide-details="auto">
                                        <template v-slot:append-inner>
                                            <v-icon :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                                @click="showPassword = !showPassword" class="cursor-pointer" />
                                        </template>
                                    </v-text-field>
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
                                    <span class="register-text" @click="$router.push('/register')">Create one</span>
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

<script>
import Snackbar from '@/components/Snackbar.vue';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '@/stores/auth';

export default {
    name: 'LoginPage',
    components: { Snackbar },
    setup() {
        const toast = useToast();

        return {
            toast,
        };
    },
    data() {
        return {
            logo: require('@/assets/Logo.png'),
            customer_email: '',
            customer_password: '',
            error_text: '',
            showPassword: false,
            isFormValid: false,
            loading: false,
            emailError: false,
            validationErrors: {},
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

        async handleLogin() {
            const { valid } = await this.$refs.form.validate();
            if (!valid) return;

            this.loading = true;
            try {
                const authStore = useAuthStore();
                const result = await authStore.customerLogin({
                    customer_email: this.customer_email,
                    customer_password: this.customer_password
                });
                if (result.success) {
                    document.body.style.opacity = '0';
                    setTimeout(() => {
                        window.location.href = '/home';
                    }, 300);
                } else {
                    this.handleValidationErrors(result.errors);
                }
            } catch (error) {
                console.error(error);

                if (error.response) {
                    const status = error.response.status;
                    const data = error.response.data;

                    if (status === 422 && data.errors) {
                        this.handleValidationErrors(data.errors);
                        // this.toast.error(Object.values(data.errors)[0][0]);
                        this.error_text = Object.values(data.errors)[0][0];
                    } else if (status === 500) {
                        // this.toast.error(data.message);
                        this.error_text = data.message;
                    } else {
                        // this.toast.error(data.message);
                        this.error_text = data.message;
                    }
                } else if (error.request) {
                    // this.toast.error('Network error. Please check your connection.');
                    this.error_text = 'Network error. Please check your connection.';
                } else {
                    // this.toast.error(error.message);
                    this.error_text = error.message;
                }
            } finally {
                this.loading = false;
            }
        },

        handleValidationErrors(errors) {
            if (this.$refs.form && this.$refs.form.setErrors) {
                this.$refs.form.setErrors(errors);
            }
            this.validationErrors = errors;
        },
    }
};
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: linear-gradient(135deg, #faf8f5 0%, #fff6e3 100%);
    overflow: hidden;
}

/* Animated Background */
.animated-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
}

.gradient-sphere {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
    animation: float 20s infinite ease-in-out;
}

.sphere-1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(212, 162, 0, 0.3) 0%, rgba(180, 126, 0, 0.1) 100%);
    top: -200px;
    left: -200px;
    animation-delay: 0s;
}

.sphere-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(220, 147, 0, 0.25) 0%, rgba(180, 126, 0, 0.08) 100%);
    bottom: -100px;
    right: -100px;
    animation-delay: -5s;
}

.sphere-3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 162, 0, 0.2) 0%, rgba(180, 108, 0, 0.05) 100%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: -10s;
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
    margin: 20px 0 0;
    position: relative;
    display: inline-block;
    width: 100%;
}

/* Logo Animation */
.logo-wrapper {
    position: relative;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.logo-img {
    width: 100%;
    max-width: 200px;
    height: auto;
    position: relative;
    z-index: 1;
    transition: transform 0.3s ease;
    border-radius: 15px;
}

.brand-title {
    background: linear-gradient(135deg, #5c3a21 0%, #d46600 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;
    font-weight: 800;
}

.text-accent {
    background: linear-gradient(135deg, #5c3a21 0%, #d46600 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.text-accent:hover {
    background: linear-gradient(135deg, #d46600 0%, #5c3a21 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.beta-chip {
    position: relative;
    top: -8px;
    margin-left: 8px;
    font-weight: 500;
    background: linear-gradient(135deg, #5c3a21, #d49100);
    color: white;
    letter-spacing: 0.5px;
}

.subtitle {
    text-align: center;
    color: #a2a2a2;
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
    color: #5c3a21;
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

@keyframes float {

    0%,
    100% {
        transform: translate(0, 0) scale(1);
    }

    33% {
        transform: translate(30px, -40px) scale(1.1);
    }

    66% {
        transform: translate(-20px, 30px) scale(0.95);
    }
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