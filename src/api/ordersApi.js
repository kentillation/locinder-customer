import apiClient from '../axios';

export const ORDERS_API = {
    ENDPOINTS: {
        FETCH_ALL_ORDERS: '/admin/orders',
        FETCH_ORDERS_REPORT: '/admin/orders-report',
        FETCH_ORDERS_COUNT: '/admin/total-orders'
    },

    /**
     * Orders Information
     * @param {string|number} branchId - ID of the branch to fetch orders for
     * @returns {Promise<Object>} Orders data for the branch
     * @throws {Error} Enhanced error with server response details
     */

    async fetchAllOrdersApi({ branchId, page = 1, itemsPerPage = 10, search = '' }) {
        try {
            const authToken = localStorage.getItem('auth_token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }

            const params = {
                branch_id: branchId,
                page,
                itemsPerPage,
            };

            if (search) {
                params.search = search;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                params
            };

            const response = await apiClient.get(this.ENDPOINTS.FETCH_ALL_ORDERS, config);

            return {
                success: response.data?.success ?? true,
                data: response.data?.data ?? response.data ?? [],
                total: response.data?.total ?? (response.data?.data?.length ?? 0),
                message: response.data?.message ?? 'Success'
            };

        } catch (error) {
            console.error('[ORDERS_API] Error fetching orders:', error);
            throw error;
        }
    },

    async fetchOrdersReportApi({ branchId, page = 1, itemsPerPage = 10, dateFilter = 1 }) {
        try {
            const authToken = localStorage.getItem('auth_token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }

            const params = {
                branch_id: branchId,
                page,
                itemsPerPage,
                date_filter: dateFilter
            };

            if (dateFilter) {
                params.date_filter = dateFilter;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                params
            };

            const response = await apiClient.get(this.ENDPOINTS.FETCH_ORDERS_REPORT, config);

            return {
                success: response.data?.success ?? true,
                data: response.data?.data ?? response.data ?? [],
                total: response.data?.total ?? (response.data?.data?.length ?? 0),
                message: response.data?.message ?? 'Success'
            };

        } catch (error) {
            console.error('[ORDERS_API] Error fetching orders report:', error);
            throw error;
        }
    },

    async fetchOrdersCountApi(branchId) {
        try {
            const authToken = localStorage.getItem('auth_token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }

            const params = {
                branch_id: branchId
            };

            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                params
            };

            const response = await apiClient.get(this.ENDPOINTS.FETCH_ORDERS_COUNT, config);

            return {
                success: response.data?.success ?? true,
                data: response.data?.data ?? response.data ?? [],
                total: response.data?.total ?? (response.data?.data?.length ?? 0),
                message: response.data?.message ?? 'Success'
            };

        } catch (error) {
            console.error('[ORDERS_API] Error fetching orders count:', error);
            throw error;
        }
    },

};