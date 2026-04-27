// composables/useEWalletImages.js
import { computed } from "vue";
import { useEWalletImageStore } from "@/stores/eWalletImageStore";

export function useEWalletImages() {
  const store = useEWalletImageStore();

  // Initialize if not already done
  if (!store.isInitialized) {
    store.initializeImages();
  }

  const logos = computed(() => store.allImages);

  const getLogo = (key) => {
    return store.getImage(key);
  };

  const isLoading = computed(() => store.isLoading);
  const isReady = computed(() => store.isInitialized && !store.isLoading);

  return {
    logos,
    getLogo,
    isLoading,
    isReady,

    // Individual logos for convenience
    qrphLogo: computed(() => store.qrphLogo),
    gcashLogo: computed(() => store.gcashLogo),
    mayaLogo: computed(() => store.mayaLogo),
    bpiLogo: computed(() => store.bpiLogo),
    gotymeLogo: computed(() => store.gotymeLogo),
    homecreditLogo: computed(() => store.homecreditLogo),
  };
}
