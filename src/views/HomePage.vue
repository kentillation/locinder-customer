<template>
    <v-container>
        <!-- Pull to Refresh Progress Indicator -->
        <div class="refresh-progress" :style="{
            transform: `translateY(${pullProgress}px)`,
            opacity: pullProgress > 0 ? 1 : 0
        }">
            <div class="progress-content">
                <div class="pull-icon" :class="{ 'rotating': isRefreshing || pullProgress >= 100 }">
                    <HugeiconsIcon :icon="Loading03Icon" size="40" :style="{
                        transform: `rotate(${rotationAngle}deg)`,
                        color: pullProgress >= 100 ? '#fff !important' : '#ccc !important',
                        background: pullProgress >= 100 ? '#5c3a21' : '#f8f8f8'
                    }"
                        style="border-radius: 50%; padding: 8px;" />
                </div>
            </div>
        </div>

        <!-- Scrollable Content -->
        <div ref="scrollContainer" class="scroll-content" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
            @touchend="handleTouchEnd">

            <!-- Headline -->
            <div class="headline d-flex align-center">
                <span><v-img :src="currentKrisantaImage" width="50" @click="showKrisantaDialog"></v-img></span>
                <div class="mx-1">
                    <h4>{{ currentDayGreeting }}, {{ authStore.firstName }}!</h4>
                    <div class="d-flex">
                        <div class="d-flex">
                            <v-icon class="mt-1 mr-1 text-grey-lighten-2"
                                style="font-size: 14px !important;">mdi-map-marker-outline</v-icon>
                            <h6>{{ locationStore.getAddress }}</h6>
                        </div>
                        <v-chip v-if="locationStore.permissionDenied" @click="requestLocation"
                            style="border: 1px solid #6cff00; font-size: 10px;" color="#6cff00" class="pl-1 pr-5"
                            size="small" variant="outline">
                            <v-icon style="font-size: 13px !important;">mdi-map-marker-outline</v-icon>
                            Enable Location
                        </v-chip>
                    </div>
                </div>
            </div>

            <div v-if="locationStore.isMoving" class="movement-indicator"
                :class="[locationStore.getMovementStatus, { 'fast-speed': locationStore.movementSpeed >= 60 }]">
                <v-icon small :class="getSpeedometerIconClass">
                    {{ getSpeedometerIcon }}
                </v-icon>
                <span>{{ locationStore.getFormattedSpeed }}</span>
            </div>

            <!-- Show driving warning based on speed -->
            <v-alert v-if="locationStore.isMoving && locationStore.movementSpeed > 10" :type="getSpeedAlertType"
                variant="outlined" density="compact" class="mb-5">
                {{ getSpeedWarningMessage }}
            </v-alert>

            <div v-if="krisantaDialog"
                :class="currentKrisantaImage === sleepingKrisantaImage ? 'd-none' : 'customer-dialog-overlay'"
                @click="closeKrisantaDialog">
                <div class="customer-dialog" @click.stop>
                    <div class="dialog-bubble">
                        <v-btn class="close-btn" @click="closeKrisantaDialog" size="small" elivation="0" icon>
                            <HugeiconsIcon :icon="CancelCircleIcon" size="20" />
                        </v-btn>
                        <div class="bubble-text">
                            Meow! 🐾 My name is <strong>Krisanta</strong>, isa ko ka stray cat. Soon, pwede taka
                            ma-guide sa pag explore
                            sang Locinder, sa subong naga-learn pa ko kung ano mas maayo himuon in the future. Enjoy
                            browsing!
                        </div>
                        <!-- Pointer pointing to the image -->
                        <div class="bubble-pointer"></div>
                    </div>
                    <div class="cat-avatar">
                        <v-img :src="currentKrisantaImage" width="50" rounded="circle"></v-img>
                    </div>
                </div>
            </div>

            <!-- Search -->
            <!-- Add find nearby shops based on movement -->
            <v-card class="search-box">
                <v-text-field v-model="searchBox" placeholder="Search food, drinks or stores..."
                    @keyup.enter="handleSearchBox" @keydown="handleKeyDown" @input="handleSearchInput"
                    :loading="searching">
                    <template v-slot:prepend-inner>
                        <HugeiconsIcon :icon="Search01Icon" size="20" class="mr-2" />
                    </template>
                    <template v-slot:append-inner>
                        <HugeiconsIcon v-if="searchBox" :icon="CancelCircleIcon" @click="clearSearch" size="20"
                            class="mr-2" />
                    </template>
                </v-text-field>
                <v-card v-if="searchSuggestions.length && searchBox?.length >= 2" class="suggestions-dropdown"
                    elevation="2">
                    <v-list>
                        <v-list-item v-for="(suggestion, index) in searchSuggestions"
                            :key="suggestion.type + (suggestion.value || index)" @click="selectSuggestion(suggestion)"
                            :class="{ 'v-list-item--active': index === selectedSuggestionIndex }"
                            :style="index === selectedSuggestionIndex ? 'background-color: #f5f5f5;' : ''">
                            <v-list-item-title class="d-flex align-center">

                                <HugeiconsIcon :icon="suggestion.type === 'category' ? Search01Icon : Store01Icon"
                                    size="20" class="mr-2" />

                                <template v-if="searchBox && suggestion.label">
                                    <span>{{ highlightMatch(suggestion.label, searchBox).before }}</span>
                                    <strong>{{ highlightMatch(suggestion.label, searchBox).match }}</strong>
                                    <span>{{ highlightMatch(suggestion.label, searchBox).after }}</span>
                                </template>
                                <template v-else-if="suggestion.label">
                                    <strong>{{ suggestion.label }}</strong>
                                </template>
                                <template v-else>
                                    <strong>Unknown</strong>
                                </template>
                            </v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-card>
            </v-card>

            <!-- Craving -->
            <v-card class="buttons-container">
                <template v-if="productsStore.loading">
                    <div class="title-skeleton">
                        <v-skeleton-loader type="sentences" width="200" class="no-background"></v-skeleton-loader>
                    </div>
                    <v-row>
                        <v-col v-for="c in 12" :key="c" cols="4" lg="3" md="4" sm="4" style="padding: 5px !important;">
                            <div class="button">
                                <v-skeleton-loader type="button" class="no-background"></v-skeleton-loader>
                            </div>
                        </v-col>
                    </v-row>
                </template>

                <template v-else>
                    <template v-if="productsStore.base_categories.length === 0">
                        <v-row>
                            <v-col cols="12">
                                <v-card class="no-found">
                                    <span><v-img :src="nofastfoodImage" width="130"></v-img></span>
                                    <p>No available product found</p>
                                    <span class="subtitle">
                                        Wala sang may nakita nga produkto
                                    </span>
                                </v-card>
                            </v-col>
                        </v-row>
                    </template>

                    <template v-else>
                        <h4>
                            What are you craving? <br />
                            <span>Ano gusto mo kaonon ukon imnon?</span>
                        </h4>
                        <v-row>
                            <v-col cols="4" lg="3" md="4" sm="4" style="padding: 5px !important;">
                                <v-btn @click="handleMealType" :disabled="currentTimeMeal === 'Not meal time'"
                                    class="button">
                                    <span class="button-item">
                                        <span>
                                            <v-img :src="currentTimeImage" width="40"></v-img>
                                        </span>
                                        <span class="button-text">
                                            <template v-if="currentTimeMeal === 'Midnight Snacks'">
                                                Midnight<br />Snacks
                                            </template>
                                            <template v-else-if="currentTimeMeal === 'Not meal time'">
                                                Not<br />Meal Time
                                            </template>
                                            <template v-else>
                                                {{ currentTimeMeal }}
                                            </template>
                                        </span>
                                    </span>
                                </v-btn>
                            </v-col>

                            <v-col v-for="(category) in limitedCategories" :key="category.label" cols="4" lg="3" md="4"
                                sm="4" style="padding: 5px !important;">
                                <v-btn class="button" @click="handleCategorySelect(category)">
                                    <span class="button-item">
                                        <span><v-img :src="productImages[category.label] || moreImage"
                                                width="40"></v-img></span>
                                        <span class="button-text">{{ category.label }}</span>
                                    </span>
                                </v-btn>
                            </v-col>

                            <v-col cols="4" lg="3" md="4" sm="4" style="padding: 5px !important;">
                                <v-btn @click="moreSheet = true" class="button">
                                    <span class="button-item">
                                        <span><v-img :src="moreImage" width="40"></v-img></span>
                                        <span class="button-text">More</span>
                                    </span>
                                </v-btn>
                            </v-col>
                        </v-row>
                    </template>
                </template>

            </v-card>

            <!-- New -->
            <v-btn @click="router.push('new-products')" class="new-product-btn content-between">
                <span class="text-wrap">
                    Check these new products<br />
                    <span class="subtitle">Lantawa mga bag-o nga produkto</span>
                </span>
                <template v-slot:append>
                    <HugeiconsIcon :icon=ArrowRight02Icon size="25" style="color: #fff !important;" />
                </template>
            </v-btn>

            <!-- Various stores -->
            <v-card class="buttons-container">
                <template v-if="shopStore.loading">
                    <div class="title-skeleton">
                        <v-skeleton-loader type="sentences" width="200" class="no-background"></v-skeleton-loader>
                    </div>
                    <v-row>
                        <v-col cols="12" style="padding: 5px !important;">
                            <div class="button mb-3 content-between" v-for="n in 5" :key="n">
                                <v-skeleton-loader type="avatar, sentences" width="300"
                                    class="no-background"></v-skeleton-loader>
                                <v-skeleton-loader type="sentences" width="200"
                                    class="no-background"></v-skeleton-loader>
                            </div>
                        </v-col>
                    </v-row>
                </template>

                <template v-else>
                    <!-- If no stores found -->
                    <template v-if="shopStore.shop_list.length === 0">
                        <v-row>
                            <v-col cols="12">
                                <v-card class="no-found">
                                    <span><v-img :src="nostoreImage" width="130"></v-img></span>
                                    <p class="mt-5">No available store found</p>
                                    <span class="subtitle">
                                        Wala sang may nakita nga baligyaan
                                    </span>
                                </v-card>
                            </v-col>
                        </v-row>
                    </template>

                    <template v-else>
                        <h4>
                            Various stores in Sagay <br />
                            <span>Mga baligyaan sa Sagay</span>
                        </h4>
                        <v-row>
                            <v-col cols="12" style="padding: 5px !important;" v-for="(shop) in limitedStores"
                                :key="shop.id">
                                <v-btn @click="toShop(shop)" class="button content-between">
                                    <span :class="isShopOpen(shop) ? 'badge-dot' : 'd-none'"></span>
                                    <v-avatar color="#5c3a21" size="40" class="mr-2 d-flex align-center justify-center">
                                        <template v-if="shop.image">
                                            <img :src="shop.image" width="50" alt="Avatar" />
                                        </template>

                                        <template v-else>
                                            <span style="color: white; font-weight: bold; font-size: 20px;">
                                                {{ (shop.name || '?').charAt(0).toUpperCase() }}
                                            </span>
                                        </template>
                                    </v-avatar>
                                    <div class="d-flex flex-column flex-grow-1 text-start overflow-hidden">
                                        <span class="text-wrap mr-15">
                                            {{ shop.name }}
                                        </span>
                                        <span class="text-grey-darken-1">
                                            {{ shop.type }}
                                        </span>
                                    </div>
                                    <div :class="!shop.lowest_price ? 'd-none' : 'd-flex align-end flex-column'"
                                        style="position: absolute; right: 10px;">
                                        <span class="text-grey-darken-1" style="font-size: 10px">
                                            Starts @
                                        </span>
                                        <span style="font-size: 18px">
                                            ₱{{ shop.lowest_price }}
                                        </span>
                                    </div>
                                </v-btn>
                            </v-col>
                        </v-row>
                    </template>
                </template>
            </v-card>

            <!-- Open -->
            <v-btn @click="openShops" class="open-shop-btn content-between">
                <span class="text-wrap">
                    These stores are open now <br />
                    <span class="subtitle">Mga baligyaan nga abri subong</span>
                </span>
                <template v-slot:append>
                    <HugeiconsIcon :icon=ArrowRight02Icon size="25" style="color: #fff !important;" />
                </template>
            </v-btn>

            <v-divider class="my-4"></v-divider>

            <!-- Surprise -->
            <v-btn @click="openSurpriseSheet" class="surprise-btn d-flex align-center text-none"
                :disabled="surpriseCooldown || surprising"
                :class="{ 'surprise-btn-cooldown': surpriseCooldown, 'surprise-btn-loading': surprising }">
                <span class="flex-center-column">
                    <v-img :src="openboxImage" width="35" class="flex-shrink-0"
                        :class="{ 'cooldown-icon': surpriseCooldown }"></v-img>
                    <div class="text-wrap">
                        <p>Surprise Me a random dish</p>
                        <span class="subtitle text-wrap">
                            Sorpresaha ko sang bisan ano nga pagkaon
                        </span>
                    </div>
                </span>
            </v-btn>
        </div>

        <!-- More Bottom Sheet -->
        <transition name="slide-up">
            <div v-if="moreSheet" class="custom-bottom-sheet" :style="{ height: sheetHeight + 'vh' }"
                @touchstart="startDrag" @touchmove="onDrag" @touchend="endDrag">
                <div class="drag-handle mt-3"></div>
                <v-card class="sheet-content">
                    <v-container>
                        <h4 class="text-left">
                            More choices for you<br />
                            <span>Iban pa nga pili-an para sa imo</span>
                        </h4>
                        <v-row class="px-2 mb-5">
                            <v-col v-for="(category) in sortedCategories" :key="category.label" cols="4" lg="3" md="4"
                                sm="4" style="padding: 5px !important;">
                                <v-btn class="button" @click="handleCategorySelect(category)">
                                    <span class="button-item">
                                        <span><v-img :src="productImages[category.label] || moreImage"
                                                width="40"></v-img></span>
                                        <span class="button-text">{{ category.label }}</span>
                                    </span>
                                </v-btn>
                            </v-col>
                        </v-row>
                        <!-- New -->
                        <v-btn @click="router.push('new-products')" class="new-product-btn content-between">
                            <span>
                                Check these new products<br />
                                <span class="subtitle">Lantawa mga bag-o nga produkto</span>
                            </span>
                            <template v-slot:append>
                                <HugeiconsIcon :icon=ArrowRight02Icon size="25" style="color: #fff !important;" />
                            </template>
                        </v-btn>
                    </v-container>
                </v-card>
            </div>
        </transition>
        <transition name="fade">
            <div v-if="moreSheet" class="sheet-overlay" @click="moreSheet = false"></div>
        </transition>

        <!--Surprise Bottom Sheet-->
        <transition name="slide-up">
            <div v-if="surpriseSheet" class="custom-bottom-sheet" :style="{ height: sheetHeight + 'vh' }"
                @touchstart="startDrag" @touchmove="onDrag" @touchend="endDrag">
                <div :class="!surpriseProduct ? 'd-none' : 'drag-handle'"></div>
                <v-card class="sheet-content">
                    <v-container>
                        <div class="flex-center-column">
                            <template v-if="surprising">
                                <p style="color: #5c3a21; font-size: 16px; margin-bottom: 16px;" class="mt-3">{{
                                    loadingSurpriseMessages[Math.floor(Math.random() * loadingSurpriseMessages.length)]
                                }}
                                </p>
                                <div class="mt-3 flex-center-column">
                                    <v-skeleton-loader type="image" width="200"
                                        class="no-background"></v-skeleton-loader>
                                    <v-skeleton-loader type="sentences" width="200"
                                        class="no-background"></v-skeleton-loader>
                                </div>
                            </template>
                            <template v-else>
                                <h4 class="mb-5">
                                    A surprise you deserve is <br />
                                    <span>Ang sorpresa nga deserve mo ay ang</span>
                                </h4>
                                <v-img :src="productImages[surpriseImage] || moreImage" width="100"></v-img>
                                <h3 class="mt-3" style="font-weight: 500;">{{ surpriseProduct }}</h3>
                                <span class="d-flex align-center">
                                    <h5 class="text-grey mr-1" style="font-weight: 500;">from {{ surpriseShopName }}
                                    </h5>
                                    <v-img :src="storeImage" width="15" class="mb-1"></v-img>
                                </span>
                                <v-btn @click="orderNow" class="order-now-btn px-10">Order Now</v-btn>
                            </template>
                        </div>
                    </v-container>
                </v-card>
            </div>
        </transition>
        <transition name="fade">
            <div v-if="surpriseSheet" class="sheet-overlay" @click="surpriseSheet = false"></div>
        </transition>
    </v-container>
</template>

<script setup>
import { HugeiconsIcon } from '@hugeicons/vue'
import { Loading03Icon, Search01Icon, Store01Icon, CancelCircleIcon, ArrowRight02Icon } from '@hugeicons/core-free-icons'
import { useAuthStore } from '@/stores/auth';
import { useLocationStore } from '@/stores/locationStore';
import { useRouter } from 'vue-router';
import { useShopStore } from '@/stores/shopStore';
import { useProductsStore } from '@/stores/productsStore';
import confetti from 'canvas-confetti';
import { useToast } from 'vue-toastification'
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const authStore = useAuthStore();
const locationStore = useLocationStore();
const shopStore = useShopStore();
const productsStore = useProductsStore();
const toast = useToast();
const router = useRouter();

const isShopOpen = (shop) => {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const [openH, openM] = shop.open_at.split(':').map(Number)
    const [closeH, closeM] = shop.close_at.split(':').map(Number)

    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM

    // normal case (same day closing)
    if (openMinutes < closeMinutes) {
        return currentMinutes >= openMinutes &&
            currentMinutes < closeMinutes
    }

    // overnight case (crosses midnight)
    return currentMinutes >= openMinutes ||
        currentMinutes < closeMinutes
}

// Data properties
const authCheckDone = ref(false);
const isOnline = ref(navigator.onLine);
const krisantaDialog = ref(false);
const searchBox = ref(null);
const searchTimeout = ref(null);
const searching = ref(false);
const debouncedSearch = ref(null);
const selectedSuggestionIndex = ref(-1);
const selectedBaseCategory = ref(null);
const itemsPerPage = ref(20);
const moreSheet = ref(false);
const sheetHeight = ref(60);
const startY = ref(0);
const startHeight = ref(60);
const SNAP_POINTS = {
    half: 60,
    full: 95,
};
const activeSheet = ref(null);
const surpriseSheet = ref(false);
const surpriseImage = ref(null);
const surpriseProduct = ref(null);
const surpriseProductId = ref(null);
const surpriseShopName = ref(null);
const surpriseShopId = ref(null);
const surpriseShopBranchId = ref(null);
const surpriseShopType = ref(null);
const surpriseShopAddress = ref(null);
const surpriseOpenAt = ref(null);
const surpriseCloseAt = ref(null);
const surprising = ref(false);
const loadingSurpriseMessages = ref([
    "🎉 Ginahanda na ang imo sorpresa...",
    "🎉 May ara kami sorpresa nga namit...",
    "🎉 Kadali lang gid, ari na imo sorpresa..."
]);
const currentTimeImage = ref(require('@/assets/img/png/food/Current Time.png'));
const moreImage = ref(require('@/assets/img/png/food/Cutlery.png'));
const storeImage = ref(require('@/assets/img/png/food/Store.png'));
const openboxImage = ref(require('@/assets/img/png/box/Open Box.png'));
const nostoreImage = ref(require('@/assets/img/png/food/No Store.png'));
const nofastfoodImage = ref(require('@/assets/img/png/food/No Fast Food.png'));
const happyKrisantaImage = ref(require('@/assets/img/png/krisanta/Happy Krisanta.png'));
const tiredKrisantaImage = ref(require('@/assets/img/png/krisanta/Tired Krisanta.png'));
const sleepingKrisantaImage = ref(require('@/assets/img/png/krisanta/Sleeping Krisanta.png'));
const currentHour = ref(new Date().getHours());
const currentMinute = ref(new Date().getMinutes());
const timeInterval = ref(null);
// Pull to refresh properties
const isRefreshing = ref(false);
const pullProgress = ref(0);
const scrollContainer = ref(null);
const touchStartY = ref(0);
const isPulling = ref(false);
const PULL_THRESHOLD = 200;
const showProgressThreshold = 100;
const rotationAngle = ref(0);
const rotationInterval = ref(null);
const surpriseCooldown = ref(false);
const surpriseCooldownInterval = ref(null);
const surpriseCooldownEndTime = ref(null);

// Computed properties
const getSpeedometerIcon = computed(() => {
    const speed = locationStore.movementSpeed;

    if (speed < 5) {
        return 'mdi-speedometer-slow';
    } else if (speed < 30) {
        return 'mdi-speedometer-medium';
    } else {
        return 'mdi-speedometer';
    }
});

const getSpeedometerIconClass = computed(() => {
    const speed = locationStore.movementSpeed;

    return {
        'speed-icon-slow': speed < 5,
        'speed-icon-medium': speed >= 5 && speed < 30,
        'speed-icon-fast': speed >= 30,
        'speed-icon-very-fast': speed >= 60
    };
});

const getSpeedAlertType = computed(() => {
    const speed = locationStore.movementSpeed;

    if (speed >= 60) {
        return 'error';
    } else if (speed >= 40) {
        return 'warning';
    } else {
        return 'info';
    }
});

const getSpeedWarningMessage = computed(() => {
    const speed = locationStore.movementSpeed;

    if (speed >= 80) {
        return '⚠️ High speed detected! Please drive safely and don\'t use the app while driving!';
    } else if (speed >= 60) {
        return '🚗 You\'re driving quite fast. Please focus on the road!';
    } else if (speed >= 40) {
        return '🚙 Driving detected. Please be safe on the road!';
    } else {
        return '🚶 Moving detected. Stay safe!';
    }
});

const allCategories = computed(() => {
    return productsStore.getBaseCategories.slice(10);
});

const sortedCategories = computed(() => {
    const others = allCategories.value.find(c => c.label === 'Other');
    const rest = allCategories.value.filter(c => c.label !== 'Other');
    return others ? [...rest, others] : rest;
});

const limitedCategories = computed(() => {
    return productsStore.getBaseCategories.slice(0, 10);
});

const limitedStores = computed(() => {
    return shopStore.getShops.slice(0, 20);
});

const searchSuggestions = computed(() => {
    if (!searchBox.value || searchBox.value.length < 2) return [];

    const searchLower = searchBox.value.toLowerCase();
    const suggestions = [];

    if (productsStore.getBaseCategories && Array.isArray(productsStore.getBaseCategories)) {
        const categorySuggestions = productsStore.getBaseCategories
            .filter(category => category && category.label && category.label.toLowerCase().includes(searchLower))
            .map(category => ({
                type: 'category',
                label: category.label,
                value: category.label
            }));
        suggestions.push(...categorySuggestions);
    }

    const shopsArray = shopStore.getShops;

    if (shopsArray && shopsArray.length > 0) {
        const storeSuggestions = shopsArray
            .filter(shop => {
                if (!shop) return false;
                const shopName = shop.name;
                return shopName && shopName.toLowerCase().includes(searchLower);
            })
            .map(shop => ({
                type: 'store',
                label: shop.name,
                value: shop.id,
                shopData: shop
            }));
        suggestions.push(...storeSuggestions);
    }

    return suggestions.slice(0, 10);
});

const productImages = computed(() => {
    const images = require.context('@/assets/img/png/food', false, /\.png$/);
    const map = {};
    images.keys().forEach(fileName => {
        const cleanName = fileName
            .replace('./', '')
            .replace('.png', '');
        map[cleanName] = images(fileName);
    });
    return map;
});

const currentDayGreeting = computed(() => {
    const hour = currentHour.value;

    if (hour >= 0 && hour < 5) {
        return 'Si Krisanta tulog na, ikaw pud';
    }
    else if (hour >= 5 && hour < 12) {
        return 'Maayong aga';
    }
    else if (hour >= 12 && hour < 14) {
        return 'Maayong udto';
    }
    else if (hour >= 14 && hour < 18) {
        return 'Maayong hapon';
    }
    else {
        return 'Maayong gab-i';
    }
});

const currentKrisantaImage = computed(() => {
    const hour = currentHour.value;

    if (hour === 22 || hour === 23) {
        return tiredKrisantaImage.value;
    }
    else if (hour >= 0 && hour <= 5) {
        return sleepingKrisantaImage.value;
    }
    else {
        return happyKrisantaImage.value;
    }
});

const currentTimeMeal = computed(() => {
    const hour = currentHour.value;

    if (hour >= 6 && hour < 12) {
        return 'Breakfast';
    }
    else if (hour >= 12 && hour < 14) {
        return 'Lunch';
    }
    else if (hour >= 14 && hour < 18) {
        return 'Snacks';
    }
    else if (hour >= 18 && hour < 23) {
        return 'Dinner';
    }
    else {
        return 'Not meal time';
    }
});


// Methods
const checkAuthentication = async () => {
    if (!authStore.token) {
        authStore.clearAuth();
        router.replace('/');
        return false;
    }

    authCheckDone.value = true;
    return true;
};

const initializeLocationWithMovementTracking = async () => {
    try {
        const trackingPreference = localStorage.getItem('location_tracking_preference');

        if (trackingPreference === 'always') {
            await locationStore.startContinuousTracking({
                highAccuracy: true,
                adaptiveInterval: true
            });
        } else {
            await locationStore.getCurrentLocation({ force: false });
        }
    } catch (error) {
        console.error('Location initialization failed:', error);
    }
};

const requestLocation = async () => {
    try {
        const wantTracking = confirm('Do you want to keep tracking your location while moving? This will help provide better recommendations.');

        if (wantTracking) {
            localStorage.setItem('location_tracking_preference', 'always');
            await locationStore.startContinuousTracking({
                highAccuracy: true,
                adaptiveInterval: true
            });
        } else {
            localStorage.setItem('location_tracking_preference', 'once');
            await locationStore.getCurrentLocation({ force: true });
        }

        toast.success('Location enabled successfully!');
    } catch (error) {
        toast.error('Unable to get location. Please enable location permissions.');
    }
};

const onOnline = () => {
    isOnline.value = true;
    toast.info('Internet connection restored');
};

const showKrisantaDialog = () => {
    krisantaDialog.value = true;
};

const closeKrisantaDialog = () => {
    krisantaDialog.value = false;
};

const fetchShops = async () => {
    if (shouldSkipFetch(null)) return;

    try {
        const request = buildShopRequest(null);
        await shopStore.fetchShopListStore(request);
    } catch (error) {
        console.error('Error fetching stores:', error);
    }
};

const fetchProductBaseCategories = async () => {
    if (productsStore.base_categories && productsStore.base_categories.length > 0) {
        return;
    }
    try {
        await productsStore.fetchBaseCategoriesStore();
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
};

const sanitizeSearchTerm = (term) => {
    if (!term) return '';
    return term.trim()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();
};

const handleSearchInput = () => {
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
    }

    searchTimeout.value = setTimeout(() => {
        if (searchBox.value && searchBox.value.length >= 2) {
            const suggestions = searchSuggestions.value;
            if (suggestions.length > 0) {
                console.log('Suggestions:', suggestions);
            }
        }
    }, 300);
};

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const setupDebouncedSearch = () => {
    debouncedSearch.value = debounce(() => {
        if (searchBox.value && searchBox.value.trim()) {
            handleSearchBox();
        }
    }, 500);
};

const handleStoreSearch = async (suggestion) => {
    if (!suggestion || !suggestion.value) {
        toast.error('Invalid store selection');
        return;
    }

    searching.value = true;
    try {
        const shopsArray = shopStore.getShops;

        if (!shopsArray || !Array.isArray(shopsArray)) {
            toast.error('Store data not available');
            return;
        }

        const shop = shopsArray.find(s => s && s.id === suggestion.value);

        if (shop) {
            await new Promise(resolve => setTimeout(resolve, 0));
            router.push({
                path: '/shop/',
                query: {
                    shopId: shop.id,
                    branchId: shop.branch_id,
                    shopName: shop.name,
                    shopType: shop.type,
                    shopAddress: shop.address,
                    openAt: shop.open_at,
                    closeAt: shop.close_at,
                }
            });
        } else {
            console.error('Store not found. Looking for ID:', suggestion.value);
            console.error('Available shops:', shopsArray);
            toast.error('Store not found');
        }
    } catch (error) {
        console.error("Error navigating to store:", error);
        toast.error('An error occurred while searching for the store');
    } finally {
        searching.value = false;
    }
};

const openShops = async () => {
    router.push({
        path: '/shop-list',
        query: {
            requested_time_between: `${currentHour.value}:${currentMinute.value}`
        }
    });
};

const handleSearchBox = async () => {
    if (!searchBox.value || !searchBox.value.trim()) {
        toast.error('Please enter text on the search box');
        return;
    }

    searching.value = true;

    const rawSearchTerm = searchBox.value.trim();
    const sanitizedTerm = sanitizeSearchTerm(rawSearchTerm);

    if (!sanitizedTerm) {
        toast.error('Please enter a valid text on the search box');
        searching.value = false;
        return;
    }

    try {
        // First, check for exact category matches
        let exactCategoryMatch = null;
        if (productsStore.getBaseCategories && Array.isArray(productsStore.getBaseCategories)) {
            exactCategoryMatch = productsStore.getBaseCategories.find(
                category => category && category.label &&
                    category.label.toLowerCase() === sanitizedTerm
            );
        }

        // If there's an exact category match, go to category view
        if (exactCategoryMatch) {
            await new Promise(resolve => setTimeout(resolve, 0));
            router.push({
                path: '/shop-where-to-buy/',
                query: {
                    baseCategory: exactCategoryMatch.label
                }
            });
            searching.value = false;
            return;
        }

        // If no exact category match, then check for store matches
        const shopsArray = shopStore.getShops;
        let matchingStore = null;
        if (shopsArray && Array.isArray(shopsArray)) {
            matchingStore = shopsArray.find(shop => {
                if (!shop) return false;
                const shopName = (shop.name || '').toLowerCase();
                return shopName === sanitizedTerm || shopName.includes(sanitizedTerm);
            });
        }

        if (matchingStore) {
            router.push({
                path: '/shop/',
                query: {
                    shopId: matchingStore.id,
                    branchId: matchingStore.branch_id,
                    shopName: matchingStore.name,
                    shopType: matchingStore.type,
                    shopAddress: matchingStore.address,
                    openAt: matchingStore.open_at,
                    closeAt: matchingStore.close_at,
                }
            });
            searching.value = false;
            return;
        }

        // Finally, check for partial category matches
        let partialCategoryMatch = null;
        if (productsStore.getBaseCategories && Array.isArray(productsStore.getBaseCategories)) {
            partialCategoryMatch = productsStore.getBaseCategories.find(
                category => category && category.label &&
                    category.label.toLowerCase().includes(sanitizedTerm)
            );
        }

        // If no matches at all, search with the raw term
        await new Promise(resolve => setTimeout(resolve, 0));
        router.push({
            path: '/shop-where-to-buy/',
            query: {
                ...(partialCategoryMatch ? { baseCategory: partialCategoryMatch.label } : { baseCategory: rawSearchTerm })
            }
        });
    } catch (error) {
        console.error("Error in search filtering:", error);
        toast.error('An error occurred while searching. Please try again!');
    } finally {
        searching.value = false;
    }
};

const handleCategorySearch = async (suggestion) => {
    if (!suggestion || !suggestion.label) {
        toast.error('Invalid category selection');
        return;
    }

    searching.value = true;
    try {
        await new Promise(resolve => setTimeout(resolve, 0));
        router.push({
            path: '/shop-where-to-buy/',
            query: {
                baseCategory: suggestion.label
            }
        });
    } catch (error) {
        console.error("Error navigating to category:", error);
        toast.error('An error occurred while searching for the category');
    } finally {
        searching.value = false;
    }
};

const highlightMatch = (suggestion, searchTerm) => {
    if (!suggestion || !searchTerm) return suggestion || '';

    const suggestionStr = String(suggestion);
    const searchTermStr = String(searchTerm);

    const searchLower = searchTermStr.toLowerCase();
    const suggestionLower = suggestionStr.toLowerCase();
    const index = suggestionLower.indexOf(searchLower);

    if (index === -1) return suggestionStr;

    const before = suggestionStr.substring(0, index);
    const match = suggestionStr.substring(index, index + searchTermStr.length);
    const after = suggestionStr.substring(index + searchTermStr.length);

    return {
        before,
        match,
        after
    };
};

const selectSuggestion = (suggestion) => {
    searchBox.value = suggestion.label;
    if (suggestion.type === 'category') {
        handleCategorySearch(suggestion);
    } else if (suggestion.type === 'store') {
        handleStoreSearch(suggestion);
    }
    selectedSuggestionIndex.value = -1;
};

const handleKeyDown = (event) => {
    if (!searchSuggestions.value.length) return;

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        selectedSuggestionIndex.value = (selectedSuggestionIndex.value + 1) % searchSuggestions.value.length;
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        selectedSuggestionIndex.value = selectedSuggestionIndex.value <= 0
            ? searchSuggestions.value.length - 1
            : selectedSuggestionIndex.value - 1;
    } else if (event.key === 'Enter' && selectedSuggestionIndex.value >= 0) {
        event.preventDefault();
        const suggestion = searchSuggestions.value[selectedSuggestionIndex.value];
        selectSuggestion(suggestion);
        selectedSuggestionIndex.value = -1;
    }
};

const handleCategorySelect = async (category) => {
    if (!category || !category.label) {
        toast.error('Invalid category selected');
        return;
    }

    const categoryExists = productsStore.getBaseCategories.some(
        cat => cat.label === category.label
    );

    if (!categoryExists) {
        toast.error('Selected category is not available');
        return;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 0));
        selectedBaseCategory.value = category.label;
        searchBox.value = '';

        router.push({
            path: '/shop-where-to-buy/',
            query: {
                baseCategory: category.label,
            }
        });
    } catch (error) {
        console.error('Error navigating to category:', error);
        toast.error('Error loading product category');
    }
};

const handleMealType = async () => {
    if (!currentTimeMeal.value) {
        toast.error('No current meal type');
        return;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 0));

        router.push({
            path: '/meal/',
            query: {
                mealType: currentTimeMeal.value
            }
        });

    } catch (error) {
        console.error('Error navigating to meal type:', error);
        toast.error('Error loading meal type products');
    }
};

const toShop = (shop) => {
    router.push({
        path: '/shop/',
        query: {
            shopId: shop.id,
            branchId: shop.branch_id,
            shopName: shop.name,
            shopType: shop.type,
            shopAddress: shop.address,
            openAt: shop.open_at,
            closeAt: shop.close_at,
        }
    });
};

const orderNow = () => {
    toast.warning('Ordering feature is unavailable.');
    setTimeout(() => {
        toast.warning('Redirecting to shop page');
        setTimeout(() => {
            router.push({
                path: '/shop/',
                query: {
                    shopId: surpriseShopId.value,
                    branchId: surpriseShopBranchId.value,
                    shopName: surpriseShopName.value,
                    shopType: surpriseShopType.value,
                    shopAddress: surpriseShopAddress.value,
                    openAt: surpriseOpenAt.value,
                    closeAt: surpriseCloseAt.value,
                    requestedCategory: surpriseImage.value,
                }
            })
        }, 1000);
    }, 3000);
};

const clearSearch = () => {
    searchBox.value = null;
    selectedBaseCategory.value = null;
};

const startTimeTracking = () => {
    updateTime();
    timeInterval.value = setInterval(updateTime, 60000);
};

const updateTime = () => {
    const now = new Date();
    currentHour.value = now.getHours();
    currentMinute.value = now.getMinutes();
};

const buildShopRequest = (timeBetween = null) => {
    return {
        requested_category: null,
        requested_meal_type: null,
        requested_time_between: timeBetween,
        items_per_page: itemsPerPage.value,
    };
};

const shouldSkipFetch = (timeBetween = null) => {
    const store = shopStore;

    return (
        store.lastCategory === null &&
        store.lastMealType === null &&
        store.lastTimeBetween === timeBetween &&
        store.shop_list.length > 0
    );
};

const startSurpriseCooldown = () => {
    surpriseCooldown.value = true;
    surpriseCooldownEndTime.value = Date.now() + 60000;

    // Save to localStorage
    localStorage.setItem('surpriseCooldownEndTime', surpriseCooldownEndTime.value);

    updateCooldownProgress();

    surpriseCooldownInterval.value = setInterval(() => {
        updateCooldownProgress();
    }, 100);
};

const updateCooldownProgress = () => {
    if (!surpriseCooldownEndTime.value) return;

    const now = Date.now();
    const remaining = surpriseCooldownEndTime.value - now;

    if (remaining <= 0) {
        stopSurpriseCooldown();
    } else {
        // Calculate progress percentage
        const progress = (remaining / 60000) * 100;
        // Update CSS variable for animation
        const sheetEl = document.querySelector('.surprise-btn-cooldown');
        if (sheetEl) {
            sheetEl.style.setProperty('--cooldown-progress', `${progress}%`);
        }
    }
};

const stopSurpriseCooldown = () => {
    surpriseCooldown.value = false;
    surpriseCooldownEndTime.value = null;

    // Remove from localStorage
    localStorage.removeItem('surpriseCooldownEndTime');

    if (surpriseCooldownInterval.value) {
        clearInterval(surpriseCooldownInterval.value);
        surpriseCooldownInterval.value = null;
    }

    // Reset CSS variable
    const sheetEl = document.querySelector('.surprise-btn-cooldown');
    if (sheetEl) {
        sheetEl.style.removeProperty('--cooldown-progress');
    }
};

const checkAndRestoreCooldown = () => {
    // Check localStorage for saved cooldown
    const savedEndTime = localStorage.getItem('surpriseCooldownEndTime');
    if (savedEndTime) {
        surpriseCooldownEndTime.value = parseInt(savedEndTime);
    }

    if (surpriseCooldownEndTime.value) {
        const now = Date.now();
        const remaining = surpriseCooldownEndTime.value - now;

        if (remaining > 0) {
            // Cooldown is still active, restore it
            surpriseCooldown.value = true;

            // Update the animation progress immediately
            setTimeout(() => {
                const progress = (remaining / 60000) * 100;
                const sheetEl = document.querySelector('.surprise-btn-cooldown');
                if (sheetEl) {
                    sheetEl.style.setProperty('--cooldown-progress', `${progress}%`);
                }
            }, 0);

            // Restart the interval
            if (surpriseCooldownInterval.value) {
                clearInterval(surpriseCooldownInterval.value);
            }

            surpriseCooldownInterval.value = setInterval(() => {
                updateCooldownProgress();
            }, 100);
        } else {
            // Cooldown expired
            stopSurpriseCooldown();
        }
    }
};

const openSurpriseSheet = async () => {
    if (surpriseCooldown.value) {
        const remainingSeconds = Math.ceil((surpriseCooldownEndTime.value - Date.now()) / 1000);
        toast.warning(`Please wait ${remainingSeconds} seconds before trying again.`);
        return;
    }

    const time = `${currentHour.value}:${currentMinute.value}`;

    sheetHeight.value = 60;
    surprising.value = true;
    surpriseSheet.value = true;

    try {
        const request = buildShopRequest(time);

        await shopStore.fetchShopListStore(request, true);

        setTimeout(() => {
            if (currentTimeMeal.value === 'Not meal time') {
                surprising.value = false;
                surpriseSheet.value = false;
                sheetHeight.value = 60;
            } else {
                const shops = shopStore.getSurpriseShops;
                if (shops && shops.length > 0) {
                    const randomCategory = shops[Math.floor(Math.random() * shops.length)];
                    surpriseImage.value = randomCategory.category_label;
                    surpriseProduct.value = randomCategory.product;
                    surpriseProductId.value = randomCategory.productId;
                    surpriseShopName.value = randomCategory.name;
                    surpriseShopId.value = randomCategory.id;
                    surpriseShopBranchId.value = randomCategory.branch_id;
                    surpriseShopType.value = randomCategory.type;
                    surpriseShopAddress.value = randomCategory.address;
                    surpriseOpenAt.value = randomCategory.open_at;
                    surpriseCloseAt.value = randomCategory.close_at;
                    confetti({
                        particleCount: 200,
                        spread: 100,
                        origin: { x: 0.5, y: 0.5 },
                        zIndex: 9999,
                        startVelocity: 20,
                        colors: [
                            '#db0000',
                            '#d3d700',
                            '#6dd301',
                            '#00dcce',
                            '#0017e3',
                            '#bc00dd',
                        ]
                    });

                    startSurpriseCooldown();
                } else {
                    toast.error('No product available. Please try again!');
                    surpriseSheet.value = false;
                }
            }
            surprising.value = false;
        }, 4000);
    } catch (error) {
        console.error('Error fetching stores:', error);
        surprising.value = false;
        surpriseSheet.value = false;
        sheetHeight.value = 60;
    }
};

const startDrag = (e) => {
    if (surprising.value) return;

    // Determine which sheet is active
    if (moreSheet.value) {
        activeSheet.value = 'more';
    } else if (surpriseSheet.value) {
        activeSheet.value = 'surprise';
    } else {
        return;
    }

    startY.value = e.touches[0].clientY;
    startHeight.value = sheetHeight.value;
};

const onDrag = (e) => {
    if (surprising.value) return;

    if (!activeSheet.value) return;

    const currentY = e.touches[0].clientY;
    const delta = startY.value - currentY;
    let newHeight = startHeight.value + delta / 6;
    newHeight = Math.max(0, Math.min(95, newHeight));
    sheetHeight.value = newHeight;
};

const endDrag = () => {
    if (surprising.value) return;

    if (!activeSheet.value) return;

    const shthght = sheetHeight.value;
    if (shthght < 10) {
        if (activeSheet.value === 'more') {
            moreSheet.value = false;
        } else if (activeSheet.value === 'surprise') {
            surpriseSheet.value = false;
        }
        sheetHeight.value = SNAP_POINTS.half;
        activeSheet.value = null;
        return;
    }
    if (shthght < 60) {
        sheetHeight.value = SNAP_POINTS.half;
    } else {
        sheetHeight.value = SNAP_POINTS.full;
    }
    activeSheet.value = null;
};

// Pull to Refresh Methods
const handleTouchStart = (e) => {
    if (scrollContainer.value && scrollContainer.value.scrollTop === 0 && !isRefreshing.value) {
        touchStartY.value = e.touches[0].clientY;
        isPulling.value = true;
        startRotationAnimation();
    }
};

const handleTouchMove = (e) => {
    if (!isPulling.value || isRefreshing.value) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.value;

    if (diff > 0 && scrollContainer.value && scrollContainer.value.scrollTop === 0) {
        e.preventDefault();

        let progress = Math.min(diff, PULL_THRESHOLD);

        if (progress > showProgressThreshold) {
            pullProgress.value = progress - showProgressThreshold;
        } else {
            pullProgress.value = 0;
        }

        if (pullProgress.value > 0) {
            const progressPercent = (pullProgress.value / (PULL_THRESHOLD - showProgressThreshold)) * 100;
            rotationAngle.value = (progressPercent / 100) * 360;
        } else {
            rotationAngle.value = 0;
        }
    }
};

const handleTouchEnd = async () => {
    if (!isPulling.value || isRefreshing.value) {
        isPulling.value = false;
        stopRotationAnimation();
        return;
    }

    isPulling.value = false;

    if (pullProgress.value >= (PULL_THRESHOLD - showProgressThreshold)) {
        await refreshData();
    } else {
        pullProgress.value = 0;
        rotationAngle.value = 0;
        stopRotationAnimation();
    }
};

const startRotationAnimation = () => {
    if (rotationInterval.value) {
        clearInterval(rotationInterval.value);
    }
};

const stopRotationAnimation = () => {
    if (rotationInterval.value) {
        clearInterval(rotationInterval.value);
        rotationInterval.value = null;
    }
};

const startRefreshingAnimation = () => {
    let angle = 0;
    rotationInterval.value = setInterval(() => {
        angle = (angle + 45) % 360;
        rotationAngle.value = angle;
    }, 100);
};

const refreshData = async () => {
    isRefreshing.value = true;
    startRefreshingAnimation();

    try {
        await Promise.all([
            fetchProductBaseCategories(),
            fetchShops()
        ]);

        setTimeout(() => {
            isRefreshing.value = false;
            pullProgress.value = 0;
            rotationAngle.value = 0;
            stopRotationAnimation();
        }, 1500);
    } catch (error) {
        console.error('Refresh failed:', error);

        setTimeout(() => {
            isRefreshing.value = false;
            pullProgress.value = 0;
            rotationAngle.value = 0;
            stopRotationAnimation();
        }, 1500);
    }
};

// Watchers
watch(searchBox, () => {
    selectedBaseCategory.value = searchBox.value;
});

// Lifecycle
onMounted(async () => {
    await checkAuthentication();

    if (!authCheckDone.value) {
        return; // Stop execution if not authenticated
    }

    await initializeLocationWithMovementTracking();

    startTimeTracking();

    setupDebouncedSearch();

    window.addEventListener('online', onOnline);

    await Promise.all([
        fetchProductBaseCategories(),
        fetchShops(),
    ]);

    scrollContainer.value = document.querySelector('.scroll-content');

    checkAndRestoreCooldown();
});

onBeforeUnmount(() => {
    locationStore.stopContinuousTracking();

    window.removeEventListener('online', onOnline);

    if (timeInterval.value) {
        clearInterval(timeInterval.value);
    }

    if (rotationInterval.value) {
        clearInterval(rotationInterval.value);
    }
});
</script>

<style scoped>
.v-container {
    padding: 0 !important;
}

/* Movement indicator base styles */
.movement-indicator {
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(50, 138, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 5px;
    z-index: 1000;
    backdrop-filter: blur(5px);
    font-weight: 500;
    transition: all 0.3s ease;
}

/* Speed-based background colors */
.movement-indicator.walking {
    background: rgba(76, 175, 80, 0.9);
}

.movement-indicator.biking {
    background: rgba(33, 150, 243, 0.9);
}

.movement-indicator.driving_slow {
    background: rgba(255, 152, 0, 0.9);
}

.movement-indicator.driving_fast {
    background: rgba(244, 67, 54, 0.9);
}

.movement-indicator.driving_fast .v-icon {
    filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
}

.movement-indicator.fast-speed {
    animation: movementPulse 1s infinite;
}

/* Speed icon animations */
.speed-icon-slow {
    animation: slowRotate 3s ease-in-out infinite;
}

.speed-icon-medium {
    animation: mediumPulse 1.5s ease-in-out infinite;
}

.speed-icon-fast {
    animation: fastShake 0.8s ease-in-out infinite;
}

.speed-icon-very-fast {
    animation: veryFastSpin 0.5s linear infinite;
}

/* Keyframe animations */
@keyframes slowRotate {
    0% {
        transform: rotate(0deg);
    }

    50% {
        transform: rotate(15deg);
    }

    100% {
        transform: rotate(0deg);
    }
}

@keyframes mediumPulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.1);
        opacity: 0.8;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes fastShake {

    0%,
    100% {
        transform: translateX(0) rotate(0deg);
    }

    25% {
        transform: translateX(-2px) rotate(-5deg);
    }

    75% {
        transform: translateX(2px) rotate(5deg);
    }
}

@keyframes veryFastSpin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes movementPulse {
    0% {
        opacity: 0.7;
        transform: scale(1);
    }

    50% {
        opacity: 1;
        transform: scale(1.02);
    }

    100% {
        opacity: 0.7;
        transform: scale(1);
    }
}

/* For mobile devices */
@media (max-width: 600px) {
    .movement-indicator {
        top: 5px;
        right: 5px;
        padding: 6px 10px;
        font-size: 11px;
    }

    .movement-indicator .v-icon {
        font-size: 16px !important;
    }
}

.clickable-cat {
    cursor: pointer;
    transition: transform 0.2s ease;
}

.clickable-cat:hover {
    transform: scale(1.05);
}

.clickable-cat:active {
    transform: scale(0.95);
}

/* Dialog Overlay */
.customer-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 999;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 80px 20px 20px 20px;
    z-index: 9999;
}

.customer-dialog {
    position: fixed;
    left: 10px;
    top: 70px;
    animation: slideInLeft 0.3s ease;
}

.dialog-bubble {
    position: relative;
    background: white;
    border-radius: 20px;
    padding: 16px 20px;
    max-width: 320px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    border: 2px solid #f5d5a4;
    margin-bottom: 15px;
}

.close-btn {
    position: absolute;
    top: 0;
    right: 0;
    background: none;
    border: none;
    box-shadow: none;
    font-size: 18px;
    cursor: pointer;
    color: #999;
    transition: color 0.2s;
}

.close-btn:hover {
    color: #333;
}

.bubble-text {
    font-size: 14px;
    line-height: 1.6;
    color: #2d2f36;
    padding-right: 20px;
}

/* Pointer pointing to the top-left (towards the tapped image) */
.bubble-pointer {
    position: absolute;
    top: -12px;
    left: 20px;
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid white;
}

.dialog-bubble::before {
    content: '';
    position: absolute;
    top: -14px;
    left: 18px;
    width: 0;
    height: 0;
    border-left: 14px solid transparent;
    border-right: 14px solid transparent;
    border-bottom: 14px solid #f5d5a4;
    z-index: 0;
}

.cat-avatar {
    display: flex;
    justify-content: flex-start;
    padding-left: 10px;
    cursor: pointer;
    transition: transform 0.2s;
}

.cat-avatar:hover {
    transform: scale(1.05);
}

@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(50px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@media (min-width: 960px) {
    .customer-dialog-overlay {
        display: none;
    }
}


/* For mobile */
@media (max-width: 600px) {
    .customer-dialog-overlay {
        padding: 60px 15px 15px 15px;
    }

    .dialog-bubble {
        max-width: 300px;
        padding: 14px 16px;
    }

    .bubble-text {
        font-size: 13px;
    }
}

.scroll-content {
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px;
}

/* Pull to Refresh Progress Styles */
.refresh-progress {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60px;
    transition: transform 0.2s ease-out, opacity 0.2s ease-out;
    pointer-events: none;
}

.progress-content {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
}

.pull-icon {
    display: inline-flex;
    transition: transform 0.1s linear;
}

.pull-icon.rotating {
    animation: rotateIcon 0.8s linear infinite;
}

@keyframes rotateIcon {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.headline {
    background: linear-gradient(150deg, #ffa600 0%, #5c3a21 100%);
    width: 100%;
    padding: 5px;
    line-height: 0.6cm;
    margin-bottom: 16px;
    border-radius: 10px;
}

.headline h6 {
    margin-top: 0 !important;
    color: #dfdfdf;
    font-weight: 500;
}

.headline h4 {
    color: #fff;
    font-size: 15px;
    font-weight: 500;
}

.headline h3 {
    color: #fff;
    text-align: center;
}

.headline p {
    font-weight: 500;
    font-size: 12px;
    font-style: italic;
    text-align: center;
    color: #adadad;
    /* text-grey */
}

.search-box {
    position: relative;
    border-radius: 10px;
    box-shadow: none !important;
    height: 52px;
    padding-left: 10px;
    margin-bottom: 16px;
    /* mb-5 */
    z-index: 100;
}

.search-box .v-icon {
    margin-right: 5px;
}

:deep(.v-field.v-field--focused .v-field__outline),
:deep(.v-input.v-input--error .v-field__outline) {
    --v-field-border-opacity: 0 !important;
    opacity: 0 !important;
}

:deep(.v-field__outline) {
    --v-field-border-opacity: 0 !important;
}

:deep(.v-field) {
    box-shadow: none !important;
}

.suggestions-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 999;
    max-height: 300px;
    overflow-y: auto;
    background-color: #fff !important;
    border-radius: 10px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.suggestions-dropdown .v-list {
    background-color: #fff !important;
    border-radius: 10px !important;
}

.suggestions-dropdown .v-list .v-icon {
    /* text-grey-darken-1 */
    color: #8a8a8a;
    margin: 0 10px;
}

:deep(.v-card) {
    overflow: visible !important;
}

.suggestions-dropdown .v-list-item {
    cursor: pointer;
}

.v-list-item-title {
    font-size: 13px !important;
    font-weight: normal !important;
    padding: 0 !important;
}

.suggestions-dropdown .v-list-item:hover {
    color: #5c3a21;
    background-color: #fff8e8;
}

:deep(.v-skeleton-loader__button) {
    height: 55px !important;
    max-width: none !important;
}

.custom-bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 30px 30px 0 0;
    box-shadow: none;
    z-index: 1000;
    transition: height 0.1s linear !important;
    /* Faster transition */
    touch-action: none;
    /* Prevents page scroll while dragging */
    overflow: hidden;
}

.badge-dot {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 10px;
    height: 10px;
    background: #007233;
    border-radius: 50%;
    animation: blink 1.5s infinite;
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

.sheet-content {
    height: calc(100% - 20px);
    box-shadow: none !important;
}

.sheet-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: transform 0.2s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.buttons-container {
    border-radius: 10px;
    margin-bottom: 16px;
    padding: 20px;
}

.sheet-buttons-container {
    box-shadow: none !important;
    border-radius: 30px 30px 0 0 !important;
    position: fixed;
    bottom: 0 !important;
    width: 100% !important;
    transition: height 0.25s ease-in-out !important;
    touch-action: none !important;
    overflow: hidden;
}

.buttons-container {
    box-shadow: none !important;
    position: relative;
    overflow: hidden;
}

.sheet-buttons-container .v-container,
.sheet-content .v-container {
    height: 100%;
    overflow-y: scroll !important;
    padding: 14px 14px 80px 14px !important;
}

.buttons-container .title-skeleton {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
}

.buttons-container h4,
.sheet-buttons-container h4,
.sheet-content h4 {
    line-height: 0.5cm;
    text-align: center;
    margin-bottom: 25px;
    color: #5c3a21;
}

.buttons-container h4 span,
.sheet-buttons-container h4 span,
.sheet-content h4 span {
    font-weight: 500;
    font-size: 13px;
    color: #adadad;
    font-style: italic;
}

.buttons-container .button,
.sheet-buttons-container .button,
.sheet-content .button {
    box-shadow: none;
    border-radius: 10px;
    width: 100%;
    height: 85px;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    background-color: #fcf0e0;
    overflow: hidden;
}

.buttons-container .button-item,
.sheet-buttons-container .button-item,
.sheet-content .button-item {
    display: flex;
    align-items: center;
    flex-direction: column;
}

.buttons-container .button .button-text,
.sheet-buttons-container .button-text,
.sheet-content .button-text {
    margin-top: 5px;
    font-weight: 600;
    font-size: 10px;
    display: block;
    line-height: 1.3;
    margin-top: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.new-product-btn {
    background-image:
        linear-gradient(to right, #c4926c, rgba(0, 0, 0, 0.2)),
        url('@/assets/img/jpg/features/new-product-bg.jpeg');
    background-size: cover, cover;
    background-position: center, center;
    background-repeat: no-repeat, no-repeat;
    height: 110px;
}

.open-shop-btn {
    background-image:
        linear-gradient(to right, #c4926c, rgba(0, 0, 0, 0.2)),
        url('@/assets/img/jpg/features/cashier.jpeg');
    background-size: cover, cover;
    background-position: center, center;
    background-repeat: no-repeat, no-repeat;
}

.open-shop-btn,
.new-product-btn {
    box-shadow: none;
    font-size: 15px;
    width: 100%;
    line-height: 0.4cm;
    border-radius: 10px;
    margin-bottom: 16px;
    text-align: left;
    height: 110px;
    overflow: hidden;
}

.open-shop-btn span,
.new-product-btn span {
    font-weight: 600;
}

.open-shop-btn span,
.open-shop-btn .v-icon,
.new-product-btn span,
.new-product-btn .v-icon,
.surprise-btn,
.order-now-btn {
    color: #fff;
}

.surprise-btn {
    box-shadow: none;
    background-color: #5c3a21;
    font-size: 15px;
    width: 100%;
    line-height: 0.5cm;
    border-radius: 10px;
    font-weight: 500;
    height: 110px;
}

.surprise-btn-cooldown {
    background-color: #8a8a8a !important;
    cursor: not-allowed;
    position: relative;
    overflow: hidden;
}

.surprise-btn-cooldown::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #5c3a215e;
    animation: decreaseFromRight 60s linear forwards;
    pointer-events: none;
}

@keyframes decreaseFromRight {
    0% {
        width: 100%;
    }

    100% {
        width: 0%;
    }
}

/* Loading animation */
.surprise-btn-loading {
    background-color: #7a4a2a !important;
    cursor: wait;
    animation: surpriseBtnPulse 1.5s ease-in-out infinite;
}

@keyframes surpriseBtnPulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.6;
    }
}

.cooldown-icon {
    filter: grayscale(0.3);
    opacity: 0.6;
}

.surprise-btn:disabled {
    opacity: 0.8;
    cursor: not-allowed;
}

.order-now-btn {
    height: 45px;
    margin-top: 16px;
    background-color: #5c3a21;
    box-shadow: none !important;
    border-radius: 30px;
}

.subtitle {
    font-size: 12px;
    font-style: italic;
    color: #d7d7d7 !important;
}

.drag-handle {
    width: 60px;
    height: 5px;
    background: #adadad;
    border-radius: 10px;
    margin: 10px auto;
}

:deep(svg) {
    color: #747474;
}

.content-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.flex-center-column {
    display: flex;
    align-items: center;
    flex-direction: column;
}

.display-column {
    display: flex;
    flex-direction: column;
}

.no-background {
    background: none;
}

.no-found {
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: none !important;
    padding: 40px 20px 40px 20px;
}

.no-found p {
    color: #ab2323;
}

/* Custom scrollbar styling */
.scroll-content::-webkit-scrollbar {
    width: 6px;
}

.scroll-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.scroll-content::-webkit-scrollbar-thumb {
    background: #ce8600;
    border-radius: 3px;
}

.scroll-content::-webkit-scrollbar-thumb:hover {
    background: #5c3a21;
}
</style>