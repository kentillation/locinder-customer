<template>
    <transition name="slide-up">
        <div v-if="modelValue" class="custom-bottom-sheet" :style="{ height: sheetHeight + 'vh' }"
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
        <div v-if="modelValue" class="sheet-overlay" @click="closeSheet"></div>
    </transition>
</template>

<script setup>
/* eslint-disable */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router';
import { useProductsStore } from '@/stores/productsStore';
import { useToast } from 'vue-toastification'
import { HugeiconsIcon } from '@hugeicons/vue'
import { ArrowRight02Icon } from '@hugeicons/core-free-icons'

// Add props definition
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

// Add emits
const emit = defineEmits(['update:modelValue'])

const router = useRouter();
const productsStore = useProductsStore();
const toast = useToast();
const moreImage = ref(require('@/assets/img/png/food/Cutlery.png'));

const activeSheet = ref(null);
const surpriseSheet = ref(false);
const sheetHeight = ref(60);
const surprising = ref(false);
const startY = ref(0);
const startHeight = ref(60);
const SNAP_POINTS = {
    half: 60,
    full: 95,
};

// Watch for when sheet is opened to reset height
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        sheetHeight.value = 60; // Reset height when opening
    }
});

// Computed
const allCategories = computed(() => {
    return productsStore.getBaseCategories.slice(10);
});

const sortedCategories = computed(() => {
    const others = allCategories.value.find(c => c.label === 'Other');
    const rest = allCategories.value.filter(c => c.label !== 'Other');
    return others ? [...rest, others] : rest;
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

// Methods
const closeSheet = () => {
    emit('update:modelValue', false)
}

const startDrag = (e) => {
    if (surprising.value) return;

    if (props.modelValue) {
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
            closeSheet();
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
        
        // Close the sheet before navigating
        closeSheet();
        
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

</script>

<style scoped>
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
    touch-action: none;
    overflow: hidden;
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

.sheet-content {
    height: calc(100% - 20px);
    box-shadow: none !important;
}

.sheet-content .v-container {
    height: 100%;
    overflow-y: scroll !important;
    padding: 14px 14px 80px 14px !important;
}

.sheet-content h4 {
    line-height: 0.5cm;
    text-align: center;
    margin-bottom: 25px;
    color: #5c3a21;
}

.sheet-content h4 span {
    font-weight: 500;
    font-size: 13px;
    color: #adadad;
    font-style: italic;
}

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

.sheet-content .button-item {
    display: flex;
    align-items: center;
    flex-direction: column;
}

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

/* Reusable */
.new-product-btn {
    background-image:
        linear-gradient(to right, #c4926c, rgba(0, 0, 0, 0.2)),
        url('@/assets/img/jpg/features/new-product-bg.jpeg');
    background-size: cover, cover;
    background-position: center, center;
    background-repeat: no-repeat, no-repeat;
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

.new-product-btn span {
    font-weight: 600;
    color: #fff;
}

.content-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
</style>