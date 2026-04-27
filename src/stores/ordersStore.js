import { defineStore } from 'pinia';

export const useOrdersStore = defineStore('orders', {
    state: () => ({
        crrntTtlOrdrQntty: 0,
        crrntSbTtl: 0,
        crrntTtlAmnt: 0,
    }),

    getters: {
        currentTotalOrderQuantity: (state) => state.crrntTtlOrdrQntty,
        currentSubTotal: (state) => state.crrntSbTtl,
        currentTotalAmount: (state) => state.crrntTtlAmnt,
    },
});