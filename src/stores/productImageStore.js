import { defineStore } from "pinia";
import CutleryImage from '@/assets/img/png/food/Cutlery.png';

export const useProductImageStore = defineStore("productImages", {
    state: () => ({
        images: {
            cutlery: null,
        },
        isLoading: false,
        isInitialized: false,
        error: null,
    }),

    actions: {
        initializeImages() {
            if (this.isInitialized) {
                console.log('Product images already initialized');
                return;
            }

            try {
                this.isLoading = true;

                this.images = {
                    cutlery: CutleryImage,
                };

                this.isInitialized = true;
                console.log('Product images initialized successfully');
            } catch (error) {
                console.error('Failed to initialize product images:', error);
                this.error = error.message;
            } finally {
                this.isLoading = false;
            }
        },

        async initializeImagesAsync() {
            if (this.isInitialized) return;

            this.isLoading = true;

            try {
                const imageMap = {
                    cutlery: CutleryImage,
                };

                await this.preloadImages(imageMap);

                this.images = imageMap;
                this.isInitialized = true;

                console.log('Product images initialized and pre-loaded');
            } catch (error) {
                console.error('Failed to initialize product images:', error);
                this.error = error.message;
            } finally {
                this.isLoading = false;
            }
        },

        async preloadImages(imageMap) {
            const preloadPromises = Object.entries(imageMap).map(([key, src]) => {
                return new Promise((resolve) => {
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

        getImage(key) {
            if (!this.isInitialized) {
                this.initializeImages();
            }

            const image = this.images[key];
            if (!image) {
                console.warn(`Product image not found for key: ${key}`);
            }

            return image || null;
        },

        addImage(key, imageSrc) {
            this.images[key] = imageSrc;
        },

        reset() {
            this.images = {};
            this.isInitialized = false;
            this.isLoading = false;
            this.error = null;
        },
    },

    getters: {
        allImages: (state) => state.images,
        cutleryImg: (state) => state.images.cutlery,
        imageCount: (state) => Object.keys(state.images).length,
        hasImage: (state) => (key) => !!state.images[key],
    },
});