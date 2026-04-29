<!-- Change the pagination -->
<template>
    <v-container class="pull-to-refresh-container">
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

        <!-- Scrollable Content -->
        <div ref="scrollContainer" class="scroll-content" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
            @touchend="handleTouchEnd">
            <!-- Top -->
            <div class="headline content-between">
                <div>
                    <v-btn size="small" icon>
                        <v-icon @click="goBack">mdi-arrow-left</v-icon>
                    </v-btn>
                    <h3>Open {{ shopStore.getShops.length > 1 ? 'Stores' : 'Store' }}</h3>
                </div>
                <span><v-img :src="storeImage" width="30"></v-img></span>
            </div>

            <!-- Loading -->
            <template v-if="shopStore.loading || isRefreshing">
                <v-row>
                    <v-col cols="12">
                        <v-card class="loading-card-search">
                            <v-skeleton-loader type="text" width="200" class="no-background"></v-skeleton-loader>
                        </v-card>
                    </v-col>
                </v-row>
                <v-card class="buttons-container">
                    <div class="title-skeleton">
                        <v-skeleton-loader type="sentences" width="200" class="no-background"></v-skeleton-loader>
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
                <!-- If no stores found -->
                <template v-if="shopStore.shop_list.length === 0">
                    <v-card class="buttons-container">
                        <v-row>
                            <v-col cols="12" style="padding: 5px !important;">
                                <v-card class="no-found">
                                    <span><v-img :src="nostoreImage" width="130"></v-img></span>
                                    <p class="mt-5" style="font-weight: 600; color: #ab2323;">No available store found
                                    </p>
                                    <span class="text-grey" style="font-size: 12px;;"><em>Wala sang may nakita nga
                                            baligyaan</em></span>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-card>
                </template>

                <template v-else>
                    <!-- Search -->
                    <v-card class="search-box">
                        <v-text-field v-model="searchBox" placeholder="Search store..." @keyup.enter="handleSearchBox"
                            @keydown="handleKeyDown" @input="handleSearchInput" :loading="searching">
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
                                    :key="suggestion.type + (suggestion.value || index)"
                                    @click="selectSuggestion(suggestion)"
                                    :class="{ 'v-list-item--active': index === selectedSuggestionIndex }"
                                    :style="index === selectedSuggestionIndex ? 'background-color: #f5f5f5;' : ''">
                                    <v-list-item-title>
                                        <v-icon class="text-grey-darken-1 mx-2">mdi-magnify</v-icon>
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

                    <!-- Stores List -->
                    <v-card class="buttons-container">
                        <h4>
                            {{ shopStore.getShops.length > 1 ? 'These stores are' : 'This store is' }} open now <br />
                            <span> {{ shopStore.getShops.length > 1 ? 'Mga baligyaan' : 'Baligyaan' }} nga abri
                                subong</span>
                        </h4>
                        <v-row>
                            <v-col v-for="(shop) in shopStore.getShops" :key="shop.id" cols="12" lg="6" md="6" sm="6"
                                style="padding: 5px !important;">
                                <v-btn @click="toShop(shop)" class="button">
                                    <v-img :src="storeImage" width="35" class="mr-2 flex-shrink-0"></v-img>
                                    <div class="d-flex flex-column flex-grow-1 text-start overflow-hidden">
                                        <span class="text-wrap mr-15">
                                            {{ shop.name }}
                                        </span>
                                        <span class="text-grey-darken-1" style="font-size: 12px;">
                                            {{ shop.type }}
                                        </span>
                                    </div>
                                    <div class="d-flex align-center flex-column"
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
                    </v-card>

                </template>
            </template>
        </div>
    </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useShopStore } from '@/stores/shopStore'
import { useToast } from 'vue-toastification'

// Router & Store
const router = useRouter()
const shopStore = useShopStore()
const toast = useToast()

// State
const isOnline = ref(navigator.onLine)
const searchBox = ref(null)
const searchTimeout = ref(null)
const searching = ref(false)
const selectedSuggestionIndex = ref(-1)
const itemsPerPage = ref(20)
const debouncedSearch = ref(null)
const currentHour = ref(new Date().getHours())
const currentMinute = ref(new Date().getMinutes())
const timeInterval = ref(null)

// Images
const nostoreImage = new URL('@/assets/img/png/food/No Store.png', import.meta.url).href
const storeImage = new URL('@/assets/img/png/food/Store.png', import.meta.url).href

// Pull to refresh properties
const scrollContainer = ref(null)
const isRefreshing = ref(false)
const pullProgress = ref(0)
const touchStartY = ref(0)
const isPulling = ref(false)
const rotationAngle = ref(0)
const rotationInterval = ref(null)
const PULL_THRESHOLD = 200
const showProgressThreshold = 100

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

// Methods
const onOnline = () => {
    isOnline.value = true
    toast.info("Internet connection restored.")
}

const goBack = () => {
    router.go(-1)
}

const fetchShops = async (forceRefresh = false) => {
    // Skip cache check if force refresh is true
    if (!forceRefresh && 
        shopStore.lastCategory === null &&
        shopStore.lastMealType === null &&
        shopStore.lastTimeBetween === `${currentHour.value}:${currentMinute.value}` &&
        shopStore.shop_list.length > 0) {
        return
    }

    const request = {
        requested_category: null,
        requested_meal_type: null,
        requested_time_between: `${currentHour.value}:${currentMinute.value}`,
        items_per_page: itemsPerPage.value
    }
    try {
        await shopStore.fetchShopListStore(request)
    } catch (error) {
        console.error('Error fetching stores:', error)
    }
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

    searchTimeout.value = setTimeout(() => {
        if (searchBox.value && searchBox.value.length >= 2) {
            const suggestions = searchSuggestions.value
            if (suggestions.length > 0) {
                console.log('Suggestions:', suggestions)
            }
        }
    }, 300)
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
                }
            })
        } else {
            console.error('Store not found. Looking for ID:', suggestion.value)
            console.error('Available shops:', shopsArray)
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
        }
    })
}

const clearSearch = () => {
    searchBox.value = null
}

const startTimeTracking = () => {
    updateTime()
    timeInterval.value = setInterval(updateTime, 60000)
}

const updateTime = () => {
    const now = new Date()
    currentHour.value = now.getHours()
    currentMinute.value = now.getMinutes()
}

// Pull to Refresh Methods
const handleTouchStart = (e) => {
    if (scrollContainer.value && scrollContainer.value.scrollTop === 0 && !isRefreshing.value) {
        touchStartY.value = e.touches[0].clientY
        isPulling.value = true
    }
}

const handleTouchMove = (e) => {
    if (!isPulling.value || isRefreshing.value) return

    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.value

    if (diff > 0 && scrollContainer.value && scrollContainer.value.scrollTop === 0) {
        e.preventDefault()

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

        // pullProgress.value = Math.min(diff, PULL_THRESHOLD)
        // const progressPercent = (pullProgress.value / PULL_THRESHOLD) * 100
        // rotationAngle.value = (progressPercent / 100) * 360
    }
}

const handleTouchEnd = async () => {
    if (!isPulling.value || isRefreshing.value) {
        isPulling.value = false
        return
    }

    isPulling.value = false

    if (pullProgress.value >= (PULL_THRESHOLD - showProgressThreshold)) {
        await refreshData()
    } else {
        pullProgress.value = 0
        rotationAngle.value = 0
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
        // Force refresh shops by passing true to bypass cache
        await fetchShops(true)

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

// Lifecycle
onMounted(() => {
    startTimeTracking()
    setupDebouncedSearch()
    window.addEventListener('online', onOnline)
    fetchShops()
    scrollContainer.value = document.querySelector('.scroll-content')
})

onUnmounted(() => {
    window.removeEventListener('online', onOnline)
    if (timeInterval.value) {
        clearInterval(timeInterval.value)
    }
    if (rotationInterval.value) {
        clearInterval(rotationInterval.value)
    }
})
</script>

<style scoped>
.pull-to-refresh-container {
    position: relative;
    padding: 0 !important;
    height: 100vh;
    overflow: hidden;
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
    margin-top: 20px;
    margin-bottom: 20px;
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
    padding-left: 10px;
    margin-top: 20px;
    margin-bottom: 20px;
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
    margin-bottom: 80px;
    padding: 25px;
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

.buttons-container .button-item {
    display: flex;
    align-items: center;
    flex-direction: column;
}

.buttons-container .button .button-text {
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

.buttons-container .title-skeleton {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
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