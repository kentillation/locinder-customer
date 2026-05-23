<template>
    <v-container class="pull-to-refresh-container">
        <!-- Pull to Refresh Progress Indicator (Only visible in Shop Products tab) -->
        <div class="refresh-progress" :style="{
            transform: `translateY(${pullProgress}px)`,
            opacity: pullProgress > 0 && activeTab === 'ourproducts' ? 1 : 0
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
            <div class="headline content-between" :style="{ background : accentColor !== '' ? accentColor : '#a86d00'}">
                <v-btn size="small" style="background: transparent !important;" icon>
                    <HugeiconsIcon @click="goBack" :icon="ArrowLeft02Icon" size="20" />
                </v-btn>
                <span class="d-flex align-center flex-column">
                    <h3 class="text-wrap">{{ shop_name }}</h3>
                    <span>{{ shop_type }}</span>
                </span>
                <v-avatar color="#5c3a21" size="40" class="ml-1 mr-2 d-flex align-center justify-center">
                    <template v-if="getStoreImageUrl">
                        <img :src="getStoreImageUrl" width="50" alt="Avatar" />
                    </template>

                    <template v-else>
                        <span style="color: white; font-weight: bold; font-size: 20px;">
                            {{ (shop_name || '?').charAt(0).toUpperCase() }}
                        </span>
                    </template>
                </v-avatar>
            </div>

            <v-tabs v-model="activeTab" align-tabs="center" color="#5c3a21" class="mt-3" show-arrows>
                <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value" class="this-tab"
                    :class="{ 'active-tab': activeTab === tab.value }"
                    @click="tab.clickHandler ? tab.clickHandler() : null" size="small">
                    <HugeiconsIcon
                        :icon="tab.value === 'ourproducts' ? SpoonAndForkIcon : tab.value === 'map' ? MapsLocation01Icon : InformationCircleIcon"
                        style="color: #5c3a21;" size="20" />
                    &nbsp;{{ tab.label }}
                </v-tab>
            </v-tabs>

            <v-tabs-window v-model="activeTab">
                <transition name="slide-x-transition" mode="out-in">
                    <div :key="activeTab">
                        <!-- Shop Products -->
                        <v-tabs-window-item value="ourproducts">
                            <!-- Search Products -->
                            <v-card class="search-box">
                                <v-text-field v-model="searchProduct" @click="noCategory"
                                    placeholder="Search product...">
                                    <template v-slot:prepend-inner>
                                        <HugeiconsIcon :icon="Search01Icon" size="20" class="mb-1 mr-1" />
                                    </template>
                                    <template v-slot:append-inner>
                                        <HugeiconsIcon v-if="searchProduct" :icon="CancelCircleIcon"
                                            @click="clearSearch" size="20" class="mr-2" />
                                    </template>
                                </v-text-field>
                            </v-card>

                            <!-- Categories Skeleton -->
                            <template v-if="isCategoryLoading || isRefreshing">
                                <v-slide-group>
                                    <v-slide-group-item>
                                        <v-skeleton-loader v-for="c in 8" :key="c" type="text" width="100"
                                            class="no-background"></v-skeleton-loader>
                                    </v-slide-group-item>
                                </v-slide-group>
                            </template>

                            <!-- Categories -->
                            <template v-else>
                                <v-slide-group class="mb-2 ms-1">
                                    <v-slide-group-item>
                                        <v-chip @click="reloadProductsAndCategories"
                                            :color="!requested_category ? '#5c3a21' : '#fff'"
                                            :class="{ 'd-none': productsStore.getProductCategories.length === 0 }"
                                            variant="flat" class="me-1" style="font-weight: 500;">
                                            All
                                        </v-chip>
                                        <v-chip v-for="(category) in sortedCategories" :key="category.label"
                                            @click="handleCategorySelect(category)"
                                            :class="{ active: requested_category === category.label }" :ripple="false"
                                            variant="outlined" class="me-1 category-chip" style="font-weight: 500;">
                                            {{ category.label }}
                                        </v-chip>
                                    </v-slide-group-item>
                                </v-slide-group>
                            </template>

                            <!-- Products Skeleton -->
                            <template v-if="(isProductsLoading && productsStore.products.length === 0) || isRefreshing">
                                <div class="image-section my-4">
                                    <div v-for="p in 8" :key="p" class="image-section-item" style="height: 210px;">
                                        <v-card class="d-flex flex-column align-content-start"
                                            style="border-radius: 10px; margin: 5px; box-shadow: none; min-width: 150px; height: 210px;">
                                            <v-skeleton-loader type="text, text, image, text"
                                                class="px-4"></v-skeleton-loader>
                                        </v-card>
                                    </div>
                                </div>
                            </template>

                            <!-- Products -->
                            <template v-else>
                                <div class="image-section my-4">
                                    <template v-if="productsStore.products.length === 0 && !isProductsLoading">
                                        <v-row>
                                            <v-col cols="12">
                                                <v-card class="no-found">
                                                    <div class="d-flex align-center flex-column">
                                                        <span><v-img :src="nofastfoodImage" width="130"></v-img></span>
                                                        <p style="font-weight: 500; color: #ab2323;">No available
                                                            products found</p>
                                                    </div>
                                                </v-card>
                                            </v-col>
                                        </v-row>
                                    </template>

                                    <template v-else>
                                        <div v-for="product in filteredProducts" :key="product.product_id"
                                            @click="selectProduct(product)" class="image-section-item">
                                            <div class="product-card"
                                                :class="{ active: selectedCard === product.product_id }">
                                                <span :class="{ 'product-card-badge': product.is_new === 1 }">{{
                                                    product.is_new === 1 ? 'New' : '' }}</span>
                                                <p style="font-weight: 500;" class="product-card-text text-truncate">
                                                    {{ product.product_name }}
                                                </p>
                                                <p style="font-weight: 500;" class="product-card-text text-grey mb-2">
                                                    {{ product.size_label }}
                                                </p>
                                                <v-img :src="getProductImageUrl(product)" loading="lazy"
                                                    class="product-image">
                                                    <template v-slot:placeholder>
                                                        <v-img :src="productImages[product.category_label]"
                                                            class="product-image"></v-img>
                                                    </template>
                                                </v-img>
                                                <p class="mt-2">
                                                    <strong>₱{{ product.base_price }}</strong>
                                                </p>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </template>

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
                        </v-tabs-window-item>

                        <!-- Map - With Permission Handling -->
                        <v-tabs-window-item value="map">
                            <div class="map-container">
                                <LocinderGPS ref="locinderGPSRef" :name-on-map="branchNameOnMap"
                                    :latitude-on-map="latitudeOnMap" :longitude-on-map="longitudeOnMap"
                                    :address-on-map="addressOnMap" />
                            </div>
                        </v-tabs-window-item>

                        <v-tabs-window-item value="info">
                            <div class="shop-indication">
                                <div>
                                    <div class="d-flex align-center">
                                        <HugeiconsIcon :icon="Store01Icon" size="20" />
                                        <p class="label">Branch name:</p>
                                    </div>
                                    <p class="ml-6">{{ branchNameOnMap }} Branch</p>
                                </div>
                                <div class="mt-3">
                                    <div class="d-flex align-center">
                                        <HugeiconsIcon :icon="SmartPhone04Icon" size="20" />
                                        <p class="label">Branch contact:</p>
                                    </div>
                                    <p class="ml-6">{{ contactOnMap }}</p>
                                </div>
                                <div class="mt-3">
                                    <div class="d-flex align-center">
                                        <HugeiconsIcon :icon="LocationIcon" size="20" />
                                        <p class="label">Branch address:</p>
                                    </div>
                                    <p class="ml-6">{{ shop_address }}</p>
                                </div>
                                <div class="mt-3">
                                    <div class="d-flex align-center">
                                        <HugeiconsIcon :icon="DoorOpenIcon" size="20" />
                                        <p class="label">Store hours:</p>
                                    </div>
                                    <p class="ml-6">{{ formattedOpenTime }} – {{ formattedCloseTime }}</p>
                                </div>
                            </div>
                        </v-tabs-window-item>
                    </div>
                </transition>
            </v-tabs-window>
        </div>

        <transition name="slide-up">
            <div v-if="productSheet" class="custom-bottom-sheet" :style="{ height: sheetHeight + 'vh' }"
                @touchstart="startDrag" @touchmove="onDrag" @touchend="endDrag">
                <div class="drag-handle mt-3"></div>
                <v-card class="sheet-content">
                    <v-container>
                        <v-card class="flex-center-column">
                            <h4 class="mb-2">{{ selectedProductName }}</h4>
                            <v-img :src="selectedProductImage || productImages[selectedProductImageFallBack]"
                                class="product-image"
                                style="width: 150px !important; height: 150px !important;"></v-img>
                            <h5 class="mt-2 text-grey">{{ selectedProductSize }}</h5>
                            <h4 class="mt-2">₱{{ selectedProductPrice }}</h4>
                        </v-card>
                    </v-container>
                </v-card>
            </div>
        </transition>

        <!-- Also add an overlay -->
        <transition name="fade">
            <div v-if="productSheet" class="sheet-overlay" @click="productSheet = false"></div>
        </transition>

    </v-container>
</template>

<script setup>
import { HugeiconsIcon } from '@hugeicons/vue'
import { Loading03Icon, ArrowLeft02Icon, SpoonAndForkIcon, MapsLocation01Icon, 
        Store01Icon, InformationCircleIcon, LocationIcon, SmartPhone04Icon, 
        DoorOpenIcon, Search01Icon, CancelCircleIcon } from '@hugeicons/core-free-icons'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useShopStore } from '@/stores/shopStore'
import { useProductsStore } from '@/stores/productsStore'
import { useToast } from 'vue-toastification'
import LocinderGPS from '@/components/LocinderGPS.vue'

// Router & Store
const router = useRouter()
const route = useRoute()
const shopStore = useShopStore()
const productsStore = useProductsStore()
const toast = useToast()

// State
const isOnline = ref(navigator.onLine)

// Shop
const shop_id = ref(null)
const branch_id = ref(null)
const accentColor = ref('')
const shop_name = ref('')
const shop_type = ref('')
const shop_address = ref('')
const open_at = ref('')
const close_at = ref('')
const itemsPerPage = ref(20)
const currentPage = ref(1)
const branchNameOnMap = ref('')
const latitudeOnMap = ref(0)
const longitudeOnMap = ref(0)
const addressOnMap = ref('')
const contactOnMap = ref('')
const shopThumbnail = ref('')

// Products
const isProductsLoading = ref(false)
const loadingMore = ref(false)
const hasMoreProducts = ref(true)
const selectedCard = ref(null)
const searchProduct = ref('')
const productSheet = ref(false)
const sheetHeight = ref(60)
const startY = ref(0)
const startHeight = ref(45)
const SNAP_POINTS = {
    half: 60,
    full: 95
}
const selectedProductImage = ref(null)
const selectedProductImageFallBack = ref(null)
const selectedProductName = ref(null)
const selectedProductSize = ref(null)
const selectedProductPrice = ref(null)

// Categories
const categories = ref([])
const category_label = ref(null)
const isCategoryLoading = ref(false)
const requested_category = ref(null)

// Images
const nofastfoodImage = new URL('@/assets/img/png/food/No Fast Food.png', import.meta.url).href

// Scroll handling
const contentContainer = ref(null)
const scrollTimeout = ref(null)
const isInitialized = ref(false)
const isFetching = ref(false)

// Pull to refresh properties
const pullZone = ref(null);
const isTouchingPullZone = ref(false)
const isRefreshing = ref(false)
const pullProgress = ref(0)
const touchStartY = ref(0)
const isPulling = ref(false)
const rotationAngle = ref(0)
const rotationInterval = ref(null)
const PULL_THRESHOLD = 200
const showProgressThreshold = 100
const shouldPreventDefault = ref(false)

// Location Permission Properties
const locinderGPSRef = ref(null)
const activeTab = ref('ourproducts')

// Computed
const tabs = computed(() => {
    return [
        { label: 'Products', value: 'ourproducts' },
        { label: 'Map', value: 'map' },
        { label: 'Info', value: 'info' },
    ]
})

const allCategories = computed(() => {
    return productsStore.getProductCategories
})

const sortedCategories = computed(() => {
    const others = allCategories.value.find(c => c.label === 'Other')
    const rest = allCategories.value.filter(c => c.label !== 'Other')
    return others ? [...rest, others] : rest
})

const getStoreImageUrl = computed(() => {
    if (
        shopThumbnail.value &&
        shopThumbnail.value !== 'null' &&
        shopThumbnail.value !== ''
    ) {
        return shopThumbnail.value
    }
    return shopThumbnail.value
})

const formattedOpenTime = computed(() => {
    return formatTime(open_at.value)
})

const formattedCloseTime = computed(() => {
    return formatTime(close_at.value)
})

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

        if (distanceToBottom <= 200 && !loadingMore.value && hasMoreProducts.value && !isProductsLoading.value && !isFetching.value && !isRefreshing.value && activeTab.value === 'ourproducts') {
            loadMoreProducts()
        }
    }, 100)
}

const initData = async () => {
    if (isInitialized.value) return

    isInitialized.value = true

    shop_id.value = route.query.shopId
    branch_id.value = route.query.branchId
    shop_name.value = route.query.shopName
    shop_type.value = route.query.shopType
    shop_address.value = route.query.shopAddress
    open_at.value = route.query.openAt
    close_at.value = route.query.closeAt

    const requestedCategory = route.query.requestedCategory

    requested_category.value = null
    selectedCard.value = null
    searchProduct.value = ''
    currentPage.value = 1
    hasMoreProducts.value = true
    productsStore.products = []
    category_label.value = null

    await fetchShopLocation()
    await fetchProductCategories()

    if (requestedCategory) {
        const category = productsStore.getProductCategories.find(
            c => c.label === requestedCategory
        )
        if (category) {
            await handleCategorySelect(category, true)
        } else {
            await fetchProducts()
        }
    } else {
        await fetchProducts()
    }
}

const getProductImageUrl = (product) => {
    if (product.thumbnail_url && product.thumbnail_url !== 'null' && product.thumbnail_url !== '') {
        return product.thumbnail_url
    }
    return productImages.value[product.category_label]
}

const loadMoreProducts = async () => {
    if (loadingMore.value || !hasMoreProducts.value || isProductsLoading.value || isFetching.value || isRefreshing.value) {
        return
    }

    if (searchProduct.value && searchProduct.value.trim() !== '') {
        return
    }

    const nextPage = currentPage.value + 1

    isFetching.value = true
    loadingMore.value = true

    try {
        const request = {
            shop_id: shop_id.value,
            branch_id: branch_id.value,
            category_label: category_label.value,
            items_per_page: itemsPerPage.value,
            page: nextPage
        }

        const response = await productsStore.fetchAllProductsStore(request)

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
        hasMoreProducts.value = false
    } finally {
        loadingMore.value = false
        isFetching.value = false
    }
}

const fetchProducts = async (forceRefresh = false) => {
    if ((isProductsLoading.value || isFetching.value) && !forceRefresh) return

    isFetching.value = true
    isProductsLoading.value = true

    try {
        const request = {
            shop_id: shop_id.value,
            branch_id: branch_id.value,
            category_label: category_label.value,
            items_per_page: itemsPerPage.value,
            page: 1
        }

        const response = await productsStore.fetchAllProductsStore(request)

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
    } finally {
        isProductsLoading.value = false
        isFetching.value = false
    }
}

const handleCategorySelect = async (category) => {
    selectedCard.value = null
    const selectedCategory = category.label

    if (!category || !selectedCategory) {
        toast.error('Invalid category selected')
        return
    }

    currentPage.value = 1
    hasMoreProducts.value = true
    category_label.value = selectedCategory

    productsStore.resetProducts()

    isProductsLoading.value = true

    try {
        const request = {
            shop_id: shop_id.value,
            branch_id: branch_id.value,
            category_label: selectedCategory,
            items_per_page: itemsPerPage.value,
            page: 1
        }

        const response = await productsStore.fetchAllProductsStore(request)
        requested_category.value = selectedCategory
        searchProduct.value = ''

        if (response && response.pagination) {
            hasMoreProducts.value = response.pagination.has_more === true
            currentPage.value = response.pagination.current_page
        }
    } catch (error) {
        console.error('Error fetching products for category:', error)
    } finally {
        isProductsLoading.value = false
    }
}

const reloadProductsAndCategories = async () => {
    requested_category.value = null
    selectedCard.value = null
    category_label.value = null
    searchProduct.value = ''
    currentPage.value = 1
    hasMoreProducts.value = true

    productsStore.resetProducts()

    await fetchProducts()
    await fetchShopLocation()
}

const fetchProductCategories = async (forceRefresh = false) => {
    if (!forceRefresh && productsStore.lastFetchedCategoriesShopId === shop_id.value &&
        productsStore.product_categories.length > 0) {
        return
    }

    isCategoryLoading.value = true

    try {
        const request = {
            shop_id: shop_id.value,
            items_per_page: itemsPerPage.value,
        }

        await productsStore.fetchProductCategoriesStore(request)
        categories.value = productsStore.product_categories
    } catch (error) {
        console.error('Error fetching categories:', error)
    } finally {
        isCategoryLoading.value = false
    }
}

const noCategory = () => {
    requested_category.value = null
    selectedCard.value = null
}

const clearSearch = () => {
    searchProduct.value = null
}

const selectProduct = (product) => {
    if (!product) {
        console.error("Product data is missing!", product)
        toast.error('Product data is missing')
        return
    }

    selectedCard.value = product.product_id
    productSheet.value = true
    sheetHeight.value = 60
    selectedProductImageFallBack.value = product.category_label
    selectedProductImage.value = product.thumbnail_url
    selectedProductName.value = product.product_name
    selectedProductSize.value = product.size_label
    selectedProductPrice.value = product.base_price

    setTimeout(() => {
        selectedCard.value = null
    }, 2000)
}

const startDrag = (e) => {
    startY.value = e.touches[0].clientY
    startHeight.value = sheetHeight.value
}

const onDrag = (e) => {
    const currentY = e.touches[0].clientY
    const delta = startY.value - currentY
    let newHeight = startHeight.value + delta / 6
    newHeight = Math.max(0, Math.min(95, newHeight))
    sheetHeight.value = newHeight
}

const endDrag = () => {
    const shthght = sheetHeight.value
    if (shthght < 10) {
        productSheet.value = false
        sheetHeight.value = SNAP_POINTS.half
        return
    }
    if (shthght < 60) {
        sheetHeight.value = SNAP_POINTS.half
    } else {
        sheetHeight.value = SNAP_POINTS.full
    }
}

const formatTime = (time) => {
    if (!time) return ''

    const [hours, minutes] = time.split(':')
    let h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'

    h = h % 12
    h = h ? h : 12

    return `${String(h).padStart(2, '0')}:${minutes} ${ampm}`
}

// Pull to Refresh Methods
const handleTouchStart = (e) => {
    if (activeTab.value !== 'ourproducts') return

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
    if (!isPulling.value || isRefreshing.value || activeTab.value !== 'ourproducts' || !isTouchingPullZone.value) return

    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.value
    const scrollElement = contentContainer.value;

    if (diff > 0 && scrollElement && scrollElement.scrollTop === 0) {
        if (e.cancelable && shouldPreventDefault.value) {
            e.preventDefault()
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
        isPulling.value = false;
        isTouchingPullZone.value = false;
        shouldPreventDefault.value = false;
        pullProgress.value = 0;
        rotationAngle.value = 0;
    }
}

const handleTouchEnd = async () => {
    if (!isPulling.value || isRefreshing.value || activeTab.value !== 'ourproducts') {
        isPulling.value = false;
        isTouchingPullZone.value = false;
        shouldPreventDefault.value = false;
        return;
    }

    isPulling.value = false;
    isTouchingPullZone.value = false;
    shouldPreventDefault.value = false;

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
        await Promise.all([
            fetchProductCategories(true),
            fetchProducts(true),
            fetchShopLocation()
        ])

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

const fetchShopLocation = async () => {
    try {
        const request = {
            shop_id: Number(shop_id.value),
            branch_id: Number(branch_id.value),
        }
        const response = await shopStore.fetchShopLocationStore(request)

        const locationData = response.data[0] || {}

        branchNameOnMap.value = locationData.branch_name || ''
        latitudeOnMap.value = Number(locationData.branch_latitude) || ''
        longitudeOnMap.value = Number(locationData.branch_longitude) || ''
        addressOnMap.value = locationData.branch_address || ''
        contactOnMap.value = locationData.branch_contact_number || ''
        accentColor.value = locationData.shop_accent_color || ''
        shopThumbnail.value = locationData.thumbnail_url || ''

    } catch (error) {
        console.error('Error fetching shop location:', error)
    }
}

// Watchers
watch(() => route.query, (newQuery, oldQuery) => {
    if (newQuery.shopId !== oldQuery?.shopId) {
        isInitialized.value = false // Reset initialization flag
        initData()
    }
}, { immediate: true })

watch(activeTab, (newTab, oldTab) => {
    if (newTab !== 'ourproducts') {
        pullProgress.value = 0
        rotationAngle.value = 0
        isPulling.value = false
    }

    if (newTab === 'map' && oldTab !== 'map') {
        nextTick(() => {
            // Map tab handling
        })
    }
})

// Lifecycle
onMounted(() => {
    window.addEventListener('online', onOnline)

    nextTick(() => {
        contentContainer.value = document.querySelector('.scroll-content')

        if (contentContainer.value) {
            // Add touch listeners manually with passive: false
            contentContainer.value.addEventListener('touchstart', handleTouchStart, { passive: false })
            contentContainer.value.addEventListener('touchmove', handleTouchMove, { passive: false })
            contentContainer.value.addEventListener('touchend', handleTouchEnd)
            contentContainer.value.addEventListener('touchcancel', handleTouchEnd)
        }

        setupInfiniteScroll()
    })
})

onUnmounted(() => {
    window.removeEventListener('online', onOnline)
    removeInfiniteScroll()

    if (contentContainer.value) {
        contentContainer.value.removeEventListener('touchstart', handleTouchStart)
        contentContainer.value.removeEventListener('touchmove', handleTouchMove)
        contentContainer.value.removeEventListener('touchend', handleTouchEnd)
        contentContainer.value.removeEventListener('touchcancel', handleTouchEnd)
    }

    if (rotationInterval.value) {
        clearInterval(rotationInterval.value)
    }
})
</script>

<style scoped>
.v-container {
    padding: 0 !important;
}

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
    /* ADD CUSTOM BACKGROUND */
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

/* Map Container Styles */
.map-container {
    width: 100%;
    height: 100%;
    min-height: 500px;
    position: relative;
    touch-action: pan-x pan-y;
}

.settings-link {
    color: #5c3a21;
    text-decoration: underline;
    cursor: pointer;
    font-weight: 500;
}

.gap-3 {
    gap: 12px;
}

.no-more-products {
    margin-bottom: 40px;
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

.pull-zone {
    position: absolute;
    top: 50px;
    left: 0;
    right: 0;
    height: 1px;
    pointer-events: none;
    z-index: 1;
}

/* Keep all your existing styles below */
.headline {
    margin-top: 16px;
    padding: 7px 4px 7px 2px;
    border-radius: 10px;
}

.headline div {
    display: flex;
    align-items: center;
}

.headline .v-btn {
    box-shadow: none;
}

.headline svg {
    color: #f8f8f8 !important;
}

.headline h3 {
    color: #f8f8f8;
    font-weight: 500;
}

.headline span {
    color: #a4a4a4;
    font-weight: 500;
    font-size: 14px;
}

/* Remove the default Vuetify tab underline */
:deep(.v-tabs-slider-wrapper) {
    display: none !important;
}

:deep(.v-tabs-slider) {
    background-color: transparent !important;
}

.this-tab {
    text-transform: none !important;
    letter-spacing: normal !important;
    opacity: 0.7;
    transition: all 0.3s ease;
    font-size: 13px;
}

.active-tab {
    border-radius: 10px !important;
    background-color: #a8460056;
    color: #5c3a21 !important;
    padding: 2px 8px 2px 8px;
    opacity: 1;
}

:deep(.v-tab.v-tab.v-btn) {
    height: 40px;
    min-width: 0;
}

.shop-indication {
    margin: 15px 0 15px;
    display: flex;
    flex-direction: column;
}

.shop-indication svg,
.shop-indication p.label,
.shop-indication p {
    font-weight: 500;
    font-size: 14px;
}

.shop-indication p.label {
    color: #747474;
    margin-left: 5px;
}

.shop-indication p {
    color: #5c3a21;
}

.search-box {
    position: sticky !important;
    position: -webkit-sticky !important;
    top: 0 !important;
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

.category-chip.active {
    background-color: #5c3a21 !important;
    color: #fff !important;
    transition: 0.5s ease;
}

.v-chip--variant-outlined {
    border: thin solid rgb(213 213 213 / 87%) !important;
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
    overflow: auto;
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

.sheet-content .v-container {
    height: 100%;
    overflow-y: auto;
}

.sheet-content .v-card {
    box-shadow: none;
    background-color: #fcf0e0;
    border-radius: 10px;
    padding: 20px 0 20px;
}

.sheet-content h4 {
    line-height: 0.5cm;
    text-align: center;
    color: #5c3a21;
}

.drag-handle {
    width: 60px;
    height: 5px;
    background: #adadad;
    border-radius: 10px;
    margin: 10px auto;
}

.image-section-item {
    width: 20%;
    min-width: 140px;
    height: 180px;
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
    height: 180px;
    position: relative;
    overflow: hidden;
}

.product-image {
    width: 80px !important;
    height: 80px !important;
    min-width: 80px;
    min-height: 80px;
    border-radius: 10px;
    object-fit: cover !important;
    object-position: center !important;
    display: block;
    margin: 0 auto;
}

:deep(img.v-img__img--contain) {
    object-fit: cover !important;
}

.product-card-badge {
    position: absolute;
    top: 5px;
    right: -25px;
    background-color: #ff0000;
    color: #fff;
    font-size: 10px;
    font-weight: 500;
    padding: 1px 25px;
    transform: rotate(45deg);
    clip-path: polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%);
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

.text-truncate {
    width: 138px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
}

:deep(.v-skeleton-loader__image) {
    height: 100px;
    border-radius: 10px;
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

@media (min-width: 1280px) {
    .image-section-item {
        width: 25%;
    }

    .text-truncate {
        width: 170px;
    }
}

@media (max-width: 880px) {
    .image-section-item {
        width: 25%;
    }
}

@media (max-width: 767px) {
    .image-section-item {
        width: 33%;
    }

    .text-truncate {
        width: 170px;
    }
}

@media (max-width: 621px) {
    .image-section-item {
        width: 50%;
    }

    .text-truncate {
        width: 170px;
    }
}

@media (max-width: 421px) {
    .image-section-item {
        width: 50%;
    }

    .text-truncate {
        width: 138px;
    }
}

@media (max-width: 360px) {
    .image-section-item {
        width: 100%;
    }

    .text-truncate {
        width: 170px;
    }
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
</style>