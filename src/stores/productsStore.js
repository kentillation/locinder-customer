import { defineStore } from 'pinia';
import { PRODUCTS_API } from '@/api/productsApi';

export const useProductsStore = defineStore('products', {
    state: () => ({
        products: [],
        base_categories: [],
        product_categories: [],
        isNew: null,
        lastFetchedCategory: null,
        lastFetchedMealType: null,
        lastFetchedShopId: null,
        lastFetchedBranchId: null,
        lastFetchedItemsPerPage: null,
        lastFetchedCategoriesShopId: null,
        pagination: null,
        loading: false,
        error: null
    }),

    actions: {
        async fetchAllProductsStore(request) {
            if (this.loading) return;

            this.loading = true;
            this.error = null;
            try {
                if (!PRODUCTS_API || typeof PRODUCTS_API.fetchAllProductsApi !== 'function') {
                    throw new Error('PRODUCTS_API service is not properly initialized');
                }
                const response = await PRODUCTS_API.fetchAllProductsApi(request);

                if (response && response.success === true) {
                    const isPaginatedRequest = request.page && request.page > 1;

                    if (isPaginatedRequest) {
                        this.products = [...this.products, ...response.data];
                    } else {
                        this.products = response.data;
                    }

                    this.pagination = response.pagination;
                    this.lastFetchedShopId = request.shop_id;
                    this.lastFetchedBranchId = request.branch_id;
                    this.lastFetchedCategory = request.category_label;
                    this.lastFetchedItemsPerPage = request.items_per_page;

                    return response;
                } else {
                    throw new Error('Failed to fetch products');
                }
            } catch (error) {
                console.error('Error in fetchAllProductsApi:', error);
                this.error = 'Failed to fetch products';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // You can remove fetchMoreProductsStore since fetchAllProductsStore handles both
        // Or keep it as a wrapper for clarity
        async fetchMoreProductsStore(request) {
            return await this.fetchAllProductsStore(request);
        },

        async fetchProductCategoriesStore(request) {
            // Don't fetch if already loading
            if (this.loading) return;

            this.loading = true;
            this.error = null;
            try {
                if (!PRODUCTS_API || typeof PRODUCTS_API.fetchProductCategoriesApi !== 'function') {
                    throw new Error('PRODUCTS_API service is not properly initialized');
                }
                const response = await PRODUCTS_API.fetchProductCategoriesApi(request);
                if (response && response.success === true) {
                    this.product_categories = response.data;
                    this.lastFetchedCategoriesShopId = request.shop_id;

                    return response;
                } else {
                    throw new Error('Failed to fetch product categories');
                }
            } catch (error) {
                console.error('[store] Failed to fetch product categories:', error);
                this.error = 'Failed to fetch product categories';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchNewProductsStore(request) {
            this.loading = true;
            this.error = null;
            try {
                if (!PRODUCTS_API || typeof PRODUCTS_API.fetchNewProductsApi !== 'function') {
                    throw new Error('PRODUCTS_API service is not properly initialized');
                }
                const response = await PRODUCTS_API.fetchNewProductsApi(request);

                if (response && response.success === true) {
                    const isPaginatedRequest = request.page && request.page > 1;

                    if (isPaginatedRequest) {
                        this.products = [...this.products, ...response.data];
                    } else {
                        this.products = response.data;
                    }

                    this.pagination = response.pagination;
                    this.isNew = request.is_new;

                    return response;
                } else {
                    throw new Error(response?.message || 'Failed to fetch new products');
                }
            } catch (error) {
                console.error('[store] Error in fetchNewProductsApi:', error);
                this.error = error.message || 'Failed to fetch new products';
                this.products = [];
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchCategoriesByNewProductStore(request) {
            this.loading = true;
            this.error = null;
            try {
                if (!PRODUCTS_API || typeof PRODUCTS_API.fetchCategoriesByNewProductApi !== 'function') {
                    throw new Error('PRODUCTS_API service is not properly initialized');
                }
                const response = await PRODUCTS_API.fetchCategoriesByNewProductApi(request);

                if (response && response.success === true) {
                    // For categories, we typically don't paginate, but if we do:
                    const isPaginatedRequest = request.page && request.page > 1;

                    if (isPaginatedRequest) {
                        this.product_categories = [...this.product_categories, ...response.data];
                    } else {
                        this.product_categories = response.data;
                    }

                    this.isNew = request.is_new;
                    this.pagination = response.pagination;

                    return response;
                } else {
                    throw new Error(response?.message || 'Failed to fetch categories');
                }
            } catch (error) {
                console.error('[store] Error in fetchCategoriesByNewProductApi:', error);
                this.error = error.message || 'Failed to fetch base categories';
                this.product_categories = [];
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchCategoriesByMealTypeStore(request) {
            this.loading = true;
            this.error = null;
            try {
                if (!PRODUCTS_API || typeof PRODUCTS_API.fetchCategoriesByMealTypeApi !== 'function') {
                    throw new Error('PRODUCTS_API service is not properly initialized');
                }
                const response = await PRODUCTS_API.fetchCategoriesByMealTypeApi(request);
                if (response && response.success === true) {
                    this.product_categories = response.data;
                    this.lastFetchedMealType = request;
                } else {
                    throw new Error(response?.message || 'Failed to fetch categories');
                }
                return response;
            } catch (error) {
                console.error('[store] Error in fetchCategoriesByMealTypeApi:', error);
                this.error = error.message || 'Failed to fetch base categories';
                this.product_categories = [];
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchProductsByMealTypeStore(request) {
            this.loading = true;
            this.error = null;
            try {
                if (!PRODUCTS_API || typeof PRODUCTS_API.fetchProductsByMealTypeApi !== 'function') {
                    throw new Error('PRODUCTS_API service is not properly initialized');
                }
                const response = await PRODUCTS_API.fetchProductsByMealTypeApi(request);
                if (response && response.success === true) {
                    const isPaginatedRequest = request.page && request.page > 1;

                    if (isPaginatedRequest) {
                        this.products = [...this.products, ...response.data];
                    } else {
                        this.products = response.data;
                    }

                    this.pagination = response.pagination;
                    this.lastFetchedMealType = request.meal_type;

                    return response;
                } else {
                    throw new Error(response?.message || 'Failed to fetch products');
                }
            } catch (error) {
                console.error('[store] Error in fetchProductsByMealTypeApi:', error);
                this.error = error.message || 'Failed to fetch products';
                this.products = [];
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchBaseCategoriesStore() {
            this.loading = true;
            this.error = null;

            try {
                if (!PRODUCTS_API || typeof PRODUCTS_API.fetchBaseCategoriesApi !== 'function') {
                    throw new Error('PRODUCTS_API service is not properly initialized');
                }
                const response = await PRODUCTS_API.fetchBaseCategoriesApi();
                if (response && response.success === true) {
                    this.base_categories = response.data;
                } else {
                    throw new Error('Failed to fetch base categories');
                }
            } catch (error) {
                console.error('[store] Failed to fetch base categories:', error);
                this.error = 'Failed to fetch base categories';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // Add a reset method to clear products when changing categories
        resetProducts() {
            this.products = [];
            this.pagination = null;
        }
    },

    getters: {
        getProducts: (state) => {
            return state.products.map(product => ({
                id: product.product_id,
                name: product.product_name,
            }));
        },

        getBaseCategories: (state) => {
            const parseMealType = (mealType) => {
                if (!mealType) return [];
                if (Array.isArray(mealType)) return mealType;
                if (typeof mealType === 'string') {
                    try {
                        const parsed = JSON.parse(mealType);
                        return Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        return [mealType];
                    }
                }
                return [];
            };

            return state.base_categories.map(category => ({
                id: category.product_base_category_id,
                label: category.product_base_category,
                meal_type: parseMealType(category.meal_type),
                subtitle: category.category_subtitle_hiligaynon,
                image: category.product_base_category,
            }));
        },

        getProductCategories: (state) => {
            const parseMealType = (mealType) => {
                if (!mealType) return [];
                if (Array.isArray(mealType)) return mealType;
                if (typeof mealType === 'string') {
                    try {
                        const parsed = JSON.parse(mealType);
                        return Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        return [mealType];
                    }
                }
                return [];
            };
            return state.product_categories.map(category => ({
                id: category.product_category_id,
                label: category.category_label,
                meal_type: parseMealType(category.meal_type),
            }));
        },

        getProductCategoryById: (state) => (id) => {
            return state.product_categories.find(category => category.category_id === id);
        }
    }
});