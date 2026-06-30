<template>
    <v-container class="pull-to-refresh-container">
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
                    }" style="border-radius: 50%; padding: 8px;" />
                </div>
            </div>
        </div>

        <!-- Scrollable Content -->
        <div ref="contentContainer" class="scroll-content">

            <div class="pull-zone" ref="pullZone"></div>

            <!-- Top -->
            <div class="headline content-between">
                <div>
                    <v-btn size="small" style="background: transparent !important;" icon>
                        <HugeiconsIcon @click="goBack" :icon="ArrowLeft02Icon" size="20" />
                    </v-btn>
                    <h3>{{ requested_category }}</h3>
                </div>
                <span><v-img :src="productImages[requested_category] || storeImage" width="30"></v-img></span>
            </div>

            <template v-if="shopStore.loading">
                <v-row>
                    <v-col cols="12">
                        <v-card class="loading-card-search">
                            <v-skeleton-loader type="text" width="200" class="no-background"></v-skeleton-loader>
                        </v-card>
                    </v-col>
                </v-row>
                <v-card class="buttons-container">
                    <div class="title-skeleton">
                        <v-skeleton-loader type="sentences" width="300" class="no-background"></v-skeleton-loader>
                    </div>
                    <v-row>
                        <v-col v-for="n in 10" :key="n" cols="12" lg="6" md="6" sm="6" style="padding: 5px !important;">
                            <div class="button mb-3">
                                <v-skeleton-loader type="avatar, sentences" width="300"
                                    class="no-background"></v-skeleton-loader>
                                <v-skeleton-loader type="sentences" width="200"
                                    class="no-background"></v-skeleton-loader>
                            </div>
                        </v-col>
                    </v-row>
                </v-card>
            </template>

            <template v-else>
                <!-- If no Products found -->
                <template v-if="shopStore.getShops.length === 0">
                    <v-row>
                        <v-col cols="12">
                            <v-card class="no-found">
                                <span><v-img :src="nostoreImage" width="130"></v-img></span>
                                <p>There's no available merchant</p>
                                <span class="subtitle">Wala sang may nagabaligya</span>
                            </v-card>
                        </v-col>
                    </v-row>
                </template>

                <template v-else>
                    <v-card class="search-box">
                        <v-text-field v-model="searchBox" placeholder="Search store..." @keyup.enter="handleSearchBox"
                            @keydown="handleKeyDown" @input="handleSearchInput" :loading="searching">
                            <template v-slot:prepend-inner>
                                <HugeiconsIcon :icon="Search01Icon" size="20" class="mb-1 mr-1" />
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
                                    :key="suggestion.type + (suggestion.value || index)"
                                    @click="selectSuggestion(suggestion)"
                                    :class="{ 'v-list-item--active': index === selectedSuggestionIndex }"
                                    :style="index === selectedSuggestionIndex ? 'background-color: #f5f5f5;' : ''">
                                    <v-list-item-title class="d-flex align-center">
                                        <HugeiconsIcon :icon="Store01Icon" size="20" class="text-grey-darken-1 mr-2" />
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

                    <v-card class="buttons-container">
                        <h4>
                            Where to buy? <br />
                            <span>Sa diin mabakal?</span>
                        </h4>
                        <v-row>
                            <v-col v-for="(shop) in shopStore.getShops" :key="shop.id" cols="12" lg="6" md="6" sm="6"
                                style="padding: 5px !important;">
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
                                    <div class="d-flex align-end flex-column" style="position: absolute; right: 10px;">
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
                    </v-card>
                </template>
            </template>
        </div>
    </v-container>
</template>

<script setup>
import { HugeiconsIcon } from '@hugeicons/vue'
import { Loading03Icon, ArrowLeft02Icon, Search01Icon, Store01Icon, CancelCircleIcon } from '@hugeicons/core-free-icons'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useShopStore } from '@/stores/shopStore'
import { useToast } from 'vue-toastification'

// Router & Store
const router = useRouter()
const route = useRoute()
const shopStore = useShopStore()
const toast = useToast()

// State
const isOnline = ref(navigator.onLine)
const searchBox = ref(null)
const searchTimeout = ref(null)
const searching = ref(false)
const selectedSuggestionIndex = ref(-1)
const debouncedSearch = ref(null)
const requested_category = ref(null)
const requested_meal_type = ref(null)
const itemsPerPage = ref(10)

// Images
const storeImage = new URL('@/assets/img/png/food/Store.png', import.meta.url).href
const nostoreImage = new URL('@/assets/img/png/food/No Store.png', import.meta.url).href

// Pull to refresh properties
const pullZone = ref(null);
const isTouchingPullZone = ref(false)
const contentContainer = ref(null)
const isRefreshing = ref(false)
const pullProgress = ref(0)
const touchStartY = ref(0)
const isPulling = ref(false)
const rotationAngle = ref(0)
const rotationInterval = ref(null)
const PULL_THRESHOLD = 200
const showProgressThreshold = 100

// Add this to track if we should prevent default
const shouldPreventDefault = ref(false)

// Computed
const searchSuggestions = computed(() => {
    if (!searchBox.value || searchBox.value.length < 2) return []

    const searchLower = searchBox.value.toLowerCase()
    const suggestions = []

    const shopsArray = shopStore.getShops

    if (shopsArray && shopsArray.length > 0) {
        const storeSuggestions = shopsArray
            .filter(shop => {
                if (!shop) return false
                const shopName = shop.name
                return shopName && shopName.toLowerCase().includes(searchLower)
            })
            .map(shop => ({
                type: 'store',
                label: shop.name,
                value: shop.id,
                shopData: shop
            }))
        suggestions.push(...storeSuggestions)
    }

    return suggestions.slice(0, 10)
})

const productImages = computed(() => {
    const images = require.context('@/assets/img/png/food', false, /\.png$/)
    const map = {}
    images.keys().forEach(fileName => {
        const cleanName = fileName.replace('./', '').replace('.png', '')
        map[cleanName] = images(fileName)
    })
    return map
})

// Methods
const onOnline = () => {
    isOnline.value = true
    toast.info("Internet connection restored.")
}

const goBack = () => {
    router.go(-1)
}

const initData = () => {
    if (route.query.baseCategory && route.query.mealType) {
        requested_category.value = route.query.baseCategory
        requested_meal_type.value = route.query.mealType
        fetchShops()
    }
    else if (route.query.mealType) {
        requested_meal_type.value = route.query.mealType
        requested_category.value = null
        fetchShops()
    }
    else if (route.query.baseCategory) {
        requested_category.value = route.query.baseCategory
        requested_meal_type.value = null
        fetchShops()
    } else {
        requested_category.value = null
        requested_meal_type.value = null
    }
}

const fetchShops = async () => {
    const request = {
        requested_category: requested_category.value,
        requested_meal_type: requested_meal_type.value,
        items_per_page: itemsPerPage.value
    }

    try {
        await shopStore.fetchShopListStore(request)
    } catch (error) {
        console.error('Error fetching stores:', error)
    }
}

const isShopOpen = (shop) => {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const [openH, openM] = shop.open_at.split(':').map(Number)
    const [closeH, closeM] = shop.close_at.split(':').map(Number)

    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM

    if (openMinutes < closeMinutes) {
        return currentMinutes >= openMinutes && currentMinutes < closeMinutes
    }

    return currentMinutes >= openMinutes || currentMinutes < closeMinutes
}

const sanitizeSearchTerm = (term) => {
    if (!term) return ''
    return term.trim()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, ' ')
        .toLowerCase()
}

const handleSearchInput = () => {
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
    }
}

const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

const setupDebouncedSearch = () => {
    debouncedSearch.value = debounce(() => {
        if (searchBox.value && searchBox.value.trim()) {
            handleSearchBox()
        }
    }, 500)
}

const handleStoreSearch = async (suggestion) => {
    if (!suggestion || !suggestion.value) {
        toast.error("Invalid store selection")
        return
    }

    searching.value = true
    try {
        const shopsArray = shopStore.getShops

        if (!shopsArray || !Array.isArray(shopsArray)) {
            toast.error("Store data not available")
            return
        }

        const shop = shopsArray.find(s => s && s.id === suggestion.value)

        if (shop) {
            await nextTick()
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
                    requestedCategory: requested_category.value
                }
            })
        } else {
            console.error('Store not found. Looking for ID:', suggestion.value)
            toast.error("Store not found")
        }
    } catch (error) {
        console.error("Error navigating to store:", error)
    } finally {
        searching.value = false
    }
}

const handleSearchBox = async () => {
    if (!searchBox.value || !searchBox.value.trim()) {
        toast.error("Please enter a search term")
        return
    }

    searching.value = true

    const rawSearchTerm = searchBox.value.trim()
    const sanitizedTerm = sanitizeSearchTerm(rawSearchTerm)

    if (!sanitizedTerm) {
        toast.error("Please enter a valid search term")
        searching.value = false
        return
    }

    try {
        const shopsArray = shopStore.getShops
        let matchingStore = null
        if (shopsArray && Array.isArray(shopsArray)) {
            matchingStore = shopsArray.find(shop => {
                if (!shop) return false
                const shopName = (shop.name || '').toLowerCase()
                return shopName === sanitizedTerm || shopName.includes(sanitizedTerm)
            })
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
                    requestedCategory: requested_category.value
                }
            })
            searching.value = false
            return
        }
    } catch (error) {
        console.error("Error in search filtering:", error)
    } finally {
        searching.value = false
    }
}

const highlightMatch = (suggestion, searchTerm) => {
    if (!suggestion || !searchTerm) return suggestion || ''

    const suggestionStr = String(suggestion)
    const searchTermStr = String(searchTerm)

    const searchLower = searchTermStr.toLowerCase()
    const suggestionLower = suggestionStr.toLowerCase()
    const index = suggestionLower.indexOf(searchLower)

    if (index === -1) return suggestionStr

    const before = suggestionStr.substring(0, index)
    const match = suggestionStr.substring(index, index + searchTermStr.length)
    const after = suggestionStr.substring(index + searchTermStr.length)

    return {
        before,
        match,
        after
    }
}

const selectSuggestion = (suggestion) => {
    searchBox.value = suggestion.label
    if (suggestion.type === 'store') {
        handleStoreSearch(suggestion)
    }
    selectedSuggestionIndex.value = -1
}

const handleKeyDown = (event) => {
    if (!searchSuggestions.value.length) return

    if (event.key === 'ArrowDown') {
        event.preventDefault()
        selectedSuggestionIndex.value = (selectedSuggestionIndex.value + 1) % searchSuggestions.value.length
    } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        selectedSuggestionIndex.value = selectedSuggestionIndex.value <= 0
            ? searchSuggestions.value.length - 1
            : selectedSuggestionIndex.value - 1
    } else if (event.key === 'Enter' && selectedSuggestionIndex.value >= 0) {
        event.preventDefault()
        const suggestion = searchSuggestions.value[selectedSuggestionIndex.value]
        selectSuggestion(suggestion)
        selectedSuggestionIndex.value = -1
    }
}

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
            requestedCategory: requested_category.value
        }
    })
}

const clearSearch = () => {
    searchBox.value = null
}

// Pull to Refresh Methods - FIXED VERSION
const handleTouchStart = (e) => {
    const scrollElement = contentContainer.value;
    if (!scrollElement) return;

    const isTopOfContent = scrollElement.scrollTop === 0;
    const touchY = e.touches[0].clientY;
    const elementRect = scrollElement?.getBoundingClientRect();
    const isNearTop = elementRect && (touchY - elementRect.top) < 50;

    if (isTopOfContent && isNearTop && !isRefreshing.value) {
        touchStartY.value = touchY;
        isPulling.value = true;
        isTouchingPullZone.value = true;
        shouldPreventDefault.value = true;
    } else {
        isPulling.value = false;
        isTouchingPullZone.value = false;
        shouldPreventDefault.value = false;
    }
}

const handleTouchMove = (e) => {
    // Only handle if we're in pulling mode and not refreshing
    if (!isPulling.value || isRefreshing.value || !isTouchingPullZone.value) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.value;
    const scrollElement = contentContainer.value;

    // Only activate when pulling down AND at the very top
    if (diff > 0 && scrollElement && scrollElement.scrollTop === 0) {
        // Check if event is cancelable before preventing default
        if (e.cancelable && shouldPreventDefault.value) {
            e.preventDefault();
        }
        
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
    } else if (diff < 0) {
        // User is scrolling down into content, reset pulling state
        isPulling.value = false;
        isTouchingPullZone.value = false;
        shouldPreventDefault.value = false;
        pullProgress.value = 0;
        rotationAngle.value = 0;
    }
}

const handleTouchEnd = async () => {
    if (!isPulling.value || isRefreshing.value) {
        isPulling.value = false;
        isTouchingPullZone.value = false;
        shouldPreventDefault.value = false;
        return;
    }

    isPulling.value = false;
    isTouchingPullZone.value = false;
    shouldPreventDefault.value = false;

    if (pullProgress.value >= (PULL_THRESHOLD - showProgressThreshold)) {
        await refreshData();
    } else {
        pullProgress.value = 0;
        rotationAngle.value = 0;
    }
}

const startRefreshingAnimation = () => {
    let angle = 0
    rotationInterval.value = setInterval(() => {
        angle = (angle + 45) % 360
        rotationAngle.value = angle
    }, 100)
}

const stopRotationAnimation = () => {
    if (rotationInterval.value) {
        clearInterval(rotationInterval.value)
        rotationInterval.value = null
    }
}

const refreshData = async () => {
    isRefreshing.value = true
    startRefreshingAnimation()

    try {
        await fetchShops()

        if (contentContainer.value) {
            contentContainer.value.scrollTop = 0
        }

        setTimeout(() => {
            isRefreshing.value = false
            pullProgress.value = 0
            rotationAngle.value = 0
            stopRotationAnimation()
        }, 1000)
    } catch (error) {
        console.error('Refresh failed:', error)
        toast.error('Failed to refresh data')

        setTimeout(() => {
            isRefreshing.value = false
            pullProgress.value = 0
            rotationAngle.value = 0
            stopRotationAnimation()
        }, 1500)
    }
}

// Watchers
watch(() => route.query, () => {
    initData()
}, { immediate: true })

// Lifecycle - FIXED: Add touchstart and touchend listeners too
onMounted(async () => {
    window.addEventListener('online', onOnline)

    await nextTick()

    setupDebouncedSearch()

    contentContainer.value = document.querySelector('.scroll-content')

    if (contentContainer.value) {
        // Add all three touch listeners manually with appropriate options
        contentContainer.value.addEventListener('touchstart', handleTouchStart, { passive: false });
        contentContainer.value.addEventListener('touchmove', handleTouchMove, { passive: false });
        contentContainer.value.addEventListener('touchend', handleTouchEnd);
        contentContainer.value.addEventListener('touchcancel', handleTouchEnd);
    }
})

onUnmounted(() => {
    window.removeEventListener('online', onOnline)
    
    if (rotationInterval.value) {
        clearInterval(rotationInterval.value)
    }
    
    if (contentContainer.value) {
        contentContainer.value.removeEventListener('touchstart', handleTouchStart);
        contentContainer.value.removeEventListener('touchmove', handleTouchMove);
        contentContainer.value.removeEventListener('touchend', handleTouchEnd);
        contentContainer.value.removeEventListener('touchcancel', handleTouchEnd);
    }
})
</script>

<style scoped>
.pull-to-refresh-container {
    position: relative;
    padding: 0 !important;
    height: 100vh;
    overflow: hidden;
    overscroll-behavior-y: contain;
}

.scroll-content {
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0 16px;
    overscroll-behavior-y: contain;
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

.pull-zone {
    position: absolute;
    top: 50px;
    left: 0;
    right: 0;
    height: 1px;
    pointer-events: none;
    z-index: 1;
}

.headline {
    margin: 16px 0 16px 0;
}

.headline div {
    display: flex;
    align-items: center;
}

.headline .v-btn {
    box-shadow: none;
}

.headline .v-icon {
    font-size: 20px !important;
}

.headline h3 {
    color: #5c3a21;
    font-weight: 500;
    margin-left: 15px;
}

.loading-card-search {
    border-radius: 10px;
    box-shadow: none !important;
    margin-bottom: 20px;
    padding: 5px;
}

.search-box {
    position: sticky;
    position: -webkit-sticky;
    top: 20px;
    z-index: 999;
    border-radius: 10px;
    box-shadow: none !important;
    height: 52px;
    padding-left: 8px;
    margin: 16px 0 16px 0;
}

:deep(svg) {
    color: #747474;
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
    background-color: #ffffff !important;
    border-radius: 10px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.suggestions-dropdown .v-list {
    background-color: #ffffff !important;
    border-radius: 10px !important;
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
    background-color: #fcf0e0;
}

:deep(.v-skeleton-loader__button) {
    height: 55px !important;
    max-width: none !important;
}

.buttons-container {
    border-radius: 10px;
    box-shadow: none !important;
    padding: 25px;
    margin-bottom: 80px;
}

.buttons-container h4 {
    line-height: 0.5cm;
    text-align: center;
    margin-bottom: 20px;
    color: #5c3a21;
}

.buttons-container h4 span {
    font-weight: 500;
    font-size: 13px;
    color: #adadad;
    font-style: italic;
}

.buttons-container .button {
    box-shadow: none;
    border-radius: 10px;
    width: 100%;
    height: 85px;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    background-color: #fcf0e0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    overflow: hidden;
}

.buttons-container .title-skeleton {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
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

.content-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
    font-weight: 500;
}

.subtitle {
    font-size: 12px;
    font-style: italic;
    color: #d7d7d7 !important;
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