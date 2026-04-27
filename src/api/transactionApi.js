import apiClient from '../axios';

export const TRANSACTION_API = {
    ENDPOINTS: {
        FETCH_CURRENT_ORDERS: '/cashier/current-orders',
        FETCH_ORDER_STATUS: '/open/order-status',
        CHANGE_STATUS: '/cashier/update-order-status',
        SUBMIT: '/cashier/submit-transaction',
        FETCH_ORDER_DETAILS: '/open/order-details',
        FETCH_ORDER_TEMP: '/open/order-details-temp',
        FETCH_QR_TEMP: '/open/get-qr-temp',
        FETCH_VOID_ORDERS: '/open/void-orders',
        SAVE_VOID_ORDER: '/cashier/save-void',

        // FETCH_STATION_STATUS: '/kitchen/station-status',
        // CHANGE_KITCHEN_STATUS: '/kitchen/update-kitchen-product-status',
        // FETCH_QR: '/open/get-qr',
        // FETCH_KITCHEN_PRODUCT: '/open/kitchen-product-details',
    },
    
    // ==================== WEB SOCKET METHODS ====================
    // subscribeToStatusUpdates(stationStatusId, callback) {
    //     echo.private(`update-order-status.${stationStatusId}`)
    //         .listen('.status.updated', callback) // Match the event class name in Laravel
    //     return () => echo.leave('update-order-status')
    // },

    async fetchAllCurrentOrdersApi() {
        try {
            const authToken = localStorage.getItem('auth_token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
            };
            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_CURRENT_ORDERS}`,
                config
            );

            if (!response.data) {
                throw new Error('Invalid response from server');
            }
            return response.data;
        } catch (error) {
            console.error('[TRANSACTION_API] Error fetching current orders:', error);
            const enhancedError = new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to fetch current orders'
            );
            enhancedError.response = error.response;
            enhancedError.status = error.response?.status;
            throw enhancedError;
        }
    },

    async fetchAllOrderStatusApi() {
        try {
            const authToken = localStorage.getItem('auth_token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
            };
            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_ORDER_STATUS}`,
                config
            );
            if (!response.data) {
                throw new Error('Invalid response from server');
            }
            return response.data;
        } catch (error) {
            console.error('[TRANSACTION_API] Error fetching order status:', error);
            const enhancedError = new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to fetch order status'
            );
            enhancedError.response = error.response;
            enhancedError.status = error.response?.status;
            throw enhancedError;
        }
    },

    async updateOrderStatusApi(referenceNumber, orderStatus) {
        if (!referenceNumber || !orderStatus) {
            throw new Error('Invalid referenceNumber or orderStatus');
        }
        try {
            const authToken = localStorage.getItem('auth_token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            };
            const response = await apiClient.put(
                `${this.ENDPOINTS.CHANGE_STATUS}`,
                { referenceNumber, orderStatus }, // Send direct payload without transactions wrapper
                config
            );
            if (!response.data) {
                throw new Error('Invalid response from server');
            }
            return response.data;
        } catch (error) {
            console.error('[TRANSACTION_API] Error updating order orderStatus:', error);
            const enhancedError = new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to update order orderStatus'
            );
            enhancedError.response = error.response;
            enhancedError.status = error.response?.status;
            throw enhancedError;
        }
    },

    async submitTransactionApi(formData) {
        if (!(formData instanceof FormData)) {
            throw new Error("submitTransactionApi requires FormData");
        }
        try {
            const authToken = localStorage.getItem("auth_token");
            if (!authToken) {
                throw new Error("No authentication token found");
            }
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "multipart/form-data", // ✅ important
                },
            };
            const response = await apiClient.post(this.ENDPOINTS.SUBMIT, formData, config);
            if (!response.data) {
                throw new Error("Invalid response from server");
            }
            return response.data;
        } catch (error) {
            console.error("[TransactionAPI] Error submitting data:", error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Failed to submit transaction data";
            const enhancedError = new Error(errorMessage);
            enhancedError.response = error.response;
            enhancedError.status = error.response?.status;
            throw enhancedError;
        }
    },

    // async submitTransactionApi(payload) {
    //     if (!payload || !payload.reference_number || !Array.isArray(payload.products)) {
    //         throw new Error('Invalid transaction data');
    //     }
    //     try {
    //         const authToken = localStorage.getItem('auth_token');
    //         if (!authToken) {
    //             throw new Error('No authentication token found');
    //         }
    //         const config = {
    //             headers: {
    //                 Authorization: `Bearer ${authToken}`,
    //                 'Content-Type': 'application/json'
    //             }
    //         };
    //         const response = await apiClient.post(
    //             this.ENDPOINTS.SUBMIT,
    //             payload, // Send direct payload without transactions wrapper
    //             config
    //         );
    //         if (!response.data) {
    //             throw new Error('Invalid response from server');
    //         }
    //         return response.data;
    //     } catch (error) {
    //         console.error('[TransactionAPI] Error submitting data:', error);
    //         const errorMessage = error.response?.data?.message ||
    //             error.message ||
    //             'Failed to submit transaction data';
    //         const enhancedError = new Error(errorMessage);
    //         enhancedError.response = error.response;
    //         enhancedError.status = error.response?.status;
    //         throw enhancedError;
    //     }
    // },

    async fetchOrderDetailsApi(referenceNumber) {
        try {
            const authToken = localStorage.getItem('auth_token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'multipart/form-data'
                },
            };
            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_ORDER_DETAILS}/${referenceNumber}`,
                config
            );
            if (!response.data) {
                throw new Error('Invalid response from server');
            }
            return response.data;
        } catch (error) {
            console.error('[TRANSACTION_API] Error fetching order status:', error);
            const enhancedError = new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to fetch order status'
            );
            enhancedError.response = error.response;
            enhancedError.status = error.response?.status;
            throw enhancedError;
        }
    },

    async fetchOrderDetailsTempApi(referenceNumber) {
        try {
            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_ORDER_TEMP}/${referenceNumber}`,
            );
            if (!response.data) {
                throw new Error('Invalid response from server');
            }
            return response.data;
        } catch (error) {
            console.error('[TRANSACTION_API] Error fetching order status:', error);
            const enhancedError = new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to fetch order status'
            );
            enhancedError.response = error.response;
            enhancedError.status = error.response?.status;
            throw enhancedError;
        }
    },

    async fetchOrderQRcodeTempApi(referenceNumber) {
        try {
            const config = {
                responseType: 'blob',
            };
            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_QR_TEMP}/${referenceNumber}`,
                config
            );
            if (!response.data) {
                throw new Error('Invalid response from server');
            }
            return response.data;
        } catch (error) {
            console.error('[TRANSACTION_API] Error fetching order status:', error);
            const enhancedError = new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to fetch order status'
            );
            enhancedError.response = error.response;
            enhancedError.status = error.response?.status;
            throw enhancedError;
        }
    },

    async fetchVoidOrderApi() {
        try {
            const authToken = localStorage.getItem('auth_token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
            };
            const response = await apiClient.get(
                `${this.ENDPOINTS.FETCH_VOID_ORDERS}`,
                config
            );

            if (!response.data) {
                throw new Error('Invalid response from server');
            }
            return response.data;
        } catch (error) {
            console.error('[TRANSACTION_API] Error fetching void orders:', error);
            const enhancedError = new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to fetch void orders'
            );
            enhancedError.response = error.response;
            enhancedError.status = error.response?.status;
            throw enhancedError;
        }
    },

    async saveVoidOrderApi(payload) {
        if (!payload || !payload.reference_number || !payload.table_number) {
            throw new Error('Invalid void data');
        }
        try {
            const authToken = localStorage.getItem('auth_token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            };
            const response = await apiClient.post(
                this.ENDPOINTS.SAVE_VOID_ORDER,
                payload,
                config
            );
            if (!response.data) {
                throw new Error('Invalid response from server');
            }
            return response.data;
        } catch (error) {
            console.error('[TransactionAPI] Error saving data:', error);
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Failed to save void data';
            const enhancedError = new Error(errorMessage);
            enhancedError.response = error.response;
            enhancedError.status = error.response?.status;
            throw enhancedError;
        }
    },

    // async fetchAllStationStatusApi() {
    //     try {
    //         const authToken = localStorage.getItem('auth_token');
    //         if (!authToken) {
    //             throw new Error('No authentication token found');
    //         }
    //         const config = {
    //             headers: {
    //                 Authorization: `Bearer ${authToken}`,
    //                 'Content-Type': 'application/json'
    //             },
    //         };
    //         const response = await apiClient.get(
    //             `${this.ENDPOINTS.FETCH_STATION_STATUS}`,
    //             config
    //         );
    //         if (!response.data) {
    //             throw new Error('Invalid response from server');
    //         }
    //         return response.data;
    //     } catch (error) {
    //         console.error('[TRANSACTION_API] Error fetching order status:', error);
    //         const enhancedError = new Error(
    //             error.response?.data?.message ||
    //             error.message ||
    //             'Failed to fetch order status'
    //         );
    //         enhancedError.response = error.response;
    //         enhancedError.status = error.response?.status;
    //         throw enhancedError;
    //     }
    // },

    // async updateKitchenProductStatusApi(orderId, orderStatus) {
    //     if (!orderId || !orderStatus) {
    //         throw new Error('Invalid orderId or orderStatus');
    //     }
    //     try {
    //         const authToken = localStorage.getItem('auth_token');
    //         if (!authToken) {
    //             throw new Error('No authentication token found');
    //         }
    //         const config = {
    //             headers: {
    //                 Authorization: `Bearer ${authToken}`,
    //                 'Content-Type': 'application/json'
    //             }
    //         };
    //         const response = await apiClient.put(
    //             `${this.ENDPOINTS.CHANGE_KITCHEN_STATUS}`,
    //             { orderId, orderStatus },
    //             config
    //         );
    //         if (!response.data) {
    //             throw new Error('Invalid response from server');
    //         }
    //         return response.data;
    //     } catch (error) {
    //         console.error('[TRANSACTION_API] Error updating order orderStatus:', error);
    //         const enhancedError = new Error(
    //             error.response?.data?.message ||
    //             error.message ||
    //             'Failed to update order orderStatus'
    //         );
    //         enhancedError.response = error.response;
    //         enhancedError.status = error.response?.status;
    //         throw enhancedError;
    //     }
    // },

    // async fetchOrderQRcodeApi(referenceNumber) {
    //     try {
    //         const authToken = localStorage.getItem('auth_token');
    //         if (!authToken) {
    //             throw new Error('No authentication token found');
    //         }
    //         const config = {
    //             headers: {
    //                 Authorization: `Bearer ${authToken}`,
    //             },
    //             responseType: 'blob',
    //         };
    //         const response = await apiClient.get(
    //             `${this.ENDPOINTS.FETCH_QR}/${referenceNumber}`,
    //             config
    //         );
    //         if (!response.data) {
    //             throw new Error('Invalid response from server');
    //         }
    //         return response.data;
    //     } catch (error) {
    //         console.error('[TRANSACTION_API] Error fetching order status:', error);
    //         const enhancedError = new Error(
    //             error.response?.data?.message ||
    //             error.message ||
    //             'Failed to fetch order status'
    //         );
    //         enhancedError.response = error.response;
    //         enhancedError.status = error.response?.status;
    //         throw enhancedError;
    //     }
    // },
    
    // async fetchKitchenProductDetailsApi(orderId) {
    //     try {
    //         const authToken = localStorage.getItem('auth_token');
    //         if (!authToken) {
    //             throw new Error('No authentication token found');
    //         }
    //         const config = {
    //             headers: {
    //                 Authorization: `Bearer ${authToken}`,
    //                 'Content-Type': 'application/json'
    //             },
    //         };
    //         const response = await apiClient.get(
    //             `${this.ENDPOINTS.FETCH_KITCHEN_PRODUCT}/${orderId}`,
    //             config
    //         );
    //         if (!response.data) {
    //             throw new Error('Invalid response from server');
    //         }
    //         return response.data;
    //     } catch (error) {
    //         console.error('[TRANSACTION_API] Error fetching kitchen product status:', error);
    //         const enhancedError = new Error(
    //             error.response?.data?.message ||
    //             error.message ||
    //             'Failed to fetch kitchen product status'
    //         );
    //         enhancedError.response = error.response;
    //         enhancedError.status = error.response?.status;
    //         throw enhancedError;
    //     }
    // },
    
};