import { defineStore } from 'pinia';
import { TRANSACTION_API } from '@/api/transactionApi';

export const useTransactStore = defineStore('transactionData', {
    state: () => ({
        transactionData: null,
        voidOrderData: null,
        currentOrders: [],
        voidOrders: [],
        orderStatuses: [],
        stationStatuses: [],
        orderDtls: [],
        orderQRCode: null,
        loading: false,
        error: null,
        success: false
    }),

    actions: {

        async startStationStatusPollingStore(interval = 5000) {
            let isActive = true;
            const poll = async () => {
                if (!isActive) return;
                try {
                    await this.fetchAllCurrentOrdersStore();
                    // callback(status);
                } catch (error) {
                    // callback(error, null);
                } finally {
                    if (isActive) {
                        setTimeout(poll, interval);
                    }
                }
            };
            poll();
            return () => {
                isActive = false;
            };
        },

        async fetchAllCurrentOrdersStore() {
            this.loading = true;
            this.error = null;
            try {
                if (!TRANSACTION_API || typeof TRANSACTION_API.fetchAllCurrentOrdersApi !== 'function') {
                    throw new Error('TRANSACTION_API service is not properly initialized');
                }
                const response = await TRANSACTION_API.fetchAllCurrentOrdersApi();
                if (response && response.status === true) {
                    this.currentOrders = response.data;
                } else {
                    throw new Error('Failed to fetch currentOrders');
                }
            } catch (error) {
                console.error('Error in fetchAllCurrentOrdersApi:', error);
                this.error = 'Failed to fetch currentOrders';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchAllOrderStatusStore() {
            this.loading = true;
            this.error = null;
            try {
                if (!TRANSACTION_API || typeof TRANSACTION_API.fetchAllOrderStatusApi !== 'function') {
                    throw new Error('TRANSACTION_API service is not properly initialized');
                }
                const response = await TRANSACTION_API.fetchAllOrderStatusApi();
                if (response && response.status === true) {
                    this.orderStatuses = response.data;
                } else {
                    throw new Error('Failed to fetch orderStatuses');
                }
            } catch (error) {
                console.error('Error in fetchAllOrderStatusApi:', error);
                this.error = 'Failed to fetch order status';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async updateOrderStatusStore(referenceNumber, orderStatus) {
            this.loading = true;
            this.error = null;
            try {
                if (!referenceNumber || !orderStatus) {
                    throw new Error('Invalid referenceNumber or orderStatus');
                }
                const response = await TRANSACTION_API.updateOrderStatusApi(referenceNumber, orderStatus);
                if (response && response.status === true) {
                    this.currentOrders = this.currentOrders.map(order =>
                        order.id === referenceNumber ? { ...order, orderStatus } : order
                    );
                    return response;
                } else {
                    throw new Error(response?.message || 'Failed to update order orderStatus');
                }
            } catch (error) {
                console.error('Error updating order orderStatus:', error);
                this.error = error.message || 'Failed to update order orderStatus';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },

        async submitTransactStore(formData) {
            this.loading = true;
            this.error = null;
            this.success = false;
            try {
                const response = await TRANSACTION_API.submitTransactionApi(formData);
                if (!response || response.status !== true) {
                    throw new Error(response?.message || "Failed to submit transaction");
                }
                this.transactionData = response.data;
                this.success = true;
                return response;
            } catch (error) {
                console.error("Transaction submission failed:", error);
                this.error = error.message || "Failed to submit transaction";
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchOrderDetailsStore(referenceNumber) {
            this.loading = true;
            this.error = null;
            try {
                if (!referenceNumber) {
                    throw new Error('Invalid referenceNumber');
                }
                const response = await TRANSACTION_API.fetchOrderDetailsApi(referenceNumber);
                if (response && response.status === true) {
                    this.orderDtls = response;
                    return response;
                } else {
                    throw new Error(response?.message || 'Failed to fetch order details');
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
                this.error = error.message || 'Failed to fetch order details';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },

        // For Receipt
        async fetchOrderDetailsTempStore(referenceNumber) {
            this.loading = true;
            this.error = null;
            try {
                if (!referenceNumber) {
                    throw new Error('Invalid referenceNumber');
                }
                const response = await TRANSACTION_API.fetchOrderDetailsTempApi(referenceNumber);
                if (response && response.status === true) {
                    this.orderDtls = response;
                    return response;
                } else {
                    throw new Error(response?.message || 'Failed to fetch order details');
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
                this.error = error.message || 'Failed to fetch order details';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },

        async fetchQRcodeTempStore(referenceNumber) {
            this.loading = true;
            this.error = null;
            try {
                if (!referenceNumber) {
                    throw new Error('Invalid referenceNumber');
                }
                const qrCodeBlob = await TRANSACTION_API.fetchOrderQRcodeTempApi(referenceNumber);
                if (qrCodeBlob) {
                    this.orderQRCode = qrCodeBlob;  // Store the blob directly
                    return qrCodeBlob;  // Return the blob directly
                } else {
                    throw new Error('Failed to fetch QR Code');
                }
            } catch (error) {
                console.error('Error fetching QR Code:', error);
                this.error = error.message || 'Failed to fetch QR Code';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },

        async fetchVoidOrderStore() {
            this.loading = true;
            this.error = null;
            try {
                if (!TRANSACTION_API || typeof TRANSACTION_API.fetchVoidOrderApi !== 'function') {
                    throw new Error('TRANSACTION_API service is not properly initialized');
                }
                const response = await TRANSACTION_API.fetchVoidOrderApi();
                if (response && response.status === true) {
                    this.voidOrders = response.data;
                } else {
                    throw new Error('Failed to fetch void orders');
                }
            } catch (error) {
                console.error('Error in fetchVoidOrderApi:', error);
                this.error = 'Failed to fetch void orders';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async saveVoidOrderStore(voidOrderData) {
            this.loading = true;
            this.error = null;
            this.success = false;
            try {
                if (!voidOrderData) {
                    throw new Error('Invalid data');
                }
                const payload = {
                    ...voidOrderData
                };
                const response = await TRANSACTION_API.saveVoidOrderApi(payload);
                if (!response || response.status !== true) {
                    throw new Error(response?.message || 'Failed to submit void');
                }
                this.voidOrderData = response.data;
                this.success = true;
                return response;
            } catch (error) {
                console.error('Void submission failed:', error);
                this.error = error.message || 'Failed to submit void';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // async fetchAllStationStatusStore() {
        //     this.loading = true;
        //     this.error = null;
        //     try {
        //         if (!TRANSACTION_API || typeof TRANSACTION_API.fetchAllStationStatusApi !== 'function') {
        //             throw new Error('TRANSACTION_API service is not properly initialized');
        //         }
        //         const response = await TRANSACTION_API.fetchAllStationStatusApi();
        //         if (response && response.status === true) {
        //             this.stationStatuses = response.data;
        //         } else {
        //             throw new Error('Failed to fetch stationStatuses');
        //         }
        //     } catch (error) {
        //         console.error('Error in fetchAllStationStatusApi:', error);
        //         this.error = 'Failed to fetch order status';
        //         throw error;
        //     } finally {
        //         this.loading = false;
        //     }
        // },

        // async updateKitchenProductStatusStore(orderId, orderStatus) {
        //     this.loading = true;
        //     this.error = null;
        //     try {
        //         if (!orderId || !orderStatus) {
        //             throw new Error('Invalid orderId or orderStatus');
        //         }
        //         const response = await TRANSACTION_API.updateKitchenProductStatusApi(orderId, orderStatus);
        //         if (response && response.status === true) {
        //             this.currentOrders = this.currentOrders.map(order =>
        //                 order.id === orderId ? { ...order, orderStatus } : order
        //             );
        //             return response;
        //         } else {
        //             throw new Error(response?.message || 'Failed to update order orderStatus');
        //         }
        //     } catch (error) {
        //         console.error('Error updating order orderStatus:', error);
        //         this.error = error.message || 'Failed to update order orderStatus';
        //         throw error;
        //     }
        //     finally {
        //         this.loading = false;
        //     }
        // },

        // async fetchQRcodeStore(referenceNumber) {
        //     this.loading = true;
        //     this.error = null;
        //     try {
        //         if (!referenceNumber) {
        //             throw new Error('Invalid referenceNumber');
        //         }
        //         const qrCodeBlob = await TRANSACTION_API.fetchOrderQRcodeApi(referenceNumber);
        //         if (qrCodeBlob) {
        //             this.orderQRCode = qrCodeBlob;  // Store the blob directly
        //             return qrCodeBlob;  // Return the blob directly
        //         } else {
        //             throw new Error('Failed to fetch QR Code');
        //         }
        //     } catch (error) {
        //         console.error('Error fetching QR Code:', error);
        //         this.error = error.message || 'Failed to fetch QR Code';
        //         throw error;
        //     }
        //     finally {
        //         this.loading = false;
        //     }
        // },

        // async fetchKitchenProductDetailsStore(orderId) {
        //     this.loading = true;
        //     this.error = null;
        //     try {
        //         if (!orderId) {
        //             throw new Error('Invalid orderId');
        //         }
        //         const response = await TRANSACTION_API.fetchKitchenProductDetailsApi(orderId);
        //         if (response && response.status === true) {
        //             this.orderDtls = response;
        //             return response;
        //         } else {
        //             throw new Error(response?.message || 'Failed to fetch kitchen product details');
        //         }
        //     } catch (error) {
        //         console.error('Error fetching kitchen product details:', error);
        //         this.error = error.message || 'Failed to fetch kitchen product details';
        //         throw error;
        //     }
        //     finally {
        //         this.loading = false;
        //     }
        // },
        
        clearState() {
            this.transactionData = null;
            this.error = null;
            this.success = false;
        }
    },
});