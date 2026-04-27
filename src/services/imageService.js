// services/imageService.js
// services/imageService.js
class ImageService {
  constructor() {
    this.imageCache = new Map();
    this.pendingLoads = new Map();
  }
  
  // Async version - use with await
  async getImageAsync(key, imagePath) {
    if (this.imageCache.has(key)) {
      return this.imageCache.get(key);
    }
    
    if (this.pendingLoads.has(key)) {
      return this.pendingLoads.get(key);
    }
    
    const loadPromise = this.loadImage(imagePath);
    this.pendingLoads.set(key, loadPromise);
    
    try {
      const src = await loadPromise;
      this.imageCache.set(key, src);
      return src;
    } finally {
      this.pendingLoads.delete(key);
    }
  }
  
  // Sync version - returns immediately if cached, otherwise starts loading and returns placeholder
  getImage(key, imagePath) {
    if (this.imageCache.has(key)) {
      return this.imageCache.get(key);
    }
    
    // Start loading in background
    if (!this.pendingLoads.has(key)) {
      const loadPromise = this.loadImage(imagePath);
      this.pendingLoads.set(key, loadPromise);
      
      loadPromise.then(src => {
        this.imageCache.set(key, src);
      }).catch(err => {
        console.error('Image load failed:', key, err);
      });
    }
    
    // Return the original path while loading
    return imagePath;
  }
  
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });
  }
}

export const imageService = new ImageService();
