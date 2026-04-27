import apiClient from '../axios';

export const SHOP_API = {
    ENDPOINTS: {
        FETCH_REQUESTED_SHOP_LIST: 'v1/customer/shops',
        FETCH_REQUESTED_SHOP_LOCATION: 'v1/customer/shops-location',
    },

    async fetchShopListApi(request) {
        try {
            const [requested_category, requested_meal_type, requested_time_between, items_per_page] = Array.isArray(request) 
            ? request 
            : [request.requested_category, request.requested_meal_type, request.requested_time_between, request.items_per_page];

            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_REQUESTED_SHOP_LIST}`,
                {
                    params: {
                        requested_category: requested_category,
                        requested_meal_type: requested_meal_type,
                        requested_time_between: requested_time_between,
                        items_per_page: items_per_page,
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data) {
                throw new Error('Invalid response from server');
            }

            return response.data;

        } catch (error) {
            console.error('[SHOP_API] Error fetching stores:', error);

            const enhancedError = new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to fetch stores'
            );

            enhancedError.response = error.response;
            enhancedError.success = error.response?.success;

            throw enhancedError;
        }
    },

    async fetchShopLocationApi(request) {
        try {

            const params = {
                shop_id: request.shop_id,
                branch_id: request.branch_id,
            };

            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_REQUESTED_SHOP_LOCATION}`,
                {
                    params: params,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data) {
                throw new Error('Invalid response from server');
            }

            return response.data;

        } catch (error) {
            console.error('[SHOP_API] Error fetching stores:', error);

            const enhancedError = new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to fetch stores'
            );

            enhancedError.response = error.response;
            enhancedError.success = error.response?.success;

            throw enhancedError;
        }
    },

};