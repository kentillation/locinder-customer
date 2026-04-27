import { defineStore } from "pinia";
import QRPhLogo from '@/assets/img/png/e-wallets/QRPh-Logo.png';
import GCashLogo from '@/assets/img/png/e-wallets/Gcash-Logo.png';
import MayaLogo from '@/assets/img/png/e-wallets/Maya-Logo.png';
import BPILogo from '@/assets/img/png/e-wallets/BPI-Logo.png';
import GoTymeLogo from '@/assets/img/png/e-wallets/GoTyme-Logo.png';
import HomeCreditLogo from '@/assets/img/png/e-wallets/HomeCredit-Logo.png';
// import GrabPayLogo from '@/assets/img/png/e-wallets/GrabPay-Logo.png';
// import ShopeePayLogo from '@/assets/img/png/e-wallets/ShopeePay-Logo.png';

export const useEWalletImageStore = defineStore("ewalletImages", {
  state: () => ({
    // Main e-wallet logos
    images: {
      qrph: null,
      gcash: null,
      maya: null,
      bpi: null,
      gotyme: null,
      homecredit: null,

      // Additional e-wallets
      paymaya: null,
      grabpay: null,
      shopeepay: null,
    },

    // Loading states
    isLoading: false,
    isInitialized: false,

    // Error handling
    error: null,
  }),

  actions: {
    // Initialize all images synchronously
    initializeImages() {
      if (this.isInitialized) {
        console.log('E-wallet images already initialized');
        return;
      }

      try {
        this.isLoading = true;

        // Direct assignment (synchronous)
        this.images = {
          qrph: QRPhLogo,
          gcash: GCashLogo,
          maya: MayaLogo,
          bpi: BPILogo,
          gotyme: GoTymeLogo,
          homecredit: HomeCreditLogo,
          //   grabpay: GrabPayLogo,
          //   shopeepay: ShopeePayLogo,
        };

        this.isInitialized = true;
        console.log('E-wallet images initialized successfully');
      } catch (error) {
        console.error('Failed to initialize e-wallet images:', error);
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    // Async initialization with preloading (optional)
    async initializeImagesAsync() {
      if (this.isInitialized) return;

      this.isLoading = true;

      try {
        const imageMap = {
          qrph: QRPhLogo,
          gcash: GCashLogo,
          maya: MayaLogo,
          bpi: BPILogo,
          gotyme: GoTymeLogo,
          homecredit: HomeCreditLogo,
          //   grabpay: GrabPayLogo,
          //   shopeepay: ShopeePayLogo,
        };

        // Preload images to ensure they're cached
        await this.preloadImages(imageMap);

        this.images = imageMap;
        this.isInitialized = true;

        console.log('E-wallet images initialized and pre-loaded');
      } catch (error) {
        console.error('Failed to initialize e-wallet images:', error);
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    // Preload images for better performance
    async preloadImages(imageMap) {
      const preloadPromises = Object.entries(imageMap).map(([key, src]) => {
        return new Promise((resolve) => {
          // Skip if already loaded or null
          if (!src) {
            resolve({ key, loaded: false });
            return;
          }

          const img = new Image();
          img.onload = () => {
            console.log(`Pre-loaded: ${key}`);
            resolve({ key, loaded: true });
          };
          img.onerror = (err) => {
            console.warn(`Failed to pre-load: ${key}`, err);
            resolve({ key, loaded: false });
          };
          img.src = src;
        });
      });

      await Promise.all(preloadPromises);
    },

    // Get a specific image by key
    getImage(key) {
      if (!this.isInitialized) {
        this.initializeImages(); // Lazy initialization
      }

      const image = this.images[key];
      if (!image) {
        console.warn(`E-wallet image not found for key: ${key}`);
      }

      return image || null;
    },

    // Add a new image dynamically
    addImage(key, imageSrc) {
      this.images[key] = imageSrc;
    },

    // Reset store
    reset() {
      this.images = {};
      this.isInitialized = false;
      this.isLoading = false;
      this.error = null;
    },
  },

  getters: {
    // Get all images
    allImages: (state) => state.images,

    // Get specific images
    qrphLogo: (state) => state.images.qrph,
    gcashLogo: (state) => state.images.gcash,
    mayaLogo: (state) => state.images.maya,
    bpiLogo: (state) => state.images.bpi,
    gotymeLogo: (state) => state.images.gotyme,
    homecreditLogo: (state) => state.images.homecredit,

    // Get image count
    imageCount: (state) => Object.keys(state.images).length,

    // Check if image exists
    hasImage: (state) => (key) => !!state.images[key],
  },
});