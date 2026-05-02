<template>
    <v-container>

        <!-- Pull to Refresh Progress Indicator -->
        <div class="refresh-progress" :style="{
            transform: `translateY(${pullProgress}px)`,
            opacity: pullProgress > 0 ? 1 : 0
        }">
            <div class="progress-content">
                <div class="pull-icon" :class="{ 'rotating': isRefreshing || pullProgress >= 100 }">
                    <v-icon :color="pullProgress >= 100 ? '#ff893a' : '#3352ff'" :size="28"
                        :style="{ transform: `rotate(${rotationAngle}deg)` }"
                        style="background-color: #5c3a21; border-radius: 50%; padding: 20px;">
                        mdi-loading
                    </v-icon>
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
                            style="border: 1px solid #6cff00; font-size: 10px;" color="#6cff00" class="pl-1 pr-3"
                            size="small" variant="outline">
                            <v-icon style="font-size: 13px !important;">mdi-map-marker</v-icon>
                            Enable Location
                        </v-chip>
                    </div>
                </div>
            </div>

            <!-- Show driving warning based on speed -->
            <v-alert v-if="locationStore.isMoving && locationStore.movementSpeed > 10"
                :type="getSpeedAlertType"
                variant="outlined"
                density="compact"
                class="mb-5">
                {{ getSpeedWarningMessage }}
            </v-alert>

            <!-- <div class="headline">
                <h3>Taste the best dishes in Sagay</h3>
                <p>Tilawi ang manamit nga mga pagkaon sa Sagay</p>
            </div> -->

            <div v-if="krisantaDialog" :class="sleepingKrisantaImage ? 'd-none' : 'customer-dialog-overlay'" @click="closeKrisantaDialog">
                <div class="customer-dialog" @click.stop>
                    <div class="dialog-bubble">
                        <v-btn class="close-btn" @click="closeKrisantaDialog" size="small" elivation="0" icon>
                            <v-icon style="font-size: 14px !important;">mdi-close</v-icon>
                        </v-btn>
                        <div class="bubble-text">
                            Meow! 🐾 My name is <strong>Krisanta</strong>, isa ko ka stray cat. Soon, pwede taka ma-guide sa pag explore
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
            <v-card class="search-box">
                <v-text-field v-model="searchBox" placeholder="Search food, drinks or stores..."
                    @keyup.enter="handleSearchBox" @keydown="handleKeyDown" @input="handleSearchInput"
                    :loading="searching">
                    <template v-slot:prepend-inner>
                        <v-icon size="small">mdi-magnify</v-icon>
                    </template>
                    <template v-slot:append-inner>
                        <v-icon v-if="searchBox" @click="clearSearch" class="mr-2" size="small">
                            mdi-close-circle
                        </v-icon>
                    </template>
                </v-text-field>
                <v-card v-if="searchSuggestions.length && searchBox?.length >= 2" class="suggestions-dropdown"
                    elevation="2">
                    <v-list>
                        <v-list-item v-for="(suggestion, index) in searchSuggestions"
                            :key="suggestion.type + (suggestion.value || index)" @click="selectSuggestion(suggestion)"
                            :class="{ 'v-list-item--active': index === selectedSuggestionIndex }"
                            :style="index === selectedSuggestionIndex ? 'background-color: #f5f5f5;' : ''">
                            <v-list-item-title>
                                <v-icon>
                                    {{ suggestion.type === 'category' ? 'mdi-magnify' : 'mdi-store' }}
                                </v-icon>
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
            <v-btn @click="this.$router.push('new-products')" class="new-product-btn content-between">
                <span class="text-wrap">
                    Check these new products<br />
                    <span class="subtitle">Lantawa mga bag-o nga produkto</span>
                </span>
                <template v-slot:append>
                    <v-icon>mdi-arrow-right</v-icon>
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
                                    <v-img :src="storeImage" width="35" class="mr-2 flex-shrink-0"></v-img>
                                    <div class="d-flex flex-column flex-grow-1 text-start overflow-hidden">
                                        <span class="text-wrap mr-15">
                                            {{ shop.name }}
                                        </span>
                                        <span class="text-grey-darken-1">
                                            {{ shop.type }}
                                        </span>
                                    </div>
                                    <div :class="!shop.lowest_price ? 'd-none' : 'd-flex align-center flex-column'"
                                        style="position: absolute; right: 10px;">
                                        <span class="text-grey-darken-1" style="font-size:10px">
                                            Starting @
                                        </span>
                                        <span style="font-size:18px">
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
            <v-btn @click="this.$router.push('shop-list')" class="open-shop-btn content-between">
                <span class="text-wrap">
                    These stores are open now <br />
                    <span class="subtitle">Mga baligyaan nga abri subong</span>
                </span>
                <template v-slot:append>
                    <v-icon>mdi-arrow-right</v-icon>
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
                        <v-btn @click="this.$router.push('new-products')" class="new-product-btn content-between">
                            <span>
                                Check these new products<br />
                                <span class="subtitle">Lantawa mga bag-o nga produkto</span>
                            </span>
                            <template v-slot:append>
                                <v-icon>mdi-arrow-right</v-icon>
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
                                <p style="color: #5c3a21; font-size: 16px; margin-bottom: 20px;" class="mt-3">{{
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
                                <v-img :src="productImages[surpriseImage] || moreImage" width="130"></v-img>
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

<script>
import { useAuthStore } from '@/stores/auth';
import { useLocationStore } from '@/stores/locationStore';
import { useRouter } from 'vue-router';
import { useShopStore } from '@/stores/shopStore';
import { useProductsStore } from '@/stores/productsStore';
import confetti from 'canvas-confetti';
import { useToast } from 'vue-toastification'

export default {
    name: 'HomePage',
    data() {
        return {
            authCheckDone: false,
            isOnline: navigator.onLine,
            krisantaDialog: false,
            searchBox: null,
            searchTimeout: null,
            searching: false,
            debouncedSearch: null,
            selectedSuggestionIndex: -1,
            selectedBaseCategory: null,
            itemsPerPage: 20,
            moreSheet: false,
            sheetHeight: 60,
            startY: 0,
            startHeight: 60,
            SNAP_POINTS: {
                half: 60,
                full: 95,
            },
            activeSheet: null,
            surpriseSheet: false,
            surpriseImage: null,
            surpriseProduct: null,
            surpriseProductId: null,
            surpriseShopName: null,
            surpriseShopId: null,
            surpriseShopBranchId: null,
            surpriseShopType: null,
            surpriseShopAddress: null,
            surpriseOpenAt: null,
            surpriseCloseAt: null,
            surprising: false,
            loadingSurpriseMessages: [
                "🎉 Ginahanda na ang imo sorpresa...",
                "🎉 May ara kami sorpresa nga namit...",
                "🎉 Kadali lang gid, ari na imo sorpresa..."
            ],
            currentTimeImage: require('@/assets/img/png/food/Current Time.png'),
            moreImage: require('@/assets/img/png/food/Cutlery.png'),
            storeImage: require('@/assets/img/png/food/Store.png'),
            openboxImage: require('@/assets/img/png/box/Open Box.png'),
            nostoreImage: require('@/assets/img/png/food/No Store.png'),
            nofastfoodImage: require('@/assets/img/png/food/No Fast Food.png'),
            happyKrisantaImage: require('@/assets/img/png/krisanta/Happy Krisanta.png'),
            tiredKrisantaImage: require('@/assets/img/png/krisanta/Tired Krisanta.png'),
            sleepingKrisantaImage: require('@/assets/img/png/krisanta/Sleeping Krisanta.png'),
            currentHour: new Date().getHours(),
            currentMinute: new Date().getMinutes(),
            timeInterval: null,
            // Pull to refresh properties
            isRefreshing: false,
            pullProgress: 0,
            scrollContainer: null,
            touchStartY: 0,
            isPulling: false,
            PULL_THRESHOLD: 200,
            showProgressThreshold: 100,
            rotationAngle: 0,
            rotationInterval: null,
            surpriseCooldown: false,
            surpriseCooldownInterval: null,
            surpriseCooldownEndTime: null,
        }
    },

    components: {
        // 
    },

    setup() {
        const authStore = useAuthStore();
        const locationStore = useLocationStore();
        const shopStore = useShopStore();
        const productsStore = useProductsStore();
        const toast = useToast();
        const router = useRouter();

        return {
            authStore,
            locationStore,
            shopStore,
            productsStore,
            toast,
            router
        };
    },

    async mounted() {
        await this.checkAuthentication();

        if (!this.authCheckDone) {
            return; // Stop execution if not authenticated
        }

        await this.initializeLocationWithMovementTracking();

        this.startTimeTracking();

        this.setupDebouncedSearch();

        window.addEventListener('online', this.onOnline);

        await Promise.all([
            this.fetchProductBaseCategories(),
            this.fetchShops(),
        ]);

        this.scrollContainer = this.$refs.scrollContainer;

        this.checkAndRestoreCooldown();

    },

    beforeUnmount() {
        this.locationStore.stopContinuousTracking();

        window.removeEventListener('online', this.onOnline);

        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }

        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
    },

    computed: {

        getSpeedometerIcon() {
            const speed = this.locationStore.movementSpeed;
            
            if (speed < 5) {
                return 'mdi-speedometer-slow'; // Walking or very slow
            } else if (speed < 30) {
                return 'mdi-speedometer-medium'; // Normal driving speed
            } else {
                return 'mdi-speedometer'; // Fast driving
            }
        },
        
        // Additional class for animation intensity
        getSpeedometerIconClass() {
            const speed = this.locationStore.movementSpeed;
            
            return {
                'speed-icon-slow': speed < 5,
                'speed-icon-medium': speed >= 5 && speed < 30,
                'speed-icon-fast': speed >= 30,
                'speed-icon-very-fast': speed >= 60
            };
        },
        
        // Alert type based on speed
        getSpeedAlertType() {
            const speed = this.locationStore.movementSpeed;
            
            if (speed >= 60) {
                return 'error';
            } else if (speed >= 40) {
                return 'warning';
            } else {
                return 'info';
            }
        },
        
        // Warning message based on speed
        getSpeedWarningMessage() {
            const speed = this.locationStore.movementSpeed;
            
            if (speed >= 80) {
                return '⚠️ High speed detected! Please drive safely and don\'t use the app while driving!';
            } else if (speed >= 60) {
                return '🚗 You\'re driving quite fast. Please focus on the road!';
            } else if (speed >= 40) {
                return '🚙 Driving detected. Please be safe on the road!';
            } else {
                return '🚶 Moving detected. Stay safe!';
            }
        },

        allCategories() {
            return this.productsStore.getBaseCategories.slice(10);
        },

        sortedCategories() {
            const others = this.allCategories.find(c => c.label === 'Other');
            const rest = this.allCategories.filter(c => c.label !== 'Other');
            return others ? [...rest, others] : rest;
        },

        limitedCategories() {
            return this.productsStore.getBaseCategories.slice(0, 10);
        },

        limitedStores() {
            return this.shopStore.getShops.slice(0, 20);
        },

        availableCategoriesLower() {
            return this.productsStore.getBaseCategories.map(category => ({
                ...category,
                labelLower: category.label.toLowerCase()
            }));
        },

        searchSuggestions() {
            if (!this.searchBox || this.searchBox.length < 2) return [];

            const searchLower = this.searchBox.toLowerCase();
            const suggestions = [];

            if (this.productsStore.getBaseCategories && Array.isArray(this.productsStore.getBaseCategories)) {
                const categorySuggestions = this.productsStore.getBaseCategories
                    .filter(category => category && category.label && category.label.toLowerCase().includes(searchLower))
                    .map(category => ({
                        type: 'category',
                        label: category.label,
                        value: category.label
                    }));
                suggestions.push(...categorySuggestions);
            }

            const shopsArray = this.shopStore.getShops;

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
        },

        productImages() {
            const images = require.context('@/assets/img/png/food', false, /\.png$/)
            const map = {}
            images.keys().forEach(fileName => {

                const cleanName = fileName
                    .replace('./', '')
                    .replace('.png', '')
                map[cleanName] = images(fileName)
            })
            return map
        },

        currentDayGreeting() {
            const hour = this.currentHour;

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
        },

        currentKrisantaImage() {
            const hour = this.currentHour;

            if (hour === 22 || hour === 23) {        // 10 PM - 11:59 PM
                return this.tiredKrisantaImage;
            } 
            else if (hour >= 0 && hour <= 5) {       // 12:00 AM - 6:00 AM (0, 1, 2, 3, 4, 5, 6)
                return this.sleepingKrisantaImage;
            } 
            else {
                return this.happyKrisantaImage;      // All other times
            }
        },

        currentTimeMeal() {
            const hour = this.currentHour;

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

            // else if (hour >= 23 || hour < 0) {
            //     return 'Midnight Snacks';
            // }

            else {
                return 'Not meal time';
            }
        },

        baseCategoriesForCurrentMeal() {
            if (!this.currentTimeMeal) return [];

            const categories = this.productsStore.getBaseCategories;

            if (!categories || categories.length === 0) return [];

            return categories.filter(category => {
                if (!category.meal_type) return false;

                let mealTypes = category.meal_type;
                if (typeof mealTypes === 'string') {
                    try {
                        mealTypes = JSON.parse(mealTypes);
                    } catch (e) {
                        mealTypes = [mealTypes];
                    }
                }

                return Array.isArray(mealTypes) && mealTypes.includes(this.currentTimeMeal);
            });
        },
    },

    watch: {
        searchBox() {
            this.selectedBaseCategory = this.searchBox;
        },
    },

    methods: {

        async checkAuthentication() {
            if (!this.authStore.token) {
                this.authStore.clearAuth();
                this.$router.replace('/');
                return false;
            }

            this.authCheckDone = true;
            return true;
        },

        async initializeLocationWithMovementTracking() {
            try {
                const trackingPreference = localStorage.getItem('location_tracking_preference');
                
                if (trackingPreference === 'always') {
                    await this.locationStore.startContinuousTracking({
                        highAccuracy: true,
                        adaptiveInterval: true
                    });
                } else {
                    await this.locationStore.getCurrentLocation({ force: false });
                }
            } catch (error) {
                console.error('Location initialization failed:', error);
            }
        },
        
        async requestLocation() {
            try {
                const wantTracking = confirm('Do you want to keep tracking your location while moving? This will help provide better recommendations.');
                
                if (wantTracking) {
                    localStorage.setItem('location_tracking_preference', 'always');
                    await this.locationStore.startContinuousTracking({
                        highAccuracy: true,
                        adaptiveInterval: true
                    });
                } else {
                    localStorage.setItem('location_tracking_preference', 'once');
                    await this.locationStore.getCurrentLocation({ force: true });
                }
                
                this.toast.success('Location enabled successfully!');
            } catch (error) {
                this.toast.error('Unable to get location. Please enable location permissions.');
            }
        },

        onOnline() {
            this.isOnline = true;
            this.toast.info('Internet connection restored');
        },

        showKrisantaDialog() {
            this.krisantaDialog = true;
        },

        closeKrisantaDialog() {
            this.krisantaDialog = false;
        },

        async fetchShops() {
            if (this.shouldSkipFetch(null)) return;

            try {
                const request = this.buildShopRequest(null);
                await this.shopStore.fetchShopListStore(request);
            } catch (error) {
                console.error('Error fetching stores:', error);
            }
        },

        async fetchProductBaseCategories() {
            if (this.productsStore.base_categories && this.productsStore.base_categories.length > 0) {
                return;
            }
            try {
                await this.productsStore.fetchBaseCategoriesStore();
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        },

        sanitizeSearchTerm(term) {
            if (!term) return '';
            return term.trim()
                .replace(/[^\w\s]/gi, '')
                .replace(/\s+/g, ' ')
                .toLowerCase();
        },

        handleSearchInput() {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            this.searchTimeout = setTimeout(() => {
                if (this.searchBox && this.searchBox.length >= 2) {
                    const suggestions = this.searchSuggestions;
                    if (suggestions.length > 0) {
                        console.log('Suggestions:', suggestions);
                    }
                }
            }, 300);
        },

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        setupDebouncedSearch() {
            this.debouncedSearch = this.debounce(() => {
                if (this.searchBox && this.searchBox.trim()) {
                    this.handleSearchBox();
                }
            }, 500);
        },

        async handleStoreSearch(suggestion) {
            if (!suggestion || !suggestion.value) {
                this.toast.error('Invalid store selection');
                return;
            }

            this.searching = true;
            try {
                const shopsArray = this.shopStore.getShops;

                if (!shopsArray || !Array.isArray(shopsArray)) {
                    this.toast.error('Store data not available');
                    return;
                }

                const shop = shopsArray.find(s => s && s.id === suggestion.value);

                if (shop) {
                    await this.$nextTick();
                    this.$router.push({
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
                    this.toast.error('Store not found');

                }
            } catch (error) {
                console.error("Error navigating to store:", error);
                this.toast.error('An error occurred while searching for the store');
            } finally {
                this.searching = false;
            }
        },

        async handleSearchBox() {
            if (!this.searchBox || !this.searchBox.trim()) {
                this.toast.error('Please enter text on the search box');
                return;
            }

            this.searching = true;

            const rawSearchTerm = this.searchBox.trim();
            const sanitizedTerm = this.sanitizeSearchTerm(rawSearchTerm);

            if (!sanitizedTerm) {
                this.toast.error('Please enter a valid text on the search box');
                this.searching = false;
                return;
            }

            try {
                // First, check for exact category matches
                let exactCategoryMatch = null;
                if (this.productsStore.getBaseCategories && Array.isArray(this.productsStore.getBaseCategories)) {
                    exactCategoryMatch = this.productsStore.getBaseCategories.find(
                        category => category && category.label &&
                            category.label.toLowerCase() === sanitizedTerm
                    );
                }

                // If there's an exact category match, go to category view
                if (exactCategoryMatch) {
                    await this.$nextTick();
                    this.$router.push({
                        path: '/shop-where-to-buy/',
                        query: {
                            baseCategory: exactCategoryMatch.label
                        }
                    });
                    this.searching = false;
                    return;
                }

                // If no exact category match, then check for store matches
                const shopsArray = this.shopStore.getShops;
                let matchingStore = null;
                if (shopsArray && Array.isArray(shopsArray)) {
                    matchingStore = shopsArray.find(shop => {
                        if (!shop) return false;
                        const shopName = (shop.name || '').toLowerCase();
                        return shopName === sanitizedTerm || shopName.includes(sanitizedTerm);
                    });
                }

                if (matchingStore) {
                    this.$router.push({
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
                    this.searching = false;
                    return;
                }

                // Finally, check for partial category matches
                let partialCategoryMatch = null;
                if (this.productsStore.getBaseCategories && Array.isArray(this.productsStore.getBaseCategories)) {
                    partialCategoryMatch = this.productsStore.getBaseCategories.find(
                        category => category && category.label &&
                            category.label.toLowerCase().includes(sanitizedTerm)
                    );
                }

                // If no matches at all, search with the raw term
                await this.$nextTick();
                this.$router.push({
                    path: '/shop-where-to-buy/',
                    query: {
                        ...(partialCategoryMatch ? { baseCategory: partialCategoryMatch.label } : { baseCategory: rawSearchTerm })
                    }
                });
            } catch (error) {
                console.error("Error in search filtering:", error);
                this.toast.error('An error occurred while searching. Please try again!');
            } finally {
                this.searching = false;
            }
        },

        async handleCategorySearch(suggestion) {
            if (!suggestion || !suggestion.label) {
                this.toast.error('Invalid category selection');
                return;
            }

            this.searching = true;
            try {
                await this.$nextTick();
                this.$router.push({
                    path: '/shop-where-to-buy/',
                    query: {
                        baseCategory: suggestion.label
                    }
                });
            } catch (error) {
                console.error("Error navigating to category:", error);
                this.toast.error('An error occurred while searching for the category');
            } finally {
                this.searching = false;
            }
        },

        highlightMatch(suggestion, searchTerm) {
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
        },

        getMatchingCategory(searchTerm) {
            if (!searchTerm) return null;

            const searchLower = searchTerm.toLowerCase().trim();
            return this.productsStore.getBaseCategories.find(
                category => category.label.toLowerCase() === searchLower
            );
        },

        selectSuggestion(suggestion) {
            this.searchBox = suggestion.label;
            if (suggestion.type === 'category') {
                this.handleCategorySearch(suggestion);
            } else if (suggestion.type === 'store') {
                this.handleStoreSearch(suggestion);
            }
            this.selectedSuggestionIndex = -1;
        },

        handleKeyDown(event) {
            if (!this.searchSuggestions.length) return;

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                this.selectedSuggestionIndex =
                    (this.selectedSuggestionIndex + 1) % this.searchSuggestions.length;
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                this.selectedSuggestionIndex =
                    this.selectedSuggestionIndex <= 0
                        ? this.searchSuggestions.length - 1
                        : this.selectedSuggestionIndex - 1;
            } else if (event.key === 'Enter' && this.selectedSuggestionIndex >= 0) {
                event.preventDefault();
                const suggestion = this.searchSuggestions[this.selectedSuggestionIndex];
                this.selectSuggestion(suggestion);
                this.selectedSuggestionIndex = -1;
            }
        },

        async handleCategorySelect(category) {
            if (!category || !category.label) {
                this.toast.error('Invalid category selected');
                return;
            }

            const categoryExists = this.productsStore.getBaseCategories.some(
                cat => cat.label === category.label
            );

            if (!categoryExists) {
                this.toast.error('Selected category is not available');
                return;
            }

            try {
                await this.$nextTick();
                this.selectedBaseCategory = category.label;
                this.searchBox = '';

                this.$router.push({
                    path: '/shop-where-to-buy/',
                    query: {
                        baseCategory: category.label,
                    }
                });
            } catch (error) {
                console.error('Error navigating to category:', error);
                this.toast.error('Error loading product category');
            }
        },

        async handleMealType() {
            if (!this.currentTimeMeal) {
                this.toast.error('No current meal type');
                return;
            }

            try {
                await this.$nextTick();

                this.$router.push({
                    path: '/meal/',
                    query: {
                        mealType: this.currentTimeMeal
                    }
                });

            } catch (error) {
                console.error('Error navigating to meal type:', error);
                this.toast.error('Error loading meal type products');
            }
        },

        toShop(shop) {
            this.$router.push({
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
        },

        orderNow() {
            this.toast.warning('Ordering feature is unavailable.');
            setTimeout(() => {
                this.toast.warning('Redirecting to shop page');
                setTimeout(() => {
                    this.$router.push({
                        path: '/shop/',
                        query: {
                            shopId: this.surpriseShopId,
                            branchId: this.surpriseShopBranchId,
                            shopName: this.surpriseShopName,
                            shopType: this.surpriseShopType,
                            shopAddress: this.surpriseShopAddress,
                            openAt: this.surpriseOpenAt,
                            closeAt: this.surpriseCloseAt,
                            requestedCategory: this.surpriseImage,
                        }
                    })
                }, 1000);
            }, 3000);
        },

        clearSearch() {
            this.searchBox = null;
            this.selectedBaseCategory = null;
        },

        startTimeTracking() {
            this.updateTime();
            this.timeInterval = setInterval(this.updateTime, 60000);
        },

        updateTime() {
            const now = new Date();
            this.currentHour = now.getHours();
            this.currentMinute = now.getMinutes();
        },

        buildShopRequest(timeBetween = null) {
            return {
                requested_category: null,
                requested_meal_type: null,
                requested_time_between: timeBetween,
                items_per_page: this.itemsPerPage,
            };
        },

        shouldSkipFetch(timeBetween = null) {
            const store = this.shopStore;

            return (
                store.lastCategory === null &&
                store.lastMealType === null &&
                store.lastTimeBetween === timeBetween &&
                store.shop_list.length > 0
            );
        },

        onSurpriseSheetClosed() {
            this.activeSheet = null;
            this.sheetHeight = this.SNAP_POINTS.half;
            // Reset surprise data when closed
            this.surprising = false;
            this.surpriseImage = null;
            this.surpriseProduct = null;
            this.surpriseProductId = null;
            this.surpriseShopId = null;
            this.surpriseShopName = null;
            this.surpriseShopBranchId = null;
            this.surpriseShopType = null;
            this.surpriseShopAddress = null;
            this.surpriseOpenAt = null;
            this.surpriseCloseAt = null;
        },

        startSurpriseCooldown() {
            this.surpriseCooldown = true;
            this.surpriseCooldownEndTime = Date.now() + 60000;

            // Save to localStorage
            localStorage.setItem('surpriseCooldownEndTime', this.surpriseCooldownEndTime);

            this.updateCooldownProgress();

            this.surpriseCooldownInterval = setInterval(() => {
                this.updateCooldownProgress();
            }, 100);
        },

        updateCooldownProgress() {
            if (!this.surpriseCooldownEndTime) return;

            const now = Date.now();
            const remaining = this.surpriseCooldownEndTime - now;

            if (remaining <= 0) {
                this.stopSurpriseCooldown();
            } else {
                // Calculate progress percentage
                const progress = (remaining / 60000) * 100;
                // Update CSS variable for animation
                const sheetEl = this.$el?.querySelector('.surprise-btn-cooldown');
                if (sheetEl) {
                    sheetEl.style.setProperty('--cooldown-progress', `${progress}%`);
                }
            }
        },

        stopSurpriseCooldown() {
            this.surpriseCooldown = false;
            this.surpriseCooldownEndTime = null;

            // Remove from localStorage
            localStorage.removeItem('surpriseCooldownEndTime');

            if (this.surpriseCooldownInterval) {
                clearInterval(this.surpriseCooldownInterval);
                this.surpriseCooldownInterval = null;
            }

            // Reset CSS variable
            const sheetEl = this.$el?.querySelector('.surprise-btn-cooldown');
            if (sheetEl) {
                sheetEl.style.removeProperty('--cooldown-progress');
            }
        },

        checkAndRestoreCooldown() {
            // Check localStorage for saved cooldown
            const savedEndTime = localStorage.getItem('surpriseCooldownEndTime');
            if (savedEndTime) {
                this.surpriseCooldownEndTime = parseInt(savedEndTime);
            }

            if (this.surpriseCooldownEndTime) {
                const now = Date.now();
                const remaining = this.surpriseCooldownEndTime - now;

                if (remaining > 0) {
                    // Cooldown is still active, restore it
                    this.surpriseCooldown = true;

                    // Update the animation progress immediately
                    this.$nextTick(() => {
                        const progress = (remaining / 60000) * 100;
                        const sheetEl = this.$el?.querySelector('.surprise-btn-cooldown');
                        if (sheetEl) {
                            sheetEl.style.setProperty('--cooldown-progress', `${progress}%`);
                        }
                    });

                    // Restart the interval
                    if (this.surpriseCooldownInterval) {
                        clearInterval(this.surpriseCooldownInterval);
                    }

                    this.surpriseCooldownInterval = setInterval(() => {
                        this.updateCooldownProgress();
                    }, 100);
                } else {
                    // Cooldown expired
                    this.stopSurpriseCooldown();
                }
            }
        },

        async openSurpriseSheet() {

            if (this.surpriseCooldown) {
                const remainingSeconds = Math.ceil((this.surpriseCooldownEndTime - Date.now()) / 1000);
                this.toast.warning(`Please wait ${remainingSeconds} seconds before trying again.`);
                return;
            }

            const time = `${this.currentHour}:${this.currentMinute}`;

            this.sheetHeight = 60;
            this.surprising = true;
            this.surpriseSheet = true;

            try {
                const request = this.buildShopRequest(time);

                await this.shopStore.fetchShopListStore(request, true);

                setTimeout(() => {
                    if (this.currentTimeMeal === 'Not meal time') {
                        this.surprising = false;
                        this.surpriseSheet = false;
                        this.sheetHeight = 60;
                    } else {
                        const shops = this.shopStore.getSurpriseShops;
                        if (shops && shops.length > 0) {
                            const randomCategory = shops[Math.floor(Math.random() * shops.length)];
                            this.surpriseImage = randomCategory.category_label;
                            this.surpriseProduct = randomCategory.product;
                            this.surpriseProductId = randomCategory.productId;
                            this.surpriseShopName = randomCategory.name;
                            this.surpriseShopId = randomCategory.id;
                            this.surpriseShopBranchId = randomCategory.branch_id;
                            this.surpriseShopType = randomCategory.type;
                            this.surpriseShopAddress = randomCategory.address;
                            this.surpriseOpenAt = randomCategory.open_at;
                            this.surpriseCloseAt = randomCategory.close_at;
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

                            this.startSurpriseCooldown();
                        } else {
                            this.toast.error('No product available. Please try agaian!');
                            this.surpriseSheet = false;
                        }
                    }
                    this.surprising = false;
                }, 4000);
            } catch (error) {
                console.error('Error fetching stores:', error);
                this.surprising = false;
                this.surpriseSheet = false;
                this.sheetHeight = 60;
            }
        },

        startDrag(e) {
            if (this.surprising) return;

            // Determine which sheet is active
            if (this.moreSheet) {
                this.activeSheet = 'more';
            } else if (this.surpriseSheet) {
                this.activeSheet = 'surprise';
            } else {
                return;
            }

            this.startY = e.touches[0].clientY
            this.startHeight = this.sheetHeight
        },

        onDrag(e) {
            if (this.surprising) return;

            if (!this.activeSheet) return;

            const currentY = e.touches[0].clientY
            const delta = this.startY - currentY
            let newHeight = this.startHeight + delta / 6
            newHeight = Math.max(0, Math.min(95, newHeight))
            this.sheetHeight = newHeight
        },

        endDrag() {
            if (this.surprising) return;

            if (!this.activeSheet) return;

            const shthght = this.sheetHeight
            if (shthght < 10) {
                if (this.activeSheet === 'more') {
                    this.moreSheet = false;
                } else if (this.activeSheet === 'surprise') {
                    this.surpriseSheet = false;
                }
                this.sheetHeight = this.SNAP_POINTS.half;
                this.activeSheet = null;
                return;
            }
            if (shthght < 60) {
                this.sheetHeight = this.SNAP_POINTS.half
            } else {
                this.sheetHeight = this.SNAP_POINTS.full
            }
            this.activeSheet = null;
        },

        // Pull to Refresh Methods
        handleTouchStart(e) {
            if (this.scrollContainer && this.scrollContainer.scrollTop === 0 && !this.isRefreshing) {
                this.touchStartY = e.touches[0].clientY;
                this.isPulling = true;
                this.startRotationAnimation();
            }
        },

        handleTouchMove(e) {
            if (!this.isPulling || this.isRefreshing) return;

            const currentY = e.touches[0].clientY;
            const diff = currentY - this.touchStartY;

            if (diff > 0 && this.scrollContainer && this.scrollContainer.scrollTop === 0) {
                e.preventDefault();

                let progress = Math.min(diff, this.PULL_THRESHOLD);

                if (progress > this.showProgressThreshold) {
                    this.pullProgress = progress - this.showProgressThreshold;
                } else {
                    this.pullProgress = 0;
                }

                if (this.pullProgress > 0) {
                    const progressPercent = (this.pullProgress / (this.PULL_THRESHOLD - this.showProgressThreshold)) * 100;
                    this.rotationAngle = (progressPercent / 100) * 360;
                } else {
                    this.rotationAngle = 0;
                }
            }
        },

        async handleTouchEnd() {
            if (!this.isPulling || this.isRefreshing) {
                this.isPulling = false;
                this.stopRotationAnimation();
                return;
            }

            this.isPulling = false;

            if (this.pullProgress >= (this.PULL_THRESHOLD - this.showProgressThreshold)) {
                await this.refreshData();
            } else {
                this.pullProgress = 0;
                this.rotationAngle = 0;
                this.stopRotationAnimation();
            }
        },

        startRotationAnimation() {
            if (this.rotationInterval) {
                clearInterval(this.rotationInterval);
            }
        },

        stopRotationAnimation() {
            if (this.rotationInterval) {
                clearInterval(this.rotationInterval);
                this.rotationInterval = null;
            }
        },

        startRefreshingAnimation() {
            let angle = 0;
            this.rotationInterval = setInterval(() => {
                angle = (angle + 45) % 360;
                this.rotationAngle = angle;
            }, 100);
        },

        async refreshData() {
            this.isRefreshing = true;
            this.startRefreshingAnimation();

            try {
                await Promise.all([
                    this.fetchProductBaseCategories(),
                    this.fetchShops()
                ]);

                setTimeout(() => {
                    this.isRefreshing = false;
                    this.pullProgress = 0;
                    this.rotationAngle = 0;
                    this.stopRotationAnimation();
                }, 1500);
            } catch (error) {
                console.error('Refresh failed:', error);

                setTimeout(() => {
                    this.isRefreshing = false;
                    this.pullProgress = 0;
                    this.rotationAngle = 0;
                    this.stopRotationAnimation();
                }, 1500);
            }
        },
    }
}
</script>

<style scoped>
.v-container {
    position: relative;
    padding: 0 !important;
    height: 100vh;
    overflow: hidden;
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
    0%, 100% {
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
    padding: 0 16px;
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
    margin-top: 20px;
    margin-bottom: 20px;
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
    margin-bottom: 20px;
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

.sheet-content {
    height: calc(100% - 20px);
    overflow-y: auto;
    padding: 0 10px !important;
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
    margin-bottom: 20px;
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
    overflow-y: auto;
    padding: 12px !important;
}

.buttons-container .title-skeleton {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
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
    margin-bottom: 20px;
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
    margin-bottom: 80px;
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
    margin-top: 25px;
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