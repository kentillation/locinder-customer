// src/api/paymentApi.js
import apiClient from "../axios";

export const EWALLET_PAYMENT_API = {
  ENDPOINTS: {
    GENERATE_QR: "/paymongo/generate-qr",
    CREATE_PAYMENT_INTENT: "/paymongo/payment-intents",
    ATTACH_PAYMENT_METHOD: "/paymongo/payment-intents/attach",
    CHECK_STATUS: "/paymongo/payment-intents/:intentId/status",
    WEBHOOK: "/paymongo/webhook",
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


  // async cancelPaymentIntentApi(paymentIntentId) {
  //   try {
  //     // You might want to add this endpoint too
  //     const response = await apiClient.post(
  //       `/paymongo/payment-intents/${paymentIntentId}/cancel`
  //     );
  //     return response.data;
  //   } catch (error) {
  //     console.error("Cancel payment intent API error:", error);
  //     throw error;
  //   }
  // },

  // async createPaymentIntentApi(amountInCentavos) {
  //   try {
  //     const authToken = localStorage.getItem("auth_token");
  //     if (!authToken) throw new Error("No authentication token found");

  //     const response = await apiClient.post(
  //       this.ENDPOINTS.CREATE_PAYMENT_INTENT,
  //       { amount: amountInCentavos },
  //       { headers: { Authorization: `Bearer ${authToken}` } }
  //     );

  //     return response.data;
  //   } catch (error) {
  //     console.error("PaymentIntent API error:", error);
  //     throw error;
  //   }
  // },

  // async attachPaymentMethodApi(paymentIntentId, methodType, billing) {
  //   try {
  //     const authToken = localStorage.getItem("auth_token");
  //     if (!authToken) throw new Error("No authentication token found");

  //     const response = await apiClient.post(
  //       this.ENDPOINTS.ATTACH_PAYMENT_METHOD,
  //       {
  //         payment_intent_id: paymentIntentId,
  //         type: methodType, // e.g., 'gcash', 'paymaya', 'qrph'
  //         billing, // { name, email, phone }
  //       },
  //       { headers: { Authorization: `Bearer ${authToken}` } }
  //     );

  //     return response.data;
  //   } catch (error) {
  //     console.error("AttachPaymentMethod API error:", error);
  //     throw error;
  //   }
  // },
};
