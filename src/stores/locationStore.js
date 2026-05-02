// stores/locationStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue'; // Removed 'watch' since it's not used

export const useLocationStore = defineStore('location', () => {
    // State
    const currentLocation = ref(null);
    const previousLocation = ref(null);
    const permissionDenied = ref(false);
    const loading = ref(false);
    const lastUpdated = ref(null);
    const watchId = ref(null);
    
    // Movement tracking states
    const isMoving = ref(false);
    const movementSpeed = ref(0);
    const movementDirection = ref(0);
    const movementHistory = ref([]);
    const trackingActive = ref(false);
    const movementStartTime = ref(null);
    const lastMovementUpdate = ref(null);
    
    // Movement thresholds
    const MOVEMENT_THRESHOLD = 0.5; // km/h - below this = stationary
    const HISTORY_SIZE = 10; // Number of positions to keep
    
    // Getters
    const hasLocation = computed(() => !!currentLocation.value);
    const getAddress = computed(() => currentLocation.value?.address || 'Location not set');
    const getCity = computed(() => currentLocation.value?.city || null);
    const getCoordinates = computed(() => currentLocation.value ? {
        lat: currentLocation.value.lat,
        lng: currentLocation.value.lng
    } : null);
    const isLocationRecent = computed(() => {
        if (!lastUpdated.value) return false;
        return (Date.now() - lastUpdated.value) < 5 * 60 * 1000;
    });
    
    // Movement-related getters
    const getMovementStatus = computed(() => {
        if (!isMoving.value) return 'stationary';
        if (movementSpeed.value < 5) return 'walking';
        if (movementSpeed.value < 15) return 'biking';
        if (movementSpeed.value < 60) return 'driving_slow';
        return 'driving_fast';
    });
    
    const getSpeed = computed(() => movementSpeed.value.toFixed(1));
    const getFormattedSpeed = computed(() => {
        if (movementSpeed.value === 0) return 'Stationary';
        return `${movementSpeed.value.toFixed(1)} km/h`;
    });
    
    const getDistanceTraveled = computed(() => {
        if (movementHistory.value.length < 2) return 0;
        let totalDistance = 0;
        for (let i = 1; i < movementHistory.value.length; i++) {
            totalDistance += calculateDistance(
                movementHistory.value[i-1].lat,
                movementHistory.value[i-1].lng,
                movementHistory.value[i].lat,
                movementHistory.value[i].lng
            );
        }
        return totalDistance;
    });

    // Helper: Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Helper: Calculate speed between two points
    const calculateSpeed = (point1, point2, timeDiffMs) => {
        if (!point1 || !point2 || timeDiffMs <= 0) return 0;
        const distance = calculateDistance(point1.lat, point1.lng, point2.lat, point2.lng);
        const timeHours = timeDiffMs / (1000 * 60 * 60);
        return distance / timeHours;
    };

    // Helper: Calculate bearing/direction
    const calculateBearing = (lat1, lon1, lat2, lon2) => {
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) -
                  Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        const θ = Math.atan2(y, x);
        return (θ * 180 / Math.PI + 360) % 360;
    };

    // Reverse geocoding
    const reverseGeocode = async (lat, lng) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'en-US,en;q=0.9',
                        'User-Agent': 'Locinder App'
                    },
                    signal: controller.signal
                }
            );
            clearTimeout(timeoutId);
            
            const data = await response.json();

            const barangay = data.address?.quarter || data.address?.barangay || data.address?.suburb || null;
            const city = data.address?.city || data.address?.town || data.address?.municipality || null;
            const province = data.address?.state || data.address?.province || null;
            
            let formattedAddress = '';
            if (barangay && city && province) {
                formattedAddress = `${barangay}, ${city}, ${province}`;
            } else if (city && province) {
                formattedAddress = `${city}, ${province}`;
            } else if (barangay && city) {
                formattedAddress = `${barangay}, ${city}`;
            } else if (barangay) {
                formattedAddress = barangay;
            } else if (city) {
                formattedAddress = city;
            } else if (province) {
                formattedAddress = province;
            } else {
                formattedAddress = data.display_name?.split(',')[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
            
            return {
                formattedAddress,
                city,
                province,
                barangay,
                fullData: data
            };
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return {
                formattedAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                city: null,
                province: null,
                barangay: null
            };
        }
    };

    // Update movement tracking
    const updateMovementTracking = (newLocation) => {
        if (!previousLocation.value) {
            isMoving.value = false;
            movementSpeed.value = 0;
            return;
        }
        
        const timeDiff = newLocation.timestamp - previousLocation.value.timestamp;
        if (timeDiff <= 0) return;
        
        // Calculate speed using either GPS speed or calculate from distance
        let calculatedSpeed = newLocation.speed || 0;
        if (!calculatedSpeed) {
            calculatedSpeed = calculateSpeed(previousLocation.value, newLocation, timeDiff);
        }
        
        // Update speed (smoothing with previous speed)
        movementSpeed.value = movementSpeed.value 
            ? (movementSpeed.value * 0.7 + calculatedSpeed * 0.3) 
            : calculatedSpeed;
        
        // Determine if moving
        const wasMoving = isMoving.value;
        isMoving.value = movementSpeed.value > MOVEMENT_THRESHOLD;
        
        // Track movement start time
        if (!wasMoving && isMoving.value) {
            movementStartTime.value = Date.now();
        } else if (wasMoving && !isMoving.value) {
            movementStartTime.value = null;
        }
        
        // Calculate direction if moving
        if (isMoving.value) {
            if (newLocation.heading) {
                movementDirection.value = newLocation.heading;
            } else {
                movementDirection.value = calculateBearing(
                    previousLocation.value.lat,
                    previousLocation.value.lng,
                    newLocation.lat,
                    newLocation.lng
                );
            }
        }
        
        lastMovementUpdate.value = Date.now();
    };

    // Add location to history
    const addToHistory = (location) => {
        movementHistory.value.unshift({
            lat: location.lat,
            lng: location.lng,
            timestamp: location.timestamp,
            speed: location.speed,
            heading: location.heading
        });
        
        // Keep only recent history
        if (movementHistory.value.length > HISTORY_SIZE) {
            movementHistory.value.pop();
        }
    };

    // Get current location
    const getCurrentLocation = async (options = {}) => {
        const { 
            enableHighAccuracy = true, 
            timeout = 10000, 
            force = false,
            trackMovement = false
        } = options;
        
        if (!force && isLocationRecent.value && currentLocation.value && !trackMovement) {
            return currentLocation.value;
        }

        if (!navigator.geolocation) {
            permissionDenied.value = true;
            throw new Error('Geolocation is not supported');
        }

        loading.value = true;
        permissionDenied.value = false;

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude, speed, heading, accuracy } = position.coords;
                        
                        if (currentLocation.value) {
                            previousLocation.value = { ...currentLocation.value };
                        }
                        
                        const addressData = await reverseGeocode(latitude, longitude);
                        
                        const locationData = {
                            lat: latitude,
                            lng: longitude,
                            address: addressData.formattedAddress,
                            city: addressData.city,
                            province: addressData.province,
                            barangay: addressData.barangay,
                            timestamp: Date.now(),
                            accuracy: accuracy,
                            speed: speed || 0,
                            heading: heading || 0,
                            fullAddress: addressData.fullData
                        };
                        
                        if (trackMovement) {
                            updateMovementTracking(locationData);
                        }
                        
                        currentLocation.value = locationData;
                        lastUpdated.value = Date.now();
                        addToHistory(locationData);
                        
                        localStorage.setItem('user_location', JSON.stringify({
                            ...locationData,
                            timestamp: Date.now()
                        }));
                        
                        resolve(locationData);
                    } catch (err) {
                        reject(err);
                    } finally {
                        loading.value = false;
                    }
                },
                (error) => {
                    loading.value = false;
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            permissionDenied.value = true;
                            reject(new Error('Location permission denied'));
                            break;
                        case error.POSITION_UNAVAILABLE:
                            reject(new Error('Location unavailable'));
                            break;
                        case error.TIMEOUT:
                            reject(new Error('Location timeout'));
                            break;
                        default:
                            reject(new Error('Unable to get location'));
                    }
                },
                {
                    enableHighAccuracy,
                    timeout,
                    maximumAge: 0
                }
            );
        });
    };

    // Get adaptive update interval based on speed
    const getAdaptiveInterval = (speed) => {
        if (!speed || speed < 5) return 5000;      // Walking: update every 5 seconds
        if (speed < 30) return 3000;               // City driving: update every 3 seconds
        return 2000;                                // Fast driving: update every 2 seconds
    };

    // Start continuous tracking
    const startContinuousTracking = async (options = {}) => {
        if (trackingActive.value) {
            console.log('Tracking already active');
            return;
        }
        
        const {
            highAccuracy = true,
            adaptiveInterval = true
        } = options;
        
        trackingActive.value = true;
        
        try {
            await getCurrentLocation({ 
                enableHighAccuracy: highAccuracy, 
                trackMovement: true 
            });
        } catch (error) {
            console.error('Failed to get initial location:', error);
        }
        
        let lastUpdateTime = Date.now();
        
        watchId.value = navigator.geolocation.watchPosition(
            async (position) => {
                if (!trackingActive.value) return;
                
                const { latitude, longitude, speed, heading, accuracy } = position.coords;
                
                // Calculate adaptive interval based on speed
                let updateInterval = 2000; // Default
                if (adaptiveInterval && speed !== undefined) {
                    updateInterval = getAdaptiveInterval(speed);
                }
                
                // Throttle updates
                const now = Date.now();
                if ((now - lastUpdateTime) < updateInterval) {
                    return;
                }
                lastUpdateTime = now;
                
                if (currentLocation.value) {
                    previousLocation.value = { ...currentLocation.value };
                }
                
                const addressData = await reverseGeocode(latitude, longitude);
                
                const locationData = {
                    lat: latitude,
                    lng: longitude,
                    address: addressData.formattedAddress,
                    city: addressData.city,
                    province: addressData.province,
                    barangay: addressData.barangay,
                    timestamp: now,
                    accuracy: accuracy,
                    speed: speed || 0,
                    heading: heading || 0,
                    fullAddress: addressData.fullData
                };
                
                updateMovementTracking(locationData);
                currentLocation.value = locationData;
                lastUpdated.value = now;
                addToHistory(locationData);
                
                // Save periodically (every 30 seconds)
                if (!window._lastSaveTime || (now - window._lastSaveTime) > 30000) {
                    localStorage.setItem('user_location', JSON.stringify({
                        ...locationData,
                        timestamp: now
                    }));
                    window._lastSaveTime = now;
                }
            },
            (error) => {
                console.error('Location watch error:', error);
                if (error.code === error.PERMISSION_DENIED) {
                    permissionDenied.value = true;
                    stopContinuousTracking();
                }
            },
            {
                enableHighAccuracy: highAccuracy,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Stop continuous tracking
    const stopContinuousTracking = () => {
        trackingActive.value = false;
        
        if (watchId.value && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchId.value);
            watchId.value = null;
        }
        
        // Reset movement tracking
        isMoving.value = false;
        movementSpeed.value = 0;
        movementDirection.value = 0;
        movementStartTime.value = null;
        lastMovementUpdate.value = null;
        movementHistory.value = [];
    };

    // Get ETA to destination
    const getETA = (destinationLat, destinationLng) => {
        if (!isMoving.value || movementSpeed.value === 0 || !currentLocation.value) {
            return null;
        }
        
        const distance = calculateDistance(
            currentLocation.value.lat,
            currentLocation.value.lng,
            destinationLat,
            destinationLng
        );
        
        const timeHours = distance / movementSpeed.value;
        const timeMinutes = timeHours * 60;
        
        return {
            distance: distance.toFixed(1),
            timeMinutes: Math.ceil(timeMinutes),
            timeHours: timeHours.toFixed(1),
            arrivalTime: new Date(Date.now() + timeHours * 60 * 60 * 1000)
        };
    };

    // Start battery saving mode
    const startBatterySavingMode = () => {
        if (watchId.value) {
            stopContinuousTracking();
            startContinuousTracking({
                highAccuracy: false,
                adaptiveInterval: true
            });
        }
    };

    // Start high accuracy mode
    const startHighAccuracyMode = () => {
        if (watchId.value) {
            stopContinuousTracking();
            startContinuousTracking({
                highAccuracy: true,
                adaptiveInterval: true
            });
        }
    };

    const loadStoredLocation = () => {
        const stored = localStorage.getItem('user_location');
        if (stored) {
            try {
                const location = JSON.parse(stored);
                if (location.timestamp && (Date.now() - location.timestamp) < 24 * 60 * 60 * 1000) {
                    currentLocation.value = location;
                    lastUpdated.value = location.timestamp;
                } else {
                    localStorage.removeItem('user_location');
                }
            } catch (e) {
                console.error('Error parsing stored location:', e);
            }
        }
    };

    const clearLocation = () => {
        currentLocation.value = null;
        previousLocation.value = null;
        permissionDenied.value = false;
        lastUpdated.value = null;
        isMoving.value = false;
        movementSpeed.value = 0;
        movementDirection.value = 0;
        movementHistory.value = [];
        movementStartTime.value = null;
        lastMovementUpdate.value = null;
        localStorage.removeItem('user_location');
        stopContinuousTracking();
    };

    // Initialize
    loadStoredLocation();

    return {
        // State
        currentLocation,
        previousLocation,
        permissionDenied,
        loading,
        lastUpdated,
        
        // Movement tracking state
        isMoving,
        movementSpeed,
        movementDirection,
        movementHistory,
        trackingActive,
        movementStartTime,
        
        // Getters
        hasLocation,
        getAddress,
        getCity,
        getCoordinates,
        isLocationRecent,
        getMovementStatus,
        getSpeed,
        getFormattedSpeed,
        getDistanceTraveled,
        
        // Actions
        getCurrentLocation,
        startContinuousTracking,
        stopContinuousTracking,
        startBatterySavingMode,
        startHighAccuracyMode,
        getETA,
        loadStoredLocation,
        clearLocation,
    };
});