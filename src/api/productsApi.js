import apiClient from '../axios';

export const PRODUCTS_API = {
    ENDPOINTS: {
        FETCH_ALL_PRODUCTS: 'v1/customer/products',
        FETCH_NEW_PRODUCTS: 'v1/customer/new-products',
        FETCH_CATEGORIES_BY_NEW_PRODUCTS: 'v1/customer/categories-by-new-products',
        FETCH_PRODUCTS_BY_MEAL_TYPE: 'v1/customer/products-by-meal-type',
        FETCH_CATEGORIES_BY_MEAL_TYPE: 'v1/customer/categories-by-meal-type',
        FETCH_PRODUCT_CATEGORIES: 'v1/customer/product-category',
        FETCH_BASE_CATEGORIES: 'v1/customer/product-base-category',
    },

    async fetchAllProductsApi(request) {
        try {
            const params = {
                shop_id: request.shop_id,
                branch_id: request.branch_id,
                items_per_page: request.items_per_page,
            };

            if (request.category_label) {
                params.category_label = request.category_label;
            }

            if (request.page) {
                params.page = request.page;
            }

            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_ALL_PRODUCTS}`,
                {
                    params: params,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('[PRODUCTS_API] Error fetching products:', error);
            const enhancedError = new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to fetch products'
            );
            enhancedError.response = error.response;
            enhancedError.success = error.response?.success;
            throw enhancedError;
        }
    },

    async fetchNewProductsApi(request) {
        try {
            const params = {
                is_new: request.is_new,
                items_per_page: request.items_per_page,
            };

            if (request.page) {
                params.page = request.page;
            }

            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_NEW_PRODUCTS}`,
                {
                    params: params,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            return response.data;
        } catch (error) {
            console.error('Error fetching products by meal type:', error);
            throw error;
        }
    },

    async fetchCategoriesByNewProductApi(request) {
        try {
            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_CATEGORIES_BY_NEW_PRODUCTS}`,
                {
                    params: {
                        is_new: request.is_new
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            return response.data;
        } catch (error) {
            console.error('Error fetching categories by new product:', error);
            throw error;
        }
    },

    async fetchProductsByMealTypeApi(request) {
        try {
            const params = {
                meal_type: request.meal_type,
                items_per_page: request.items_per_page,
            };

            if (request.category_label) {
                params.category_label = request.category_label;
            }

            if (request.page) {
                params.page = request.page;
            }

            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_PRODUCTS_BY_MEAL_TYPE}`,
                {
                    params: params,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;

        } catch (error) {
            console.error('Error fetching products by meal type:', error);
            throw error;
        }
    },

    async fetchCategoriesByMealTypeApi(request) {
        try {
            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_CATEGORIES_BY_MEAL_TYPE}`,
                {
                    params: {
                        meal_type: request.meal_type,
                        items_per_page: request.items_per_page
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            return response.data;
        } catch (error) {
            console.error('Error fetching categories by meal type:', error);
            throw error;
        }
    },

    async fetchProductCategoriesApi(request) {
        try {
            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_PRODUCT_CATEGORIES}`,
                {
                    params: {
                        shop_id: request.shop_id,
                        items_per_page: request.items_per_page
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('[API] Error fetching stocks:', error);
            const enhancedError = new Error('Failed to fetch categpries');
            throw enhancedError;
        }
    },

    async fetchBaseCategoriesApi() {
        try {
            const authToken = localStorage.getItem('auth_token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }

            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_BASE_CATEGORIES}`,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('[PRODUCTS_API] Error fetching base categories:', error);
            const enhancedError = new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to fetching base categories'
            );
            enhancedError.response = error.response;
            enhancedError.success = error.response?.success;
            throw enhancedError;
        }
    },
};