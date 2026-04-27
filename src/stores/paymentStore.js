import { defineStore } from "pinia";
import { EWALLET_PAYMENT_API } from "@/api/paymentApi";

export const usePaymentStore = defineStore("payment", {
  state: () => ({
    loading: false,
    error: null,
    qrData: null,
    paymentIntentId: null,
    paymentDetails: null,
  }),

  actions: {

    async generateQRPhCodeStore(amountToPay, selectedEWallet, referenceNumber) {
      if (!amountToPay || !selectedEWallet || !referenceNumber) return;

      this.resetPaymentState();

      this.loading = true;

      try {
        const response = await EWALLET_PAYMENT_API.generateQRPhCodeApi(
          amountToPay,
          selectedEWallet,
          referenceNumber
        );

        this.qrData = response;
        this.paymentIntentId = response.payment_intent_id;

        return response;
      } catch (err) {
        this.error = err?.response?.data?.message || "Failed to generate QR";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    resetPaymentState() {
      this.qrData = null;
      this.paymentIntentId = null;
      this.paymentDetails = null;
      this.error = null;
    },

  },

  getters: {
    qrImageSrc: (state) => state.qrData?.qr_image
  },
});
