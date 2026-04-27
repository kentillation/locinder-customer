import { defineStore } from 'pinia';
import { SHOP_API } from '@/api/shopApi';

export const useShopStore = defineStore('shops', {
    state: () => ({
        shop_list: [],
        surprise_shop_list: [],
        lastCategory: null,
        lastMealType: null,
        lastTimeBetween: null,
        loading: false,
        error: null
    }),

    actions: {

        async fetchShopListStore(request, isForSurprise = false) {
            this.loading = true;
            this.error = null;
            try {
                if (!SHOP_API || typeof SHOP_API.fetchShopListApi !== 'function') {
                    throw new Error('SHOP_API service is not properly initialized');
                }
                const response = await SHOP_API.fetchShopListApi(request);
                if (response && response.success === true) {
                    if (isForSurprise) {
                        this.surprise_shop_list = response.data; // Store in surprise state
                    } else {
                        this.shop_list = response.data;
                        this.lastCategory = request.requested_category;
                        this.lastMealType = request.requested_meal_type;
                        this.lastTimeBetween = request.requested_time_between;
                    }
                } else {
                    throw new Error('Failed to fetch stores');
                }
            } catch (error) {
                console.error('Error in fetchShopListApi:', error);
                this.error = 'Failed to fetch stores';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchShopLocationStore(request) {
            try {
                if (!SHOP_API || typeof SHOP_API.fetchShopLocationApi !== 'function') {
                    throw new Error('SHOP_API service is not properly initialized');
                }
                const response = await SHOP_API.fetchShopLocationApi(request);
                if (response && response.success === true) {
                    return response
                } else {
                    throw new Error('Failed to fetch shop location');
                }
            } catch (error) {
                console.error('Error in fetchShopLocationApi:', error);
                this.error = 'Failed to fetch shop location';
                throw error;
            } finally {
                this.loading = false;
            }
        },

    },

    getters: {
        getShops: (state) => {
            return state.shop_list.map(shop => ({
                id: shop.shop_id,
                branch_id: shop.branch_id,
                name: shop.shop_name,
                type: shop.shop_type,
                address: shop.shop_address,
                open_at: shop.open_at,
                close_at: shop.close_at,
                lowest_price: shop.lowest_price,
                category_label: shop.category_label,
                product: shop.product_name,
                productId: shop.product_id,
            }));
        },
        getSurpriseShops: (state) => {
            return state.surprise_shop_list.map(shop => ({
                id: shop.shop_id,
                branch_id: shop.branch_id,
                name: shop.shop_name,
                type: shop.shop_type,
                address: shop.shop_address,
                open_at: shop.open_at,
                close_at: shop.close_at,
                lowest_price: shop.lowest_price,
                category_label: shop.category_label,
                product: shop.product_name,
                productId: shop.product_id,
            }));
        }
    }
});
