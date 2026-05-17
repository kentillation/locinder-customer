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
                    }"
                        style="border-radius: 50%; padding: 8px;" />
                </div>
            </div>
        </div>

        <!-- Scrollable Content -->
        <div ref="contentContainer" class="scroll-content" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
            @touchend="handleTouchEnd">
            <!-- Top -->
            <div class="headline content-between">
                <div>
                    <v-btn size="small" style="background: transparent !important;" icon>
                        <HugeiconsIcon @click="goBack" :icon="ArrowLeft02Icon" size="20" />
                    </v-btn>
                    <h3>New Products</h3>
                </div>
                <span><v-img :src="currentTimeImage" width="30"></v-img></span>
            </div>

            <!-- Search Products -->
            <v-card class="search-box">
                <v-text-field v-model="searchProduct" @click="noCategory" placeholder="Search product..." autofocus>
                    <template v-slot:prepend-inner>
                        <v-icon class="me-1">mdi-magnify</v-icon>
                    </template>
                </v-text-field>
            </v-card>

            <!-- Categories Skeleton-->
            <template v-if="isCategoriesLoading || isRefreshing">
                <v-slide-group class="mb-3">
                    <v-slide-group-item>
                        <v-skeleton-loader v-for="c in 10" :key="c" type="text" width="100"
                            class="no-background"></v-skeleton-loader>
                    </v-slide-group-item>
                </v-slide-group>
            </template>

            <!-- Categories -->
            <template v-else>
                <v-slide-group class="mb-4 ms-1">
                    <v-slide-group-item>
                        <v-chip @click="reloadProductsAndCategories" :color="!requested_category ? '#5c3a21' : '#fff'"
                            :class="{ 'd-none': productsStore.getProductCategories.length === 0 }" variant="flat"
                            class="me-1" style="font-weight: 500;">
                            All
                        </v-chip>
                        <v-chip v-for="(category) in productsStore.getProductCategories" :key="category.label"
                            @click="handleCategorySelect(category)"
                            :class="{ active: requested_category === category.label }" color="#fff" variant="flat"
                            class="me-1 category-chip" style="font-weight: 500;">
                            {{ category.label }}
                        </v-chip>
                    </v-slide-group-item>
                </v-slide-group>
            </template>

            <!-- Products -->
            <v-card class="buttons-container">
                <!-- Products Skeleton -->
                <template v-if="(isProductsLoading && productsStore.products.length === 0) || isRefreshing">
                    <div class="title-skeleton">
                        <v-skeleton-loader type="sentences" width="300" class="no-background">
                        </v-skeleton-loader>
                    </div>
                    <v-row>
                        <v-col v-for="n in 10" :key="n" cols="12" lg="6" md="6" sm="6" style="padding: 5px !important;">
                            <div class="button content-between">
                                <v-skeleton-loader type="avatar, sentences" width="300"
                                    class="no-background"></v-skeleton-loader>
                                <v-skeleton-loader type="text" width="200" class="no-background"></v-skeleton-loader>
                            </div>
                        </v-col>
                    </v-row>
                </template>

                <template v-else>
                    <!-- If no Products found -->
                    <template v-if="productsStore.products.length === 0 && !isProductsLoading">
                        <v-row>
                            <v-col cols="12">
                                <v-card class="no-found">
                                    <span><v-img :src="nofastfoodImage" width="130"></v-img></span>
                                    <p style="font-weight: 500; color: #ab2323;">No available products found</p>
                                    <span class="text-grey" style="font-size: 12px;">
                                        <em>Wala sang may nakita nga produkto</em>
                                    </span>
                                </v-card>
                            </v-col>
                        </v-row>
                    </template>

                    <!-- Show Products -->
                    <template v-else>
                        <span class="card-badge">New</span>
                        <h4>
                            What are the new products? <br />
                            <span>Ano ang mga bag-o nga produkto?</span>
                        </h4>
                        <v-row>
                            <v-col v-for="product in filteredProducts" :key="product.product_id" cols="12" lg="6" md="6"
                                sm="6" style="padding: 5px !important;">
                                <v-btn @click="selectProduct(product)" class="button"
                                    :class="{ active: selectedCard === product.product_id }">
                                    <v-img :src="productImages[product.category_label] || fastfoodImage" width="35"
                                        class="mr-2 flex-shrink-0"></v-img>
                                    <div class="d-flex flex-column flex-grow-1 text-start overflow-hidden">
                                        <span class="text-wrap mr-15">
                                            <span style="color: #5c3a21;">{{ product.product_name }}</span>
                                        </span>
                                        <span class="text-grey-darken-1" style="font-size: 12px;">{{ product.size_label
                                            }}</span>
                                        <span class="text-wrap mr-15" style="font-size: 12px;"><em>{{ product.shop_name
                                                }}</em></span>
                                    </div>
                                    <div class="d-flex align-center">
                                        <span style="font-size: 18px; position: absolute; right: 10px;">₱{{
                                            product.base_price
                                        }}</span>
                                    </div>
                                </v-btn>
                            </v-col>
                        </v-row>
                    </template>
                </template>

                <!-- Products -->


                <!-- Infinite Scroll Loading Indicator -->
                <div v-if="loadingMore" class="loading-more">
                    <v-progress-circular indeterminate color="#5c3a21" size="40"></v-progress-circular>
                    <p class="mt-2">Loading more products...</p>
                </div>

                <!-- No More Products Message -->
                <div v-if="!hasMoreProducts && productsStore.products.length > 0 && !isProductsLoading && !loadingMore"
                    class="no-more-products">
                    <v-divider class="my-4"></v-divider>
                    <div class="d-flex align-center justify-center flex-column py-4">
                        <v-icon color="#000" size="40">mdi-food-off-outline</v-icon>
                        <span class="text-grey-darken-4 mt-2">
                            No more products to show
                        </span>
                        <span class="text-grey-lighten-1">
                            <i>Wala na sang produkto nga makita</i>
                        </span>
                    </div>
                </div>
            </v-card>
        </div>
    </v-container>
</template>

<script setup>
import { HugeiconsIcon } from '@hugeicons/vue'
import { Loading03Icon, ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/productsStore'
import { useToast } from 'vue-toastification'

// Router & Store
const router = useRouter()
const route = useRoute()
const productsStore = useProductsStore()
const toast = useToast()

// State
const isOnline = ref(navigator.onLine)
const isProductsLoading = ref(false)
const isCategoriesLoading = ref(false)
const new_product = ref(1)
const itemsPerPage = ref(20)
const currentPage = ref(1)
const hasMoreProducts = ref(true)
const loadingMore = ref(false)
const isFetching = ref(false)
const selectedCard = ref(null)
const searchProduct = ref('')
const requested_category = ref(null)
const fastfoodImage = new URL('@/assets/img/png/food/Fast Food.png', import.meta.url).href
const currentTimeImage = new URL('@/assets/img/png/food/Current Time.png', import.meta.url).href
const nofastfoodImage = new URL('@/assets/img/png/food/No Fast Food.png', import.meta.url).href

// Scroll handling
const contentContainer = ref(null)
const scrollTimeout = ref(null)
const isInitialized = ref(false)

// Pull to refresh properties
const isRefreshing = ref(false)
const pullProgress = ref(0)
const touchStartY = ref(0)
const isPulling = ref(false)
const rotationAngle = ref(0)
const rotationInterval = ref(null)
const PULL_THRESHOLD = 200
const showProgressThreshold = 100

// Computed
const filteredProducts = computed(() => {
    let list = productsStore.products

    if (requested_category.value) {
        list = list.filter(p => p.category_label === requested_category.value)
    }

    if (searchProduct.value) {
        list = list.filter(p =>
            p.product_name.toLowerCase().includes(searchProduct.value.toLowerCase())
        )
    }

    return list
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
const goBack = () => {
    router.go(-1)
}

const onOnline = () => {
    isOnline.value = true
    toast.info('Internet connection restored')
}

const setupInfiniteScroll = () => {
    const container = contentContainer.value
    if (container) {
        container.addEventListener('scroll', handleScroll)
    }
}

const removeInfiniteScroll = () => {
    const container = contentContainer.value
    if (container) {
        container.removeEventListener('scroll', handleScroll)
    }
}

const handleScroll = () => {
    if (scrollTimeout.value) {
        clearTimeout(scrollTimeout.value)
    }

    scrollTimeout.value = setTimeout(() => {
        const container = contentContainer.value
        if (!container) return

        const { scrollTop, scrollHeight, clientHeight } = container
        const distanceToBottom = scrollHeight - (scrollTop + clientHeight)

        if (distanceToBottom <= 200 && !loadingMore.value && hasMoreProducts.value && !isProductsLoading.value && !isFetching.value && !isRefreshing.value) {
            loadMoreProducts()
        }
    }, 100)
}

const loadMoreProducts = async () => {
    if (loadingMore.value || !hasMoreProducts.value || isProductsLoading.value || isFetching.value || isRefreshing.value) {
        return
    }

    if (searchProduct.value && searchProduct.value.trim() !== '') {
        return
    }

    const nextPage = Math.floor(productsStore.products.length / itemsPerPage.value) + 1

    isFetching.value = true
    loadingMore.value = true

    try {
        const request = {
            is_new: new_product.value,
            items_per_page: itemsPerPage.value,
            page: nextPage
        }

        const response = await productsStore.fetchNewProductsStore(request)

        if (response && response.pagination) {
            hasMoreProducts.value = response.pagination.has_more === true
            currentPage.value = response.pagination.current_page
        } else if (response && response.data) {
            if (response.data.length === 0) {
                hasMoreProducts.value = false
            } else {
                currentPage.value = nextPage
                if (response.data.length < itemsPerPage.value) {
                    hasMoreProducts.value = false
                }
            }
        } else {
            hasMoreProducts.value = false
        }
    } catch (error) {
        console.error('Error loading more products:', error)
    } finally {
        loadingMore.value = false
        isFetching.value = false
    }
}

const fetchNewProducts = async (forceRefresh = false) => {
    if ((isProductsLoading.value || isFetching.value) && !forceRefresh) return

    isFetching.value = true
    isProductsLoading.value = true

    try {
        const request = {
            is_new: new_product.value,
            items_per_page: itemsPerPage.value,
            page: 1
        }

        const response = await productsStore.fetchNewProductsStore(request)

        if (response && response.pagination) {
            hasMoreProducts.value = response.pagination.has_more === true
            currentPage.value = response.pagination.current_page
        } else if (response && response.data && response.data.length < itemsPerPage.value) {
            hasMoreProducts.value = false
            currentPage.value = 1
        } else {
            currentPage.value = 1
        }
    } catch (error) {
        console.error('Error fetching products:', error)
        throw error
    } finally {
        isProductsLoading.value = false
        isFetching.value = false
    }
}

const fetchCategories = async () => {
    isCategoriesLoading.value = true

    try {
        const request = {
            is_new: new_product.value,
            items_per_page: itemsPerPage.value,
        }

        await productsStore.fetchCategoriesByNewProductStore(request)
    } catch (error) {
        console.error('Error fetching categories:', error)
        throw error
    } finally {
        isCategoriesLoading.value = false
    }
}

const initData = async () => {
    if (isInitialized.value) return

    isInitialized.value = true

    requested_category.value = null
    currentPage.value = 1
    hasMoreProducts.value = true
    productsStore.products = []

    if (!new_product.value) {
        console.error('New products data is missing')
        return
    }

    await fetchAllData()
}

const fetchAllData = async () => {
    try {
        productsStore.loading = true

        await Promise.all([
            fetchCategories(),
            fetchNewProducts()
        ])
    } catch (error) {
        console.error('Error fetching data:', error)
    } finally {
        productsStore.loading = false
    }
}

const noCategory = () => {
    requested_category.value = ''
}

const selectProduct = (product) => {
    if (!product) {
        console.error("Product data is missing!", product)
        toast.error('Product data is missing')
        return
    }
    selectedCard.value = product.product_id
    router.push({
        path: '/shop/',
        query: {
            shopId: product.shop_id,
            shopName: product.shop_name,
            shopType: product.shop_type,
            shopAddress: product.shop_address,
            openAt: product.open_at,
            closeAt: product.close_at,
            requestedCategory: product.category_label,
        }
    })
}

const reloadProductsAndCategories = async () => {
    requested_category.value = null
    selectedCard.value = null
    searchProduct.value = ''
    currentPage.value = 1
    hasMoreProducts.value = true

    productsStore.resetProducts()
    await fetchNewProducts(true)
}

const handleCategorySelect = async (category) => {
    selectedCard.value = null
    if (!category || !category.label) {
        toast.error('Invalid selected category')
        return
    }

    try {
        await nextTick()
        requested_category.value = category.label
        searchProduct.value = ''
    } catch (error) {
        console.error('Error handling category selection:', error)
        toast.error('Error selecting category')
    }
}

// Pull to Refresh Methods
const handleTouchStart = (e) => {
    if (contentContainer.value && contentContainer.value.scrollTop === 0 && !isRefreshing.value) {
        touchStartY.value = e.touches[0].clientY
        isPulling.value = true
    }
}

const handleTouchMove = (e) => {
    if (!isPulling.value || isRefreshing.value) return

    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.value

    if (diff > 0 && contentContainer.value && contentContainer.value.scrollTop === 0) {
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
        // Refresh both categories and products
        await Promise.all([
            fetchCategories(),
            fetchNewProducts(true)
        ])

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

// Lifecycle
onMounted(() => {
    window.addEventListener('online', onOnline)
    nextTick(() => {
        setupInfiniteScroll()
        contentContainer.value = document.querySelector('.scroll-content')
    })
})

onUnmounted(() => {
    window.removeEventListener('online', onOnline)
    removeInfiniteScroll()
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

.no-more-products {
    margin-bottom: 80px;
}

.loading-more,
.no-more-products {
    text-align: center;
    padding: 15px;
}

.loading-more p,
.no-more-products p {
    color: #a4a4a4;
    font-size: 14px;
    font-weight: 500;
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

.search-box {
    position: sticky;
    position: -webkit-sticky;
    top: 20px;
    z-index: 999;
    border-radius: 10px;
    box-shadow: none !important;
    height: 52px;
    padding-left: 10px;
    margin-top: 16px;
    margin-bottom: 16px;
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

.category-chip.active {
    background-color: #5c3a21 !important;
    color: #fff !important;
    transition: 0.5s ease;
}

.v-icon--size-default {
    font-size: 25px !important;
}

.v-btn--size-default {
    --v-btn-height: 22px;
}

.image-section {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    height: 550px;
    overflow: auto;
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

.image-section-item {
    width: 20%;
    min-width: 140px;
    height: 220px;
    margin-bottom: 10px;
}

.image-section .product-card {
    margin: 5px;
    padding: 8px;
    cursor: pointer;
    background-color: #fff;
    border-radius: 10px;
    display: flex;
    align-items: center;
    flex-direction: column;
}

.image-section .product-card.active {
    color: #e8faff !important;
    background-color: #5c3a21 !important;
    transition: 0.5s ease;
}

.image-section .product-card.active .text-truncate,
.image-section .product-card.active strong {
    color: #e8faff !important;
}

.image-section .product-card.active .text-grey {
    color: #e3e3e3 !important;
}

.product-card-text {
    font-size: 14px;
}

.buttons-container {
    border-radius: 10px;
    box-shadow: none !important;
    margin-bottom: 16px;
    padding: 20px;
    position: relative;
    overflow: hidden;
}

.buttons-container h4 {
    line-height: 0.5cm;
    text-align: center;
    margin-bottom: 25px;
    color: #5c3a21;
}

.buttons-container h4 span {
    font-weight: 500;
    font-size: 13px;
    color: #adadad;
    font-style: italic;
}

.buttons-container .title-skeleton {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
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

.card-badge {
    position: absolute;
    top: 10px;
    right: -20px;
    background-color: #ff0000;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    padding: 3px 30px;
    transform: rotate(45deg);
    clip-path: polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%);
}

.text-truncate {
    width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
}

.content-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.no-background {
    background: none;
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

@media (max-width: 880px) {
    .image-section-item {
        width: 25%;
    }
}

@media (max-width: 620px) {
    .image-section-item {
        width: 50%;
    }
}
</style>