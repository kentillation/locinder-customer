<template>
    <div class="register-container">
        <v-container>
            <v-card class="register-card">
                <v-row no-gutters>
                    <!-- Form Section -->
                    <v-col cols="12" class="form-section">
                        <div class="form-content">
                            <!-- Logo with enhanced animation -->
                            <div class="logo-wrapper">
                                <img :src="logo" class="logo-img" loading="lazy" alt="Locinder Logo" />
                            </div>

                            <h1>Join the movement of Locinder</h1>

                            <p class="subtitle">A food discovery app for local delicacies in Sagay City</p>

                            <!-- Step Indicator -->
                            <div class="step-indicator">
                                <div v-for="step in steps" :key="step.number" class="step-item" :class="{
                                    active: currentStep === step.number,
                                    completed: currentStep > step.number
                                }" @click="goToStep(step.number)">
                                    <div class="step-circle">
                                        <HugeiconsIcon  v-if="currentStep > step.number"
                                            :icon="Tick02Icon" color="white" />
                                        <span v-else>{{ step.number }}</span>
                                    </div>
                                    <span class="step-label">{{ step.label }}</span>
                                </div>
                            </div>

                            <v-form ref="form" @submit.prevent="handleRegister" v-model="isFormValid"
                                class="register-form">
                                <!-- Step 1 -->
                                <div v-show="currentStep === 1" class="step-content mb-7" key="step1">
                                    <div class="input-wrapper">
                                        <div class="input-label">
                                            <HugeiconsIcon :icon="EditUser02Icon" class="label-icon" />
                                            <span>First name <sup>*</sup></span>
                                        </div>
                                        <v-text-field v-model="formData.first_name" :rules="[requiredRule, max50Rule]"
                                            placeholder="e.g. Juan" variant="solo" density="comfortable"
                                            class="custom-input" maxlength="30" counter="30" />
                                    </div>

                                    <div class="input-wrapper mt-3">
                                        <div class="input-label">
                                            <HugeiconsIcon :icon="EditUser02Icon" class="label-icon" />
                                            <span>Middle name</span>
                                        </div>
                                        <v-text-field v-model="formData.middle_name" :rules="[leaveBlank]"
                                            placeholder="e.g. Flores" variant="solo" density="comfortable"
                                            class="custom-input" maxlength="30" counter="30" />
                                    </div>

                                    <div class="input-wrapper mt-3">
                                        <div class="input-label">
                                            <HugeiconsIcon :icon="EditUser02Icon" class="label-icon" />
                                            <span>Last name <sup>*</sup></span>
                                        </div>
                                        <v-text-field v-model="formData.last_name" :rules="[requiredRule, max50Rule]"
                                            placeholder="e.g. Dela Cruz" variant="solo" density="comfortable"
                                            class="custom-input" maxlength="30" counter="30" />
                                    </div>

                                </div>

                                <!-- Step 2 -->
                                <div v-show="currentStep === 2" class="step-content mb-7" key="step2">
                                    <div class="input-wrapper">
                                        <div class="input-label">
                                            <HugeiconsIcon :icon="GithubIcon" class="label-icon" />
                                            <span>Pet's name</span>
                                        </div>
                                        <v-text-field v-model="formData.pet_name" :rules="[leaveBlank]"
                                            placeholder="e.g. Timmy" variant="solo" density="comfortable"
                                            class="custom-input" maxlength="30" counter="30" />
                                    </div>

                                    <div class="input-wrapper mt-3">
                                        <div class="input-label">
                                            <HugeiconsIcon :icon="HoldPhoneIcon" class="label-icon" />
                                            <span>Mobile number <sup>*</sup></span>
                                        </div>
                                        <v-text-field v-model="formData.customer_contact_number"
                                            :rules="[requiredRule, mobileNumberRule]" placeholder="0912 345 6789"
                                            variant="solo" density="comfortable" class="custom-input"
                                            hide-details="auto" />
                                    </div>

                                </div>

                                <!-- Step 3 -->
                                <div v-show="currentStep === 3" class="step-content" key="step3">
                                    <div class="input-wrapper">
                                        <div class="input-label">
                                            <HugeiconsIcon :icon="Mail01Icon" class="label-icon" />
                                            <span>Email <sup>*</sup></span>
                                        </div>
                                        <v-text-field v-model="formData.customer_email"
                                            :rules="[requiredRule, emailFormatRule]" placeholder="admin@example.com"
                                            variant="solo" density="comfortable" class="custom-input"
                                            hide-details="auto" />
                                    </div>

                                    <div class="input-wrapper mt-4">
                                        <div class="input-label">
                                            <HugeiconsIcon :icon="LockPasswordIcon" class="label-icon" />
                                            <span>Password <sup>*</sup></span>
                                        </div>
                                        <v-text-field v-model="formData.customer_password"
                                            :rules="[requiredRule, passwordRule]" placeholder="Create a strong password"
                                            variant="solo" density="comfortable"
                                            :type="showPassword ? 'text' : 'password'" class="custom-input"
                                            hide-details="auto">
                                            <template v-slot:append-inner>
                                                <HugeiconsIcon @click="showPassword = !showPassword"
                                                    :icon="showPassword ? ViewIcon : ViewOffIcon" 
                                                    class="cursor-pointer label-icon" 
                                                    style="z-index: 999;" />
                                            </template>
                                        </v-text-field>
                                    </div>

                                    <div class="input-wrapper mt-4">
                                        <div class="input-label">
                                            <HugeiconsIcon :icon="LockPasswordIcon" class="label-icon" />
                                            <span>Confirm Password <sup>*</sup></span>
                                        </div>
                                        <v-text-field v-model="formData.confirm_password"
                                            :rules="[requiredRule, confirmPasswordRule]"
                                            placeholder="Confirm your password" variant="solo" density="comfortable"
                                            :type="showConfirmPassword ? 'text' : 'password'" class="custom-input"
                                            hide-details="auto">
                                            <template v-slot:append-inner>
                                                <HugeiconsIcon @click="showConfirmPassword = !showConfirmPassword"
                                                    :icon="showConfirmPassword ? ViewIcon : ViewOffIcon" 
                                                    class="cursor-pointer label-icon" 
                                                    style="z-index: 999;" />
                                            </template>
                                        </v-text-field>
                                    </div>

                                    <div class="input-wrapper mt-4">
                                        <v-checkbox v-model="acceptTerms" hide-details class="terms-checkbox">
                                            <template #label>
                                                <p style="font-size: 12px !important;">
                                                    <span class="text-grey-darken-2">I accept the</span>
                                                    <span class="route-text" @click.stop="openTermsSheet">Terms and Conditions</span>
                                                </p>
                                            </template>
                                        </v-checkbox>
                                    </div>
                                </div>

                                <p style="font-size: 12px; font-style: italic; color: #afafaf; margin-bottom: 14px;">Note: The (<sup>*</sup>) indicates a required field</p>

                                <!-- Navigation Buttons -->
                                <div class="navigation-buttons">
                                    <v-btn v-if="currentStep > 1" variant="solo" size="large"
                                        class="nav-btn prev-btn" @click="prevStep" :disabled="loading">
                                        <v-icon style="font-size: 15px !important;" class="mr-2" left>mdi-arrow-left</v-icon>
                                        Previous
                                    </v-btn>

                                    <v-btn v-if="currentStep < totalSteps" color="primary" size="large"
                                        class="nav-btn next-btn" @click="nextStep" :disabled="!isStepValid || loading">
                                        Next
                                        <v-icon style="font-size: 15px !important;" class="ml-2" right>mdi-arrow-right</v-icon>
                                    </v-btn>

                                    <v-btn v-if="currentStep === totalSteps" color="primary" type="submit" size="large"
                                        class="nav-btn register-btn" :loading="loading"
                                        :disabled="!isFormValid || loading || !acceptTerms">
                                        <span v-if="!loading">Create Account</span>
                                        <span v-else>Creating...</span>
                                    </v-btn>
                                </div>

                                <div class="login-link">
                                    <span>Has already an account?</span>
                                    <span class="route-text" @click="router.push('/')">Sign in here</span>
                                </div>
                            </v-form>
                        </div>
                    </v-col>
                </v-row>
            </v-card>
            <!-- Bottom Sheet -->
            <v-bottom-sheet v-model="termsSheetVisible" inset>
                <v-card>
                    <v-card-title class="text-h5 pa-4 bg-warning">
                        Terms and Conditions
                    </v-card-title>

                    <v-card-text class="pa-4" style="max-height: 100vh; overflow-y: auto;">
                        <v-container class="bottom-sheet-container">
                            <div class="d-flex flex-column align-center mx-auto" width="100%" rounded>
                                <div class="text-left text-justify mb-4">
                                    <p>
                                        Please read these Terms and Conditions carefully while using the App operated by us.
                                        These Terms outline the rights and obligations between you and us regarding the
                                        use of the App.
                                    </p>
                                </div>

                                <!-- 1 -->
                                <div class="mb-2">
                                    <h3 class="mb-1">1. Acceptance of Terms</h3>
                                    <p class="ml-3 text-justify">
                                        By accessing or using the App, you agree to be bound by these Terms and all
                                        applicable
                                        laws and regulations. If you do not agree to these Terms, please refrain from
                                        using the
                                        App.
                                    </p>
                                </div>

                                <!-- 2 -->
                                <div class="mb-2">
                                    <h3 class="mb-1">2. Intellectual Property
                                    </h3>
                                    <p class="ml-3 text-justify">
                                        All content, including text, graphics, logos, images, available on the App,
                                        is our
                                        property or the property of my licensors and is protected by intellectual
                                        property laws.
                                        You may not reproduce, distribute, modify, display, or create derivative works
                                        of any
                                        content without our prior written consent.
                                    </p>
                                </div>

                                <!-- 3 -->
                                <div class="mb-2">
                                    <h3 class="mb-1">3. Use of the App</h3>
                                    <p class="ml-3 mb-2 text-justify">
                                        a. <em>Eligibility:</em> You must be at least 15 years old to use the App.
                                        By using the
                                        App,
                                        you represent and warrant that you are of the required age.
                                    </p>
                                    <p class="ml-3 mb-2 text-justify">
                                        b. <em>Prohibited Conduct:</em> You agree not to engage in any of the following
                                        activities
                                        while
                                        using the App:
                                    </p>
                                    <ul style="list-style-type: none;" class="ml-7">
                                        <li>
                                            <p class="ml-3 mb-2 text-justify">
                                                i. Violating any applicable laws or regulations;
                                            </p>
                                        </li>

                                        <li>
                                            <p class="ml-3 mb-2 text-justify">
                                                ii. Infringing upon the rights of others;
                                            </p>
                                        </li>

                                        <li>
                                            <p class="ml-3 mb-2 text-justify">
                                                iii. Uploading or transmitting any harmful, offensive, or unlawful
                                                content;
                                            </p>
                                        </li>

                                        <li>
                                            <p class="ml-3 mb-2 text-justify">
                                                iv. Interfering with the operation of the App or other users' access
                                                to it;
                                            </p>
                                        </li>

                                        <li>
                                            <p class="ml-3 mb-2 text-justify">
                                                v. Attempting to gain unauthorized access to any part of the App or
                                                its systems;
                                            </p>
                                        </li>

                                        <li>
                                            <p class="ml-3 mb-2 text-justify">
                                                vi. Engaging in any conduct that could damage, disable, or impair the
                                                App or its
                                                functionality.
                                            </p>
                                        </li>
                                    </ul>
                                </div>

                                <!-- 4 -->
                                <div class="mb-2">
                                    <h3 class="mb-1">4. Third-Party Content and
                                        Links</h3>
                                    <p class="ml-3 text-justify">
                                        The App may contain links to third-party Apps or resources. We do not
                                        endorse or
                                        assume any responsibility for the content, products, or services offered by
                                        third parties.
                                        Visiting any third-party Apps is at your own risk, and you should review the
                                        terms
                                        and privacy policies of such Apps.
                                    </p>
                                </div>

                                <!-- 5 -->
                                <div class="mb-2">
                                    <h3 class="mb-1">5. Limitation of Liability
                                    </h3>
                                    <p class="ml-3 text-justify">
                                        To the maximum extent permitted by law, we shall not be liable for any indirect,
                                        incidental,
                                        consequential, or punitive damages arising out of or relating to the use or
                                        inability to use
                                        the App, even if we have been advised of the possibility of such damages. We
                                        total
                                        liability, whether in contract, warranty, tort (including negligence), or
                                        otherwise,
                                        shall not exceed the amount paid by you, if any, for accessing the App.
                                    </p>
                                </div>

                                <!-- 6 -->
                                <div class="mb-2">
                                    <h3 class="mb-1">6. Indemnification</h3>
                                    <p class="ml-3 text-justify">
                                        You agree to indemnify, defend, and hold us harmless from and against any
                                        claims, damages,
                                        losses, liabilities, costs, or expenses arising out of or related to your use of
                                        the
                                        App or any violation of these Terms.
                                    </p>
                                </div>

                                <!-- 7 -->
                                <div class="mb-2">
                                    <h3 class="mb-1">7. Modifications to the
                                        Terms</h3>
                                    <p class="ml-3 text-justify">
                                        We reserve the right to modify or replace these Terms at any time without prior
                                        notice.
                                        By continuing to access or use the App after such modifications, you agree
                                        to be bound
                                        by the updated Terms.
                                    </p>
                                </div>

                                <!-- 8 -->
                                <div class="mb-2">
                                    <h3 class="mb-1">8. Severability</h3>
                                    <p class="ml-3 text-justify">
                                        If any provision of these Terms is found to be invalid or unenforceable, that
                                        provision
                                        shall be limited or eliminated to the minimum extent necessary, and the
                                        remaining provisions
                                        shall remain in full force and effect.
                                    </p>
                                </div>

                                <!-- 9 -->
                                <div class="mb-2">
                                    <h3 class="mb-1">9. Entire Agreement</h3>
                                    <p class="ml-3 text-justify">
                                        These Terms constitute the entire agreement between you and us regarding the use
                                        of the
                                        App, superseding any prior agreements or understandings.
                                    </p>
                                </div>

                                <!-- Last -->
                                <div class="mt-4">
                                    <p class="ml-3 mb-1 text-justify">
                                        If you have any concerns regarding with these Terms, please reach us at your
                                        convinient
                                        time.
                                    </p>
                                    <p class="ml-3 text-justify">
                                        By using the App, you acknowledge that you have read, understood, and agreed
                                        to these
                                        Terms of
                                        Use.
                                    </p>
                                </div>
                            </div>
                        </v-container>
                    </v-card-text>

                    <v-card-actions class="pa-4">
                        <v-spacer></v-spacer>
                        <v-btn @click="termsSheetVisible = false" 
                            color="warning" 
                            variant="solo"
                            class="mr-4"
                            icon>
                            <HugeiconsIcon :icon="CancelCircleIcon" size="20" class="mr-1" />
                            Close
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-bottom-sheet>
        </v-container>
    </div>
</template>

<script setup>
import { HugeiconsIcon } from '@hugeicons/vue'
import { Tick02Icon, 
    EditUser02Icon, GithubIcon, HoldPhoneIcon, 
    Mail01Icon, LockPasswordIcon, ViewIcon, ViewOffIcon,
    CancelCircleIcon } from '@hugeicons/core-free-icons'
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

// Assets
const logo = require('@/assets/Locinder-Submark.png')

// Composables
const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()

// Form ref
const form = ref(null)

// State
const currentStep = ref(1)
const totalSteps = 3
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const termsSheetVisible = ref(false)
const acceptTerms = ref(false)
const loading = ref(false)
const isFormValid = ref(false)
const validationErrors = ref({})

const formData = reactive({
    first_name: '',
    middle_name: '',
    last_name: '',
    pet_name: '',
    customer_contact_number: '',
    customer_email: '',
    customer_password: '',
    confirm_password: ''
})

const steps = [
    { number: 1, label: 'Customer Name' },
    { number: 2, label: 'Other Info' },
    { number: 3, label: 'Authorization' }
]

// Validation Rules
const requiredRule = (v) => !!v || 'This field is required'

const max50Rule = (v) => (v && v.length <= 30) || 'Maximum 50 characters only'

const leaveBlank = (v) => {
    if (!v || v.length === 0) return true
    return (v.length <= 30) || 'Maximum 30 characters only'
}

const emailFormatRule = (v) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(v) || 'Please enter a valid email address'
}

const mobileNumberRule = (v) => {
    const pattern = /^(\+63|0)[0-9]{10}$/
    return pattern.test(v.replace(/\s/g, '')) || 'Enter a valid Philippine mobile number (e.g., 09123456789 or +639123456789)'
}

const passwordRule = (v) => v.length >= 8 || 'Password must be at least 8 characters'

const confirmPasswordRule = () => {
    return formData.customer_password === formData.confirm_password || 'Passwords do not match'
}

// Computed
const isStepValid = computed(() => {
    if (currentStep.value === 1) {
        return !!(formData.first_name && formData.last_name)
    }
    if (currentStep.value === 2) {
        return !!(formData.customer_contact_number)
    }
    if (currentStep.value === 3) {
        return !!(formData.customer_email && formData.customer_password &&
            formData.confirm_password && formData.customer_password === formData.confirm_password)
    }
    return false
})

// Methods
const nextStep = () => {
    if (isStepValid.value) {
        currentStep.value++
        window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
        toast.error('Please fill in all required fields before proceeding')
    }
}

const prevStep = () => {
    if (currentStep.value > 1) {
        currentStep.value--
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
}

const goToStep = (step) => {
    if (step < currentStep.value) {
        currentStep.value = step
    } else if (step > currentStep.value && isStepValid.value) {
        currentStep.value = step
    } else if (step > currentStep.value) {
        toast.error('Please complete current step first.')
    }
}

const handleValidationErrors = (errors) => {
    if (form.value && form.value.setErrors) {
        form.value.setErrors(errors)
    }
    validationErrors.value = errors
}

const openTermsSheet = () => {
    termsSheetVisible.value = true
}

const handleRegister = async () => {
    const isValid = await form.value.validate()
    if (!isValid.valid) return

    loading.value = true
    try {
        await new Promise(resolve => setTimeout(resolve, 1500))

        const submissionData = {
            ...formData,
        }

        // Remove confirm_password as it's not needed in the backend
        delete submissionData.confirm_password

        const result = await authStore.customerRegistration(submissionData)

        if (result.success === true) {
            const redirectPath = route.query.redirect || '/home'

            toast.success(result.message)

            setTimeout(() => {
                window.location.href = redirectPath
            }, 2000)
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
                toast.error(Object.values(data.errors)[0][0])
            } else if (status === 500) {
                toast.error(data.message || 'Server error occurred')
            } else {
                toast.error(data.message || 'Registration failed')
            }
        } else if (error.request) {
            toast.error('Network error. Please check your connection.')
        } else {
            toast.error(error.message || 'An unexpected error occurred')
        }
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.bottom-sheet-container h3,
.bottom-sheet-container p {
    color: #444444;
}

.register-container {
    height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: linear-gradient(135deg, #faf8f5 0%, #fff6e3 100%);
    overflow: scroll;
}

/* Register Card */
.register-card {
    height: 100vh;
    border-radius: 30px;
    overflow: scroll;
    box-shadow: none;
    max-width: 500px;
    margin: 0 auto;
    background: transparent !important;
}

/* Form Section */
.form-section {
    padding: 48px 32px;
}

.form-content {
    max-width: 480px;
    margin: 25px;
}

.form-content h1 {
    font-size: 1.8rem;
    font-weight: 500;
    text-align: center;
    margin: 20px 0 10px;
    width: 100%;
    color: #000;
    line-height: 0.7cm;
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
    max-width: 110px;
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
    font-weight: 800;
}

.subtitle {
    text-align: center;
    color: #a2a2a2;
    font-size: 0.85rem;
    margin-bottom: 24px;
}

/* Step Indicator */
.step-indicator {
    display: flex;
    justify-content: space-between;
    margin-bottom: 32px;
    position: relative;
}

.step-indicator::before {
    content: '';
    position: absolute;
    top: 16px;
    left: 0;
    right: 0;
    height: 2px;
    background: #e0e0e0;
    z-index: 0;
}

.step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 1;
    cursor: pointer;
    flex: 1;
}

.step-circle {
    width: 34px;
    height: 34px;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #999;
    transition: all 0.3s ease;
    margin-bottom: 8px;
    padding: 2px;
}

.step-item.active .step-circle {
    background: linear-gradient(135deg, #5c3a21 0%, #d46600 100%);
    border-color: transparent;
    color: white;
}

.step-item.completed .step-circle {
    background: #4caf50;
    border-color: #4caf50;
    color: white;
}

.step-label {
    font-size: 0.7rem;
    font-weight: 500;
    color: #999;
    transition: color 0.3s ease;
}

.step-item.active .step-label {
    color: #d46600;
    font-weight: 600;
}

.step-item.completed .step-label {
    color: #4caf50;
}

/* Step Content */
.step-content {
    animation: fadeIn 0.4s ease-out;
}

/* Form Elements */
.register-form {
    margin-top: 8px;
}

.register-form sup {
    color: #e60000;
    font-size: 12px;
    top: -2px;
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

.custom-input :deep(.v-field) {
    border-radius: 8px;
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


/* Navigation Buttons */
.navigation-buttons {
    display: flex;
    justify-content: space-between;
    gap: 16px;
}

.nav-btn {
    width: 50%;
    text-transform: none;
    font-weight: 500;
    letter-spacing: 0.3px;
    border-radius: 40px;
    height: 48px;
}

.prev-btn {
    border-color: #d46600;
    color: #d46600;
}

.prev-btn:hover {
    background: rgba(212, 102, 0, 0.05);
    border-color: #5c3a21;
}

.next-btn,
.register-btn {
    background: linear-gradient(135deg, #5c3a21 0%, #d46600 100%);
    box-shadow:  none;
}

.next-btn:hover,
.register-btn:hover {
    transform: translateY(-2px);
}

.login-link {
    text-align: center;
    margin-top: 24px;
    font-size: 0.85rem;
    color: #525252;
}

.route-text {
    color: #d46600;
    font-weight: 600;
    cursor: pointer;
    margin-left: 5px;
    transition: color 0.2s ease;
}

.route-text:hover {
    color: #5c3a21;
    text-decoration: underline;
}

/* Optional: Remove padding from checkbox */
:deep(.v-checkbox .v-selection-control) {
    padding: 0 !important;
}

.no-padding-checkbox {
    padding: 0 !important;
}

/* Remove inner padding/margin from the input wrapper */
.no-padding-checkbox :deep(.v-input__control) {
    padding: 0 !important;
}

.no-padding-checkbox :deep(.v-selection-control) {
    padding: 0 !important;
    margin: 0 !important;
}

/* Animations */
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

@keyframes movePattern {
    0% {
        background-position: 0 0;
    }

    100% {
        background-position: 100px 100px;
    }
}

@keyframes blink {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.5;
        transform: scale(0.8);
    }
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 0.5;
    }

    50% {
        transform: scale(1.2);
        opacity: 0.8;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateX(10px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive */
@media (max-width: 960px) {
    .form-section {
        padding: 32px 24px;
    }

    .visual-section {
        min-height: 400px;
    }

    .feature-slide h3 {
        font-size: 1.3rem;
    }

    .benefit-title {
        font-size: 1.3rem;
    }
}

@media (max-width: 600px) {
    .form-content h1 {
        font-size: 1.5rem;
    }

    .step-label {
        font-size: 0.6rem;
    }

    .step-circle {
        width: 28px;
        height: 28px;
        font-size: 0.8rem;
    }

    .benefits-container {
        gap: 12px;
    }

    .benefit-title {
        font-size: 1.1rem;
    }

    .benefit-label {
        font-size: 0.6rem;
        max-width: 80px;
    }

    .feature-icon-wrapper {
        width: 60px;
        height: 60px;
    }

    .navigation-buttons {
        flex-direction: column;
    }

    .nav-btn {
        width: 100%;
    }
}

.cursor-pointer {
    cursor: pointer;
}

.row {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -8px;
}

.col-6 {
    flex: 0 0 50%;
    padding: 0 8px;
}
</style>