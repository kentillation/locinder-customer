<template>
    <div class="locinder-wrapper">
        <!-- Map Style Selector -->
        <div class="map-style-selector">
            <button v-for="style in mapStyles" :key="style.id" @click="changeMapStyle(style)"
                :class="{ active: currentStyle === style.id }" class="style-btn">
                {{ style.name }}
            </button>
        </div>

        <!-- Distance Badge -->
        <div v-if="loading" class="distance-badge" style="background: none;">
            <div class="distance-icon" style="margin-top: -10px !important;">
                <v-skeleton-loader type="text" width="200" style="background: none;"></v-skeleton-loader>
            </div>
        </div>

        <div v-if="distanceText" :class="distanceClass" class="distance-badge">
            <span class="distance-text">{{ distanceText }}</span>
            <span class="d-none">{{ currentRouteSource }}</span>
        </div>

        <!-- GPS Mode Toggle -->
        <div class="gps-mode-toggle" v-if="mapInitialized">
            <v-btn @click="toggleGPSMode" :color="gpsModeEnabled ? '#c70000' : '#009207'" class="start-tracing-btn"
                size="small">{{ gpsModeEnabled ? 'Stop' : 'Start following direction' }}
            </v-btn>
        </div>

        <!-- Permission Request Overlay -->
        <div v-if="showPermissionRequest" class="permission-overlay">
            <v-card class="permission-card">
                <v-icon size="48" color="#5c3a21">mdi-map-marker</v-icon>
                <h3 class="mt-3">Location Access Needed</h3>
                <p class="text-center mt-2">
                    Allow location access to see your current position and get directions to this shop.
                </p>
                <div class="btn-container mt-4">
                    <v-btn color="grey" height="50" width="110" variant="outlined" @click="dismissPermissionRequest">
                        Not Now
                    </v-btn>
                    <v-btn color="#5c3a21" height="50" width="110" @click="requestLocationPermission">
                        Allow
                    </v-btn>
                </div>
            </v-card>
        </div>

        <!-- Permission Denied Banner -->
        <div v-if="showPermissionDeniedBanner" class="permission-denied-banner">
            <v-alert type="warning" variant="tonal" closable @click:close="showPermissionDeniedBanner = false">
                <div class="d-flex align-center">
                    <v-icon left>mdi-map-marker-off</v-icon>
                    <span class="ml-2">Location access is needed for map features.
                        <a href="#" @click="openAppSettings" class="settings-link">Open Settings</a>
                    </span>
                </div>
            </v-alert>
        </div>

        <!-- Map display -->
        <div id="map" class="map"></div>

        <!-- 3D Tilt Control Group -->
        <div class="tilt-control-group" v-if="mapInitialized">
            <!-- Rotation Control -->
            <div class="rotation-control" @click="resetRotation">
                <v-icon color="#5c3a21" style="font-size: 20px !important;">mdi-compass</v-icon>
            </div>

            <!-- 3D Tilt Controls -->
            <div class="tilt-controls">
                <div class="tilt-control" @click="increaseTilt">
                    <v-icon color="#5c3a21" style="font-size: 16px !important;">mdi-arrow-up</v-icon>
                </div>
                <div class="tilt-control" @click="resetTilt">
                    <v-icon color="#5c3a21" size="18">mdi-cube-outline</v-icon>
                </div>
                <div class="tilt-control" @click="decreaseTilt">
                    <v-icon color="#5c3a21" style="font-size: 16px !important;">mdi-arrow-down</v-icon>
                </div>
            </div>
        </div>

        <!-- Tilt Indicator -->
        <div v-if="currentPitch > 0" class="tilt-indicator">
            <span>3D View: {{ Math.round(currentPitch) }}°</span>
        </div>

        <!-- GPS Guidance -->
        <div v-if="showGpsGuidance" class="gps-guidance">
            <div class="guidance-content">
                <span class="guidance-icon">📡</span>
                <div class="guidance-text">
                    <strong style="color: #ff0000">Low GPS Signal</strong>
                    <p>Move to an open area away from buildings and trees for better accuracy</p>
                </div>
                <button @click="showGpsGuidance = false" class="guidance-close">×</button>
            </div>
        </div>

        <!-- Loading Overlay -->
        <div v-if="loading" class="loading-overlay">
            <div class="spinner"></div>
            <p>Getting your exact location...</p>
            <p style="font-size: 12px; margin-top: 10px; opacity: 0.7;">Please allow location access when prompted</p>
        </div>

        <!-- Status messages -->
        <div v-if="error" class="status error">{{ error }}</div>
    </div>
</template>

<script setup>
/* eslint-disable */
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Geolocation } from '@capacitor/geolocation'
import { useToast } from 'vue-toastification'

// Props
const props = defineProps({
    nameOnMap: {
        type: String,
        default: 'Shop Location'
    },
    latitudeOnMap: {
        type: Number,
        default: null
    },
    longitudeOnMap: {
        type: Number,
        default: null
    },
    addressOnMap: {
        type: String,
        default: 'Address not available'
    }
})

// Emits
const emit = defineEmits(['map-ready', 'bearing-changed', 'pitch-changed'])

const toast = useToast()

// ==================== Reactive State ====================
const coordinates = ref(null)
const userAddress = ref('Getting your address...')
const loading = ref(false)
const error = ref(null)
const showGpsGuidance = ref(false)
let destinationMarker = null
let userMarker = null

// Map-related
let map = null
let watchId = null
let mapInitialized = false
let routeSource = null
let routeLayer = null
let glowRouteLayer = null
let routeArrowLayer = null
let currentRouteSource = null
let currentRouteData = null // Store current route data for style changes

// Rotation and Tilt-related
const currentBearing = ref(0)
const currentPitch = ref(0)
const minPitch = 0
const maxPitch = 85
const defaultPitch = 0

// GPS Auto-rotation Mode
const gpsModeEnabled = ref(false)
let lastHeading = null
let lastPosition = null
let gpsUpdateFrame = null

// Location Permission Properties
const showPermissionRequest = ref(false)
const showPermissionDeniedBanner = ref(false)
const hasRequestedPermission = ref(false)
const permissionGranted = ref(false)

// Debounce and throttle timers
let routeUpdateTimeout = null
let addressUpdateTimeout = null
let lastAddressUpdate = 0
const ADDRESS_UPDATE_THROTTLE = 5000
const ROUTE_UPDATE_DEBOUNCE = 2000
const LOCATION_WATCH_INTERVAL = 3000
let lastZoomLevel = ref(17) // Store zoom level for GPS mode
let locationWatchInterval = null
let touchStart = null
let inertiaVelocity = { x: 0, y: 0 }
let lastPanPosition = null
let inertiaFrame = null
let isPanning = false
let lastPanTime = 0

// Abort controller for route requests
let currentRouteController = null

// Map styles (using MapLibre style URLs)
const mapStyles = [
    {
        id: 'osm',
        name: 'Standard',
        url: 'https://tiles.versatiles.org/assets/styles/colorful/style.json',
        attribution: 'Locinder'
    },
    {
        id: 'lightweight',
        name: 'Fast',
        url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        attribution: 'Locinder'
    },
    {
        id: 'cartodb',
        name: 'Light',
        url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        attribution: 'Locinder'
    },
    {
        id: 'cartodb-dark',
        name: 'Dark',
        url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        attribution: 'Locinder'
    },
]

const currentStyle = ref('osm')

// Cache for reverse geocoding
const addressCache = new Map()
const routeCache = new Map()

// Check if running in Capacitor
const isCapacitor = () => {
    return !!(window && window.Capacitor && window.Capacitor.isNativePlatform)
}

// ==================== Location Permission Methods ====================
const checkLocationPermission = async () => {
    if (!isCapacitor()) {
        permissionGranted.value = true
        showPermissionRequest.value = false
        return true
    }

    try {
        const permissionStatus = await Geolocation.checkPermissions()

        if (permissionStatus.location === 'granted') {
            permissionGranted.value = true
            showPermissionRequest.value = false
            showPermissionDeniedBanner.value = false
            return true
        } else if (permissionStatus.location === 'denied') {
            permissionGranted.value = false
            showPermissionDeniedBanner.value = true
            showPermissionRequest.value = false
            return false
        } else {
            showPermissionRequest.value = true
            return false
        }
    } catch (error) {
        console.error('Error checking location permission:', error)
        return false
    }
}

const requestLocationPermission = async () => {
    if (!isCapacitor()) {
        permissionGranted.value = true
        showPermissionRequest.value = false
        await refreshLocation()
        return
    }

    try {
        const result = await Geolocation.requestPermissions()

        if (result.location === 'granted') {
            permissionGranted.value = true
            showPermissionRequest.value = false
            showPermissionDeniedBanner.value = false
            if (toast) toast.success('Location access granted!')

            setTimeout(async () => {
                await refreshLocation()
            }, 500)
        } else {
            permissionGranted.value = false
            showPermissionRequest.value = false
            showPermissionDeniedBanner.value = true
            if (toast) toast.warning('Location access is needed for map features')
        }

        hasRequestedPermission.value = true
    } catch (error) {
        console.error('Permission request error:', error)
        showPermissionRequest.value = false
        if (toast) toast.error('Failed to request location permission')
    }
}

const dismissPermissionRequest = () => {
    showPermissionRequest.value = false
    if (toast) toast.info('You can enable location from settings later')
}

const openAppSettings = async () => {
    if (isCapacitor()) {
        try {
            await Geolocation.openSettings()
        } catch (error) {
            console.error('Error opening settings:', error)
            if (toast) toast.error('Please enable location access in device settings')
        }
    }
}

// ==================== GPS Auto-rotation Mode ====================
const calculateHeading = (lat1, lng1, lat2, lng2) => {
    // Calculate bearing between two points
    const dLng = (lng2 - lng1) * Math.PI / 180
    const lat1Rad = lat1 * Math.PI / 180
    const lat2Rad = lat2 * Math.PI / 180

    const y = Math.sin(dLng) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

    let bearing = Math.atan2(y, x) * 180 / Math.PI
    bearing = (bearing + 360) % 360

    return bearing
}

const toggleGPSMode = async () => {
    gpsModeEnabled.value = !gpsModeEnabled.value

    if (gpsModeEnabled.value) {
        if (toast) toast.success('Map will follow location & direction')

        // Get current user location
        let currentLocation = coordinates.value

        if (!currentLocation) {
            // Try to get location if not available
            const hasPermission = await checkLocationPermission()
            if (hasPermission) {
                if (isCapacitor()) {
                    try {
                        const position = await Geolocation.getCurrentPosition({
                            enableHighAccuracy: true,
                            timeout: 5000
                        })
                        currentLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                        coordinates.value = currentLocation
                    } catch (err) {
                        console.error('Could not get location for GPS mode:', err)
                        toast.error('Could not get your location')
                        gpsModeEnabled.value = false
                        return
                    }
                } else if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((position) => {
                        currentLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                        coordinates.value = currentLocation
                        enableGPSFollowMode(currentLocation)
                    }, (err) => {
                        console.error('Could not get location for GPS mode:', err)
                        toast.error('Could not get your location')
                        gpsModeEnabled.value = false
                    })
                    return // Wait for async callback
                }
            } else {
                toast.error('Location permission needed for GPS mode')
                gpsModeEnabled.value = false
                return
            }
        }

        enableGPSFollowMode(currentLocation)
    } else {
        if (toast) toast.warning('GPS Mode disabled')

        setMapPitch(0, { animate: true })
        setMapBearing(0, { animate: true, duration: 500 })

        // Clean up interval when disabled
        if (locationWatchInterval) {
            clearInterval(locationWatchInterval)
            locationWatchInterval = null
        }
    }
}

const projectPointOnSegment = (p, a, b) => {
    const A = { x: a[0], y: a[1] }
    const B = { x: b[0], y: b[1] }
    const P = { x: p.lng, y: p.lat }

    const ABx = B.x - A.x
    const ABy = B.y - A.y
    const APx = P.x - A.x
    const APy = P.y - A.y

    const ab2 = ABx * ABx + ABy * ABy
    const ap_ab = APx * ABx + APy * ABy

    let t = ab2 !== 0 ? ap_ab / ab2 : 0
    t = Math.max(0, Math.min(1, t))

    return {
        lng: A.x + ABx * t,
        lat: A.y + ABy * t,
        t
    }
}

const snapToRoute = (location, routeCoords) => {
    if (!routeCoords || routeCoords.length < 2) return location

    let bestPoint = null
    let minDist = Infinity
    let bestIndex = 0

    for (let i = 0; i < routeCoords.length - 1; i++) {
        const snapped = projectPointOnSegment(
            location,
            routeCoords[i],
            routeCoords[i + 1]
        )

        const dist = calculateDistance(
            location.lat,
            location.lng,
            snapped.lat,
            snapped.lng
        )

        if (dist < minDist) {
            minDist = dist
            bestPoint = snapped
            bestIndex = i
        }
    }

    return { point: bestPoint, index: bestIndex }
}

const getLookAheadPoint = (routeCoords, startIndex, distanceMeters = 40) => {
    let remaining = distanceMeters

    for (let i = startIndex; i < routeCoords.length - 1; i++) {
        const a = routeCoords[i]
        const b = routeCoords[i + 1]

        const segmentDist = calculateDistance(a[1], a[0], b[1], b[0]) * 1000

        if (segmentDist >= remaining) {
            const ratio = remaining / segmentDist

            return {
                lat: a[1] + (b[1] - a[1]) * ratio,
                lng: a[0] + (b[0] - a[0]) * ratio
            }
        }

        remaining -= segmentDist
    }

    return {
        lat: routeCoords.at(-1)[1],
        lng: routeCoords.at(-1)[0]
    }
}

const smoothBearing = (current, target, factor = 0.12) => {
    let diff = target - current

    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360

    return current + diff * factor
}

const enableGPSFollowMode = (location) => {
    if (!map || !mapInitialized || !location) return

    // 🔥 NEW: compute route bearing
    let routeBearing = null

    if (currentRouteData?.coordinates?.length > 1) {
        routeBearing = getRouteInitialBearing(
            location,
            currentRouteData.coordinates
        )
    }

    // fallback to device heading if no route yet
    const finalBearing = routeBearing ?? lastHeading ?? map.getBearing()

    // set orientation BEFORE flying (important for smoothness)
    setMapBearing(finalBearing, { animate: true, duration: 500 })

    // tilt for navigation feel
    setMapPitch(75, { animate: true })

    const gpsZoom = 18
    lastZoomLevel.value = gpsZoom

    map.flyTo({
        center: [location.lng, location.lat],
        zoom: gpsZoom,
        bearing: finalBearing, // 🔥 important
        duration: 850,
        essential: true,
        pitch: 75
    })

    if (locationWatchInterval) {
        clearInterval(locationWatchInterval)
    }

    locationWatchInterval = setInterval(async () => {
        if (!gpsModeEnabled.value || !map || !mapInitialized) {
            clearInterval(locationWatchInterval)
            locationWatchInterval = null
            return
        }

        await updateGPSLocation()
    }, 1200)
}

const getRouteInitialBearing = (userLocation, routeCoords) => {
    if (!routeCoords || routeCoords.length < 2) return 0

    // find nearest route point index (optional improvement)
    const nextPoint = routeCoords[1] // simple approach

    return calculateHeading(
        userLocation.lat,
        userLocation.lng,
        nextPoint[1],
        nextPoint[0]
    )
}

// Improve GPS location tracking with requestAnimationFrame
let animationFrameId = null
let lastGPSPosition = null

const updateGPSLocation = async () => {
    if (!gpsModeEnabled.value || !map || !mapInitialized) return

    let newLocation = null

    if (isCapacitor()) {
        try {
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 5000
            })
            newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }
        } catch (err) {
            console.error('GPS location update failed:', err)
            return
        }
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }
            updateMapPosition(newLocation)
        }, (err) => {
            console.error('GPS location update failed:', err)
        }, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 1000 // Add maximum age for smoother updates
        })
        return
    }

    if (newLocation &&
        (!lastGPSPosition ||
            Math.abs(newLocation.lat - lastGPSPosition.lat) > 0.00001 ||
            Math.abs(newLocation.lng - lastGPSPosition.lng) > 0.00001)) {

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId)
        }

        animationFrameId = requestAnimationFrame(() => {
            updateMapPosition(newLocation)
            lastGPSPosition = newLocation
            animationFrameId = null
        })
    }
}

const updateMapPosition = (location) => {
    if (!gpsModeEnabled.value || !map || !mapInitialized || !location) return

    const route = currentRouteData?.coordinates
    if (!route) return

    // 1. SNAP USER TO ROUTE
    const snapped = snapToRoute(location, route)
    const snappedPoint = snapped.point

    if (!snappedPoint) return

    const snappedLocation = {
        lat: snappedPoint.lat,
        lng: snappedPoint.lng
    }

    coordinates.value = snappedLocation

    if (userMarker) {
        userMarker.setLngLat([snappedLocation.lng, snappedLocation.lat])
    }

    // 2. LOOK-AHEAD TARGET (navigation feel)
    const lookAhead = getLookAheadPoint(route, snapped.index, 50)

    // 3. COMPUTE TARGET BEARING
    const targetBearing = calculateHeading(
        snappedLocation.lat,
        snappedLocation.lng,
        lookAhead.lat,
        lookAhead.lng
    )

    // 4. SMOOTH ROTATION (progressive heading)
    const currentMapBearing = map.getBearing()
    const newBearing = smoothBearing(currentMapBearing, targetBearing)

    map.setBearing(newBearing)
    currentBearing.value = newBearing

    // 5. SMOOTH CAMERA FOLLOW
    map.easeTo({
        center: [snappedLocation.lng, snappedLocation.lat],
        zoom: lastZoomLevel.value,
        pitch: currentPitch.value,
        duration: 250,
        easing: (t) => t
    })

    // 6. ROUTE UPDATE (optional debounce already exists)
    debouncedUpdateRoute()
    updateDestinationMarker()
}

const updateMapRotationForGPS = () => {
    if (!gpsModeEnabled.value || !map || !mapInitialized) return

    if (lastHeading !== null) {
        // Smoothly rotate to face the direction of travel
        const currentMapBearing = map.getBearing()
        let delta = lastHeading - currentMapBearing

        // Shortest path rotation
        if (delta > 180) delta -= 360
        if (delta < -180) delta += 360

        // Smooth rotation with easing
        const newBearing = currentMapBearing + delta * 0.3
        map.easeTo({
            bearing: newBearing,
            duration: 300,
            easing: (t) => t
        })
        currentBearing.value = newBearing
        emit('bearing-changed', newBearing)
    }
}

// ==================== Rotation Methods ====================
const setMapBearing = (bearing, options = { animate: true, duration: 300 }) => {
    if (!map || !mapInitialized) return

    try {
        const normalizedBearing = ((bearing % 360) + 360) % 360
        if (options.animate) {
            map.easeTo({
                bearing: normalizedBearing,
                duration: options.duration || 300,
                easing: (t) => {
                    // Smooth easing function
                    return 1 - Math.pow(1 - t, 3)
                }
            })
        } else {
            map.setBearing(normalizedBearing)
        }
        currentBearing.value = normalizedBearing
        emit('bearing-changed', normalizedBearing)
    } catch (error) {
        console.error('Error setting map bearing:', error)
    }
}

const getCurrentBearing = () => {
    if (!map || !mapInitialized) return 0
    return map.getBearing()
}

const resetRotation = () => {
    if (gpsModeEnabled.value) {
        toggleGPSMode() // Disable GPS mode when manually resetting
    }
    setMapBearing(0, { animate: true })
}

const rotateMap = (deltaDegrees) => {
    if (gpsModeEnabled.value) {
        toggleGPSMode()
    }
    const newBearing = (currentBearing.value + deltaDegrees) % 360
    setMapBearing(newBearing, { animate: true, duration: 400 })
}

// ==================== 3D Tilt Methods ====================
const setMapPitch = (pitch, options = { animate: true, duration: 300 }) => {
    if (!map || !mapInitialized) return

    try {
        const normalizedPitch = Math.min(maxPitch, Math.max(minPitch, pitch))
        if (options.animate) {
            map.easeTo({
                pitch: normalizedPitch,
                duration: options.duration || 300,
                easing: (t) => {
                    // Smooth easing for pitch
                    return t < 0.5
                        ? 4 * t * t * t
                        : 1 - Math.pow(-2 * t + 2, 3) / 2
                }
            })
        } else {
            map.setPitch(normalizedPitch)
        }
        currentPitch.value = normalizedPitch
        emit('pitch-changed', normalizedPitch)
    } catch (error) {
        console.error('Error setting map pitch:', error)
    }
}

const getCurrentPitch = () => {
    if (!map || !mapInitialized) return 0
    return map.getPitch()
}

const increaseTilt = () => {
    if (gpsModeEnabled.value && currentPitch.value >= 40) {
        // Allow tilt adjustment even in GPS mode
    }
    const newPitch = Math.min(maxPitch, currentPitch.value + 10)
    setMapPitch(newPitch, { animate: true })
}

const decreaseTilt = () => {
    const newPitch = Math.max(minPitch, currentPitch.value - 10)
    setMapPitch(newPitch, { animate: true })
}

const resetTilt = () => {
    setMapPitch(defaultPitch, { animate: true })
}

const enable3DMode = () => {
    setMapPitch(60, { animate: true })
}

// ==================== Helper Functions ====================
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

const getTravelTime = (distanceKm, speedKmPerHour = 5) => {
    const timeHours = distanceKm / speedKmPerHour
    const timeMinutes = Math.round(timeHours * 60)
    return Math.max(1, timeMinutes)
}

// Add these to your reactive state at the top
let connectionSource = null
let connectionLayer = null

// Update clearRouteLayers
const clearRouteLayers = () => {
    try {
        if (routeLayer && map && map.getLayer(routeLayer)) {
            map.removeLayer(routeLayer)
            routeLayer = null
        }
        if (routeArrowLayer && map && map.getLayer(routeArrowLayer)) {
            map.removeLayer(routeArrowLayer)
            routeArrowLayer = null
        }
        if (glowRouteLayer && map && map.getLayer(glowRouteLayer)) {
            map.removeLayer(glowRouteLayer)
            glowRouteLayer = null
        }
        if (routeSource && map && map.getSource(routeSource)) {
            map.removeSource(routeSource)
            routeSource = null
        }

        // Clean up connection layer
        if (connectionLayer && map && map.getLayer(connectionLayer)) {
            map.removeLayer(connectionLayer)
            connectionLayer = null
        }
        if (connectionSource && map && map.getSource(connectionSource)) {
            map.removeSource(connectionSource)
            connectionSource = null
        }

        currentRouteSource = null
        currentRouteData = null
    } catch (err) {
        console.warn('Error clearing route layers:', err)
    }
}
// Cancel ongoing route request
const cancelRouteRequest = () => {
    if (currentRouteController) {
        currentRouteController.abort()
        currentRouteController = null
    }
}

// Draw route line using MapLibre
const drawOsrmRoute = async () => {
    if (!map || !mapInitialized || !coordinates.value || !props.latitudeOnMap || !props.longitudeOnMap) {
        return
    }

    cancelRouteRequest()
    clearRouteLayers()

    const cacheKey = `${coordinates.value.lat},${coordinates.value.lng}|${props.latitudeOnMap},${props.longitudeOnMap}`

    const cachedRoute = routeCache.get(cacheKey)
    if (cachedRoute && Date.now() - cachedRoute.timestamp < 30000) {
        currentRouteData = cachedRoute.data
        renderRoute(cachedRoute.data)
        return
    }

    try {
        currentRouteController = new AbortController()

        const start = `${coordinates.value.lng},${coordinates.value.lat}`
        const end = `${props.longitudeOnMap},${props.latitudeOnMap}`
        const url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?geometries=geojson&overview=full`

        const response = await fetch(url, {
            signal: currentRouteController.signal
        })

        const data = await response.json()

        if (data.routes && data.routes[0]) {
            const routeData = {
                coordinates: data.routes[0].geometry.coordinates,
                distance: data.routes[0].distance,
                duration: data.routes[0].duration
            }

            routeCache.set(cacheKey, {
                data: routeData,
                timestamp: Date.now()
            })

            currentRouteData = routeData
            renderRoute(routeData)
            currentRouteSource = 'osrm'
        } else {
            console.warn('OSRM route not available')
            currentRouteSource = null
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('OSRM routing error:', err)
            currentRouteSource = null
        }
    } finally {
        currentRouteController = null
    }
}

// Update renderRoute to use the global connection variables
const renderRoute = (routeData) => {
    if (!map || !mapInitialized) return

    try {
        let { coordinates: routeCoords, distance, duration } = routeData
        let needsConnection = false
        let connectionCoords = null

        // Check if we need to add a direct connection from user location
        if (coordinates.value && routeCoords.length > 0) {
            const firstRoutePoint = routeCoords[0]
            const distanceToFirstPoint = calculateDistance(
                coordinates.value.lat,
                coordinates.value.lng,
                firstRoutePoint[1],
                firstRoutePoint[0]
            ) * 1000 // Convert to meters

            // If user is more than 20 meters from the route start, create separate connection
            if (distanceToFirstPoint > 20) {
                connectionCoords = [
                    [coordinates.value.lng, coordinates.value.lat],
                    firstRoutePoint
                ]
                // Remove the first point from routeCoords since we'll draw it separately
                routeCoords = routeCoords.slice(1)
                needsConnection = true
            }
        }

        // Create GeoJSON source for the main route
        const routeGeojson = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: routeCoords
            }
        }

        routeSource = 'route-' + Date.now()

        map.addSource(routeSource, {
            type: 'geojson',
            data: routeGeojson
        })

        // Add glow line (background)
        const glowLayerId = routeSource + '-glow'
        map.addLayer({
            id: glowLayerId,
            type: 'line',
            source: routeSource,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#D2691E',
                'line-width': 8,
                'line-opacity': 0.2
            }
        })
        glowRouteLayer = glowLayerId

        // Add main route line
        const lineLayerId = routeSource + '-line'
        map.addLayer({
            id: lineLayerId,
            type: 'line',
            source: routeSource,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#8B4513',
                'line-width': 5,
                'line-opacity': 0.9
            }
        })
        routeLayer = lineLayerId

        const arrowLayerId = routeSource + '-arrows'
        map.addLayer({
            id: arrowLayerId,
            type: 'symbol',
            source: routeSource,
            layout: {
                'symbol-placement': 'line',
                'symbol-spacing': 90,
                'text-field': '➤',
                'text-size': 16,
                'text-keep-upright': false,
                'text-rotation-alignment': 'map',
                'text-pitch-alignment': 'map',
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#0d47a1',
                'text-halo-width': 1.2
            }
        })
        routeArrowLayer = arrowLayerId

        // Add connection line as a separate source and layer if needed
        if (needsConnection && connectionCoords) {
            connectionSource = 'connection-' + Date.now()
            const connectionGeojson = {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: connectionCoords
                }
            }

            map.addSource(connectionSource, {
                type: 'geojson',
                data: connectionGeojson
            })

            connectionLayer = connectionSource + '-line'
            map.addLayer({
                id: connectionLayer,
                type: 'line',
                source: connectionSource,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#8B4513',
                    'line-width': 4,
                    'line-dasharray': [2, 3],
                    'line-opacity': 0.8
                }
            })
        }

        // Add distance label at midpoint of the main route
        if (routeCoords.length > 0) {
            const midIndex = Math.floor(routeCoords.length / 2)
            const midPoint = routeCoords[midIndex]
            const distanceKm = distance / 1000
            const minutes = Math.round(duration / 60)

            // Create popup for distance
            const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
                .setLngLat(midPoint)
                .setHTML(`
                    <div style="background: #8B4513; color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                        ${minutes} min • ${distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
                    </div>
                `)
                .addTo(map)

            // Auto-remove popup after 5 seconds
            setTimeout(() => {
                if (popup) popup.remove()
            }, 5000)
        }

    } catch (err) {
        console.error('Error rendering route:', err)
    }
}
// Re-render route after style change
const rerenderRouteAfterStyleChange = () => {
    if (currentRouteData && map && mapInitialized) {
        // Small delay to ensure style is fully loaded
        setTimeout(() => {
            if (currentRouteData && map && mapInitialized) {
                renderRoute(currentRouteData)
            }
        }, 100)
    }
}

// Debounced route update
const debouncedUpdateRoute = () => {
    if (routeUpdateTimeout) {
        clearTimeout(routeUpdateTimeout)
    }
    routeUpdateTimeout = setTimeout(() => {
        if (coordinates.value && props.latitudeOnMap && props.longitudeOnMap) {
            drawOsrmRoute()
        }
        routeUpdateTimeout = null
    }, ROUTE_UPDATE_DEBOUNCE)
}

// Reverse geocoding with caching
const reverseGeocode = async (lat, lng) => {
    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`

    if (addressCache.has(cacheKey)) {
        const cached = addressCache.get(cacheKey)
        if (Date.now() - cached.timestamp < 60000) {
            return cached.address
        }
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                    'User-Agent': 'Locinder Map Application'
                }
            }
        )
        const data = await response.json()

        if (data && data.display_name) {
            const address = data.address
            let formattedAddress = ''

            if (address.road || address.pedestrian) {
                formattedAddress += address.road || address.pedestrian || ''
            }
            if (address.suburb) {
                formattedAddress += formattedAddress ? `, ${address.suburb}` : address.suburb
            }
            if (address.city || address.town || address.village) {
                const city = address.city || address.town || address.village
                formattedAddress += formattedAddress ? `, ${city}` : city
            }
            if (address.postcode) {
                formattedAddress += formattedAddress ? ` ${address.postcode}` : address.postcode
            }

            const result = formattedAddress || data.display_name.split(',')[0]

            addressCache.set(cacheKey, {
                address: result,
                timestamp: Date.now()
            })

            return result
        }
        return 'Address not found'
    } catch (error) {
        console.error('Reverse geocoding error:', error)
        return 'Address unavailable'
    }
}

// Throttled address update
const throttledUpdateAddress = async (lat, lng, shouldOpenPopup = false) => {
    const now = Date.now()
    if (now - lastAddressUpdate < ADDRESS_UPDATE_THROTTLE) {
        if (addressUpdateTimeout) {
            clearTimeout(addressUpdateTimeout)
        }
        addressUpdateTimeout = setTimeout(async () => {
            await updateUserMarkerWithAddress(lat, lng, shouldOpenPopup)
            addressUpdateTimeout = null
        }, ADDRESS_UPDATE_THROTTLE - (now - lastAddressUpdate))
        return
    }

    lastAddressUpdate = now
    await updateUserMarkerWithAddress(lat, lng, shouldOpenPopup)
}

// Update user marker with address
const updateUserMarkerWithAddress = async (lat, lng, shouldOpenPopup = true) => {
    if (!userMarker || !map) return

    const address = await reverseGeocode(lat, lng)
    userAddress.value = address

    const popup = new maplibregl.Popup({ closeButton: false })
        .setHTML(`
            <div style="text-align: center; min-width: 200px;">
                <strong style="font-size: 14px;">📍 You are here</strong><br>
                <small style="font-size: 11px; color: #666;">${address}</small>
            </div>
        `)

    userMarker.setPopup(popup)

    if (shouldOpenPopup) {
        userMarker.togglePopup()
        setTimeout(() => {
            if (userMarker) {
                userMarker.getPopup().remove()
            }
        }, 10000)
    }
}

// Computed distance properties
const distanceMinutes = computed(() => {
    if (!coordinates.value || !props.latitudeOnMap || !props.longitudeOnMap) return 0

    const distanceKm = calculateDistance(
        coordinates.value.lat,
        coordinates.value.lng,
        props.latitudeOnMap,
        props.longitudeOnMap
    )
    return getTravelTime(distanceKm, 5)
})

const distanceText = computed(() => {
    if (!coordinates.value || !props.latitudeOnMap || !props.longitudeOnMap) return ''

    const distanceKm = calculateDistance(
        coordinates.value.lat,
        coordinates.value.lng,
        props.latitudeOnMap,
        props.longitudeOnMap
    )
    const minutes = getTravelTime(distanceKm, 5)

    let distanceDisplay = ''
    if (distanceKm < 1) {
        distanceDisplay = `${Math.round(distanceKm * 1000)}m`
    } else {
        distanceDisplay = `${distanceKm.toFixed(1)}km`
    }

    if (minutes === 1) {
        return `est. 1 min away (${distanceDisplay})`
    }
    return `est. ${minutes} mins away (${distanceDisplay})`
})

const distanceIcon = computed(() => {
    const minutes = distanceMinutes.value
    if (minutes <= 5) return '🚶‍♂️'
    if (minutes <= 10) return '🚶'
    if (minutes <= 20) return '🚲'
    if (minutes <= 30) return '🚗'
    return '🚌'
})

const distanceClass = computed(() => {
    const minutes = distanceMinutes.value
    if (minutes <= 5) return 'distance-very-close'
    if (minutes <= 10) return 'distance-close'
    if (minutes <= 20) return 'distance-moderate'
    if (minutes <= 30) return 'distance-far'
    return 'distance-very-far'
})

const updateDestinationMarker = () => {
    if (!map || !mapInitialized || !props.latitudeOnMap || !props.longitudeOnMap) return

    try {
        if (destinationMarker) {
            destinationMarker.remove()
            destinationMarker = null
        }

        // Create custom marker element
        const markerEl = document.createElement('div')
        markerEl.innerHTML = `<div style="background-color: #ff4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px rgba(0,0,0,0.3);"></div>`
        markerEl.style.cursor = 'pointer'

        destinationMarker = new maplibregl.Marker({ element: markerEl })
            .setLngLat([props.longitudeOnMap, props.latitudeOnMap])
            .addTo(map)

        let distanceDisplay = ''
        if (coordinates.value) {
            const distanceKm = calculateDistance(
                coordinates.value.lat,
                coordinates.value.lng,
                props.latitudeOnMap,
                props.longitudeOnMap
            )
            const minutes = getTravelTime(distanceKm, 5)
            distanceDisplay = `est. ${minutes} mins away`
        }

        const popup = new maplibregl.Popup({ closeButton: true })
            .setHTML(`
                <div style="text-align: center;">
                    <strong>📍 ${props.nameOnMap} Branch</strong><br>
                    ${props.addressOnMap}<br>
                    ${distanceDisplay ? `<small>${distanceDisplay}</small>` : ''}
                </div>
            `)

        destinationMarker.setPopup(popup)

    } catch (err) {
        console.error('Error updating destination marker:', err)
    }
}

const refreshLocation = async () => {
    if (map && mapInitialized) {
        await updateUserMarker()
    }
}

const updateUserMarker = async () => {
    if (!map || !mapInitialized) return

    const hasPermission = await checkLocationPermission()
    if (!hasPermission && isCapacitor()) {
        loading.value = false
        return
    }

    loading.value = true
    error.value = null

    if (!isCapacitor()) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const userLat = position.coords.latitude
                const userLng = position.coords.longitude

                coordinates.value = {
                    lat: userLat,
                    lng: userLng
                }

                if (userMarker) {
                    userMarker.setLngLat([userLng, userLat])
                    await throttledUpdateAddress(userLat, userLng, true)
                } else {
                    // Create custom user marker
                    const markerEl = document.createElement('div')
                    markerEl.innerHTML = `<div style="background-color: #4CAF50; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px rgba(0,0,0,0.3); animation: pulse-green 2s ease-in-out infinite;"></div>`

                    userMarker = new maplibregl.Marker({ element: markerEl })
                        .setLngLat([userLng, userLat])
                        .addTo(map)

                    await throttledUpdateAddress(userLat, userLng, true)
                }

                debouncedUpdateRoute()
                updateDestinationMarker()

                map.flyTo({
                    center: [userLng, userLat],
                    zoom: 15,
                    duration: 1000
                })

                loading.value = false
            },
            (err) => {
                console.error('Error getting user location:', err)
                error.value = 'Could not get your location. Please check your location settings.'

                if (map && props.latitudeOnMap && props.longitudeOnMap) {
                    map.flyTo({
                        center: [props.longitudeOnMap, props.latitudeOnMap],
                        zoom: 15,
                        duration: 1000
                    })
                }
                loading.value = false
            },
            {
                enableHighAccuracy: true,
                timeout: 10000
            }
        )
    } else {
        try {
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000
            })

            const userLat = position.coords.latitude
            const userLng = position.coords.longitude

            coordinates.value = {
                lat: userLat,
                lng: userLng
            }

            if (userMarker) {
                userMarker.setLngLat([userLng, userLat])
                await throttledUpdateAddress(userLat, userLng, true)
            } else {
                const markerEl = document.createElement('div')
                markerEl.innerHTML = `<div style="background-color: #4CAF50; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px rgba(0,0,0,0.3);"></div>`

                userMarker = new maplibregl.Marker({ element: markerEl })
                    .setLngLat([userLng, userLat])
                    .addTo(map)

                await throttledUpdateAddress(userLat, userLng, true)
            }

            debouncedUpdateRoute()
            updateDestinationMarker()

            map.flyTo({
                center: [userLng, userLat],
                zoom: 15,
                duration: 1000
            })

            loading.value = false
        } catch (err) {
            console.error('Error getting user location:', err)
            error.value = 'Could not get your location. Please check your location settings.'

            if (map && props.latitudeOnMap && props.longitudeOnMap) {
                map.flyTo({
                    center: [props.longitudeOnMap, props.latitudeOnMap],
                    zoom: 15,
                    duration: 1000
                })
            }
            loading.value = false
        }
    }
}

const setGPSZoomLevel = (zoom) => {
    lastZoomLevel.value = Math.min(22, Math.max(15, zoom))
    if (gpsModeEnabled.value && coordinates.value) {
        map.easeTo({
            center: [coordinates.value.lng, coordinates.value.lat],
            zoom: lastZoomLevel.value,
            duration: 500
        })
    }
}

const startWatchingLocation = () => {
    if (!navigator.geolocation && !isCapacitor()) return

    let lastUpdateTime = 0
    const UPDATE_THROTTLE = 5000

    if (isCapacitor()) {
        watchId = setInterval(async () => {
            if (!permissionGranted.value) return

            const now = Date.now()
            if (now - lastUpdateTime < UPDATE_THROTTLE) return

            try {
                const position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000,
                })

                const newLat = position.coords.latitude
                const newLng = position.coords.longitude

                if (coordinates.value) {
                    const distanceMoved = calculateDistance(
                        coordinates.value.lat,
                        coordinates.value.lng,
                        newLat,
                        newLng
                    ) * 1000

                    if (distanceMoved < 10) return

                    // Calculate heading for GPS mode
                    if (gpsModeEnabled.value && lastPosition) {
                        lastHeading = calculateHeading(
                            lastPosition.lat, lastPosition.lng,
                            newLat, newLng
                        )
                        updateMapRotationForGPS()

                        // Also update map position with zoom in GPS mode
                        if (gpsModeEnabled.value) {
                            map.easeTo({
                                center: [newLng, newLat],
                                zoom: lastZoomLevel.value,
                                duration: 800
                            })
                        }
                    }
                    lastPosition = { lat: newLat, lng: newLng }
                }

                coordinates.value = {
                    lat: newLat,
                    lng: newLng
                }

                if (userMarker && map && mapInitialized) {
                    userMarker.setLngLat([newLng, newLat])

                    if (now - lastUpdateTime > UPDATE_THROTTLE) {
                        lastUpdateTime = now
                        await throttledUpdateAddress(newLat, newLng, false)
                    }

                    debouncedUpdateRoute()
                    updateDestinationMarker()
                }
            } catch (err) {
                console.error('Watch position error:', err)
            }
        }, LOCATION_WATCH_INTERVAL)
    } else {
        watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const now = Date.now()
                const newLat = position.coords.latitude
                const newLng = position.coords.longitude

                if (coordinates.value) {
                    const distanceMoved = calculateDistance(
                        coordinates.value.lat,
                        coordinates.value.lng,
                        newLat,
                        newLng
                    ) * 1000

                    if (distanceMoved < 10) return

                    // Calculate heading for GPS mode
                    if (gpsModeEnabled.value && lastPosition) {
                        lastHeading = calculateHeading(
                            lastPosition.lat, lastPosition.lng,
                            newLat, newLng
                        )
                        updateMapRotationForGPS()

                        // Also update map position with zoom in GPS mode
                        if (gpsModeEnabled.value && map && mapInitialized) {
                            map.easeTo({
                                center: [newLng, newLat],
                                zoom: lastZoomLevel.value,
                                duration: 800
                            })
                        }
                    }
                    lastPosition = { lat: newLat, lng: newLng }
                }

                coordinates.value = {
                    lat: newLat,
                    lng: newLng
                }

                if (userMarker && map && mapInitialized) {
                    userMarker.setLngLat([newLng, newLat])

                    if (now - lastUpdateTime > UPDATE_THROTTLE) {
                        lastUpdateTime = now
                        await throttledUpdateAddress(newLat, newLng, false)
                    }

                    debouncedUpdateRoute()
                    updateDestinationMarker()
                }
            },
            (err) => {
                console.error('Watch position error:', err)
                if (err.code === 2 || err.code === 3) {
                    showGpsGuidance.value = true
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        )
    }
}

const stopWatchingLocation = () => {
    if (isCapacitor() && watchId) {
        clearInterval(watchId)
        watchId = null
    } else if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
        watchId = null
    }
    lastPosition = null
    lastHeading = null
}

const initMap = () => {
    if (mapInitialized) return

    const mapContainer = document.getElementById('map')
    if (!mapContainer) {
        console.error('Map container not found!')
        error.value = 'Map container not found'
        return
    }

    const defaultCenter = [props.longitudeOnMap, props.latitudeOnMap]

    try {
        map = new maplibregl.Map({
            container: 'map',
            style: mapStyles[0].url,
            center: defaultCenter,
            zoom: 15,
            bearing: currentBearing.value,
            pitch: currentPitch.value,
            minPitch: minPitch,
            maxPitch: maxPitch,
            renderWorldCopies: false,
            antialias: true,
            preserveDrawingBuffer: false,
            fadeDuration: 0,
            crossSourceCollisions: false,
            dragRotate: true,
            dragPan: true,
            touchZoomRotate: true,
            touchPitch: true,
            doubleClickZoom: true,
            pitchWithRotate: true,
            bearingSnap: 2,
            cooperativeGestures: false,
            scrollZoom: {
                around: 'center',
                smooth: true
            }
        })

        // Add minimal navigation control
        map.addControl(new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true
        }), 'top-right')

        // ============ ADD INERTIA EVENT LISTENERS HERE ============

        // Optional: Add momentum scrolling with map's built-in events
        map.on('moveend', () => {
            // You can add additional logic here if needed
            if (!isPanning && inertiaFrame) {
                // Inertia is handling the movement
            }
        })

        // ============ END INERTIA SETUP ============

        map.on('load', () => {
            mapInitialized = true

            if (map.style && map.style.stylesheet) {
                map.setMaxPitch(maxPitch)
                map.setMinPitch(minPitch)
            }

            updateDestinationMarker()
            updateUserMarker()
            startWatchingLocation()
            emit('map-ready')

            setTimeout(() => {
                map.resize()
            }, 100)
        })

        map.on('rotate', () => {
            if (!gpsModeEnabled.value) {
                currentBearing.value = map.getBearing()
                emit('bearing-changed', currentBearing.value)
            }
        })

        map.on('pitch', () => {
            currentPitch.value = map.getPitch()
            emit('pitch-changed', currentPitch.value)
        })

        map.dragRotate.enable()
        map.touchZoomRotate.enable()

        // Ensure map is responsive to window resize
        window.addEventListener('resize', () => {
            if (map) {
                map.resize()
            }
        })

    } catch (err) {
        console.error('Failed to initialize map:', err)
        error.value = 'Failed to load map'
        mapInitialized = false
    }
}

const setupTouchGestures = () => {
    const mapElement = document.getElementById('map')
    if (!mapElement) return

    mapElement.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            // Pinch gesture detected
            touchStart = {
                x1: e.touches[0].clientX,
                y1: e.touches[0].clientY,
                x2: e.touches[1].clientX,
                y2: e.touches[1].clientY,
                distance: Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                )
            }
        }
    })

    mapElement.addEventListener('touchmove', (e) => {
        if (touchStart && e.touches.length === 2) {
            const newDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            )

            // Dynamically adjust zoom sensitivity based on pinch speed
            const delta = newDistance - touchStart.distance
            const sensitivity = Math.abs(delta) > 50 ? 0.02 : 0.01
            const zoomDelta = delta * sensitivity

            if (map && mapInitialized) {
                const newZoom = Math.min(22, Math.max(1, map.getZoom() + zoomDelta))
                map.setZoom(newZoom)
            }

            touchStart.distance = newDistance
        }
    })

    mapElement.addEventListener('touchend', () => {
        touchStart = null
    })
}

const startInertia = () => {
    if (inertiaFrame) cancelAnimationFrame(inertiaFrame)

    // Only apply inertia if there's significant velocity
    if (Math.abs(inertiaVelocity.x) < 0.5 && Math.abs(inertiaVelocity.y) < 0.5) {
        inertiaVelocity = { x: 0, y: 0 }
        return
    }

    const applyInertia = () => {
        if (!map || !mapInitialized) {
            inertiaVelocity = { x: 0, y: 0 }
            return
        }

        // Apply friction
        inertiaVelocity.x *= 0.95
        inertiaVelocity.y *= 0.95

        // Stop when velocity is very low
        if (Math.abs(inertiaVelocity.x) < 0.1 && Math.abs(inertiaVelocity.y) < 0.1) {
            inertiaVelocity = { x: 0, y: 0 }
            inertiaFrame = null
            return
        }

        // Calculate new center based on velocity
        const center = map.getCenter()
        const zoom = map.getZoom()

        // Convert screen velocity to geographical delta
        const metersPerPixel = 156543.03392 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom)
        const lngDelta = (inertiaVelocity.x * metersPerPixel * 0.00001) / (Math.cos(center.lat * Math.PI / 180))
        const latDelta = inertiaVelocity.y * metersPerPixel * 0.00001

        const newCenter = {
            lng: center.lng - lngDelta,
            lat: center.lat - latDelta
        }

        // Apply smooth movement
        map.easeTo({
            center: [newCenter.lng, newCenter.lat],
            duration: 16, // 60fps
            easing: (t) => t // Linear for inertia
        })

        inertiaFrame = requestAnimationFrame(applyInertia)
    }

    inertiaFrame = requestAnimationFrame(applyInertia)
}

const trackPanMovement = (e) => {
    if (!map || !mapInitialized) return

    const currentTime = Date.now()
    const currentPos = {
        x: e.clientX || (e.touches && e.touches[0]?.clientX) || 0,
        y: e.clientY || (e.touches && e.touches[0]?.clientY) || 0
    }

    if (lastPanPosition && lastPanTime) {
        const timeDiff = Math.max(1, currentTime - lastPanTime)
        const velocityX = (currentPos.x - lastPanPosition.x) / timeDiff
        const velocityY = (currentPos.y - lastPanPosition.y) / timeDiff

        // Smooth velocity to reduce jitter
        inertiaVelocity.x = inertiaVelocity.x * 0.7 + velocityX * 0.3
        inertiaVelocity.y = inertiaVelocity.y * 0.7 + velocityY * 0.3

        // Cap maximum velocity
        inertiaVelocity.x = Math.min(5, Math.max(-5, inertiaVelocity.x))
        inertiaVelocity.y = Math.min(5, Math.max(-5, inertiaVelocity.y))
    }

    lastPanPosition = currentPos
    lastPanTime = currentTime
    isPanning = true
}

const stopPanAndApplyInertia = () => {
    if (!isPanning) return

    isPanning = false

    // Only apply inertia if dragging ended recently and velocity is significant
    if (Date.now() - lastPanTime < 100 &&
        (Math.abs(inertiaVelocity.x) > 0.3 || Math.abs(inertiaVelocity.y) > 0.3)) {
        startInertia()
    } else {
        inertiaVelocity = { x: 0, y: 0 }
    }

    lastPanPosition = null
    lastPanTime = 0
}

const changeMapStyle = (style) => {
    if (!map || !mapInitialized) return

    // Save current route data before style change
    const savedRouteData = currentRouteData

    map.setStyle(style.url)
    currentStyle.value = style.id

    // Restore route after style loads
    if (savedRouteData) {
        map.once('styledata', () => {
            rerenderRouteAfterStyleChange()
        })
    }
}

// Cleanup function
const cleanup = () => {
    if (routeUpdateTimeout) {
        clearTimeout(routeUpdateTimeout)
    }
    if (addressUpdateTimeout) {
        clearTimeout(addressUpdateTimeout)
    }
    if (gpsUpdateFrame) {
        cancelAnimationFrame(gpsUpdateFrame)
    }
    if (locationWatchInterval) {
        clearInterval(locationWatchInterval)
        locationWatchInterval = null
    }
    cancelRouteRequest()
    stopWatchingLocation()
    if (map) {
        clearRouteLayers()
        map.remove()
        map = null
        mapInitialized = false
    }
    addressCache.clear()
    routeCache.clear()
}

// Expose methods to parent component
defineExpose({
    refreshLocation,
    setMapBearing,
    getCurrentBearing,
    resetRotation,
    rotateMap,
    currentBearing,
    setMapPitch,
    getCurrentPitch,
    increaseTilt,
    decreaseTilt,
    resetTilt,
    enable3DMode,
    currentPitch,
    toggleGPSMode,
    gpsModeEnabled,
    setGPSZoomLevel,
    checkLocationPermission,
    requestLocationPermission
})

// Watch for prop changes
watch(() => [props.latitudeOnMap, props.longitudeOnMap], () => {
    if (map && mapInitialized && props.latitudeOnMap && props.longitudeOnMap) {
        updateDestinationMarker()
        debouncedUpdateRoute()
        map.flyTo({
            center: [props.longitudeOnMap, props.latitudeOnMap],
            zoom: 15,
            duration: 1000
        })
    }
})

// Watch for coordinates changes to update route
watch(coordinates, () => {
    if (map && mapInitialized && coordinates.value) {
        debouncedUpdateRoute()
        updateDestinationMarker()
    }
})

// Lifecycle Hooks
onMounted(() => {
    setTimeout(() => {
        initMap()
        setupTouchGestures()
    }, 100)
})

onBeforeUnmount(() => {
    cleanup()
})
</script>

<style scoped>
/* User marker style - add pulse animation */
@keyframes pulse-green {

    0%,
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
    }

    50% {
        transform: scale(1.1);
        box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
    }
}

/* Wrapper styles */
.locinder-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin-top: 20px;
    margin-bottom: 20px;
}

.locinder-wrapper > div:not(#map) {
    pointer-events: auto;
}

.map {
    position: relative;
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 600px;
    z-index: 1;
    border-radius: 20px;
    overflow: hidden;
    border-bottom: 2px solid #ccc;
    transform: translateZ(0);
    will-change: transform;
    touch-action: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    pointer-events: auto;
}

.map-style-selector {
    position: absolute;
    margin-top: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    padding: 8px 12px;
    display: flex;
    gap: 8px;
}

.distance-badge {
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    background: white;
    white-space: nowrap;
}

.distance-very-close {
    background: #c8e6c9;
    color: #2e7d32;
}

.distance-close {
    background: #dcedc8;
    color: #33691e;
}

.distance-moderate {
    background: #fff9c4;
    color: #f57f17;
}

.distance-far {
    background: #ffe0b2;
    color: #e65100;
}

.distance-very-far {
    background: #ffcdd2;
    color: #c62828;
}

.distance-icon {
    font-size: 16px;
}

.distance-text {
    font-weight: 600;
}

.style-btn {
    padding: 6px 12px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 20px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.style-btn.active {
    background: #5c3a21;
    color: white;
    border-color: #5c3a21;
}

/* GPS Mode Toggle Button */
.gps-mode-toggle {
    position: absolute;
    bottom: 4%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    transition: all 0.2s ease;
}

.gps-mode-toggle .start-tracing-btn {
    border-radius: 20px;
    width: 220px;
    height: 40px;
    text-transform: none;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateX(10px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.distance-badge,
.gps-mode-toggle,
.tilt-control-group {
    pointer-events: none;
}

.distance-badge *,
.gps-mode-toggle *,
.tilt-control-group * {
    pointer-events: auto;
}

/* Tilt Control Group */
.tilt-control-group {
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.rotation-control {
    background: white;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
}

.rotation-control:hover {
    background: #f0f0f0;
    transform: scale(1.05);
}

.tilt-controls {
    background: white;
    border-radius: 30px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.tilt-control {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid #eee;
}

.tilt-control:last-child {
    border-bottom: none;
}

.tilt-control:hover {
    background: #f0f0f0;
}

.tilt-control:active {
    transform: scale(0.95);
}

/* Tilt Indicator */
.tilt-indicator {
    position: absolute;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    backdrop-filter: blur(8px);
    pointer-events: none;
    animation: fadeInOut 2s ease-out;
}

@keyframes fadeInOut {
    0% {
        opacity: 0;
        transform: translateY(10px);
    }

    20% {
        opacity: 1;
        transform: translateY(0);
    }

    80% {
        opacity: 1;
        transform: translateY(0);
    }

    100% {
        opacity: 0;
        transform: translateY(-10px);
    }
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    border-radius: 20px;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #5c3a21;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.status {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    padding: 8px 16px;
    font-size: 15px;
    border-radius: 8px;
    z-index: 1000;
    text-align: center;
}

.status.error {
    background: #ffebee;
    color: #c62828;
}

.status.success {
    background: #e8f5e9;
    color: #2e7d32;
}

.gps-guidance {
    position: absolute;
    bottom: 80px;
    left: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    border-radius: 12px;
    padding: 12px 16px;
    z-index: 1000;
}

.guidance-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.guidance-icon {
    font-size: 24px;
}

.guidance-text {
    flex: 1;
}

.guidance-text strong {
    display: block;
    margin-bottom: 4px;
    color: #ff0000;
}

.guidance-text p {
    font-size: 12px;
    opacity: 0.8;
    margin: 0;
    color: #fff;
}

.guidance-close {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0 8px;
}

/* Permission Overlay Styles */
.permission-overlay {
    position: absolute;
    height: 100%;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
}

.permission-card {
    max-width: 320px;
    padding: 24px;
    text-align: center;
    border-radius: 20px;
    margin: 20px;
}

.permission-card .btn-container {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
}

.permission-denied-banner {
    position: absolute;
    top: 20px;
    left: 16px;
    right: 16px;
    z-index: 1500;
}

.settings-link {
    color: #5c3a21;
    text-decoration: underline;
    cursor: pointer;
    font-weight: 500;
}

@media (max-width: 768px) {
    .map-style-selector {
        top: 0;
        padding: 6px 10px;
    }

    .distance-badge {
        top: 60px;
        padding: 6px 12px;
        font-size: 12px;
    }

    .tilt-control-group {
        bottom: 40px;
        left: 15px;
        gap: 8px;
    }

    .rotation-control,
    .tilt-control {
        width: 38px;
        height: 38px;
    }

    .tilt-controls {
        border-radius: 25px;
    }
}

/* MapLibre-specific overrides */
:deep(.maplibregl-ctrl-top-right) {
    top: 50px !important;
}

:deep(.maplibregl-canvas) {
    border-radius: 20px !important;
    border: 1px solid #ccc;
    /* Hardware acceleration for canvas */
    transform: translateZ(0);
    will-change: transform;

    /* Smoother rendering */
    image-rendering: crisp-edges;
    image-rendering: -webkit-optimize-contrast;
}

:deep(.maplibregl-canvas-container) {
    transform: translateZ(0);
    will-change: transform;
}

:deep(.maplibregl-ctrl-group) {
    border-radius: 8px !important;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s ease;
}

:deep(.maplibregl-ctrl-group:hover) {
    transform: scale(1.05);
}

:deep(.maplibregl-ctrl-compass) {
    /* transform-origin: center; */
    transition: transform 0.3s ease;
}

:deep(.maplibregl-ctrl-compass:hover) {
    transform: rotate(15deg);
}

:deep(.maplibregl-ctrl-compass .maplibregl-ctrl-icon) {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%235c3a21' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpolygon points='16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76'%3E%3C/polygon%3E%3C/svg%3E");
    background-size: 60%;
    background-position: center;
    background-repeat: no-repeat;
}

:deep(.maplibregl-ctrl-attrib.maplibregl-compact-show) {
    visibility: hidden !important;
}

:deep(.maplibregl-popup) {
    will-change: transform;
    transition: transform 0.2s ease-out;
}

:deep(.maplibregl-popup-content) {
    z-index: 9999;
    transition: all 0.2s ease;
}

:deep(.maplibregl-popup-close-button) {
    right: 8px;
    top: 8px;
}

:deep(.maplibregl-popup-anchor-bottom) {
    display: none !important;
}
</style>
