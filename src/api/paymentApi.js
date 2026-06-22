// This file is subject for integration
import apiClient from "../axios";

export const EWALLET_PAYMENT_API = {
  ENDPOINTS: {
    GENERATE_QR: "/paymongo/generate-qr",
  },

  async generateQRPhCodeApi(amount, walletType, referenceNumber) {
    try {
      const response = await apiClient.post(this.ENDPOINTS.GENERATE_QR, {
        amount: amount,
        wallet_type: walletType,
        reference_number: referenceNumber,
      });
      return response.data;
    } catch (error) {
      console.error("Generate QR API error:", error);
      throw error;
    }
  },
};
