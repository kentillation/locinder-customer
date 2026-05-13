<template>
  <v-app dark>
    <!-- Connection Banner -->
    <div v-if="connectionStatus !== 'online'" class="connection-container">
      <div class="connection-banner" :class="connectionStatus">
        <v-icon class="mr-1">
          {{ connectionStatusIcon }}
        </v-icon>
        <span>{{ connectionStatusText }}</span>
      </div>
    </div>

    <!-- Main -->
    <v-main class="main-container" :class="{ 'mt-5': connectionStatus !== 'online' }">

      <!-- Bottom Navigation -->
      <template v-if="!isNotFoundPage">
        <v-app-bar v-if="showMenu" location="bottom" prominent>

          <!-- Home -->
          <div class="nav-item" :class="{ 'active-page': currentPage === 'HomePage' }" @click="goTo('/home')">
            <v-icon>mdi-home-variant-outline</v-icon>
            <span class="nav-text">Home</span>
          </div>

          <v-spacer />

          <!-- Stores -->
          <div class="nav-item" :class="{ 'active-page': currentPage === 'ShopList' }" @click="goTo('/shop-list')">
            <v-icon>mdi-store-outline</v-icon>
            <span class="nav-text">Stores</span>
          </div>

          <v-spacer />

          <!-- Signout -->
          <div class="nav-item" :class="{ 'active-page': signoutLoading }" @click="signingOut">

            <template v-if="signoutLoading">
                <v-progress-circular indeterminate color="grey" size="20" />
            </template>

            <template v-else>
              <v-icon >mdi-power</v-icon>
            </template>

            <span class="nav-text">
              {{ signoutLoading ? '' : 'Signout' }}
            </span>
          </div>
          
        </v-app-bar>
      </template>

      <!-- Pages -->
      <div class="app-container">
        <transition :name="transitionName" mode="out-in">
          <div :key="$route.fullPath" class="page-wrapper">
            <router-view />
          </div>
        </transition>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth';

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
let signoutLoading = ref(false)

/* ----------------------------------------------------------
 * Route / Navigation
 * ---------------------------------------------------------- */

const currentPage = computed(() => route.name)

const isNotFoundPage = computed(() => {
  return route.name === 'NotFound'
})

const showMenu = computed(() => {
  const allowedRoutes = ['HomePage', 'ShopList']
  return allowedRoutes.includes(route.name)
})

const goTo = (path) => {
  if (route.path !== path) {
    router.push(path)
  }
}

const signingOut = async () => {
  signoutLoading.value = true

  try {
    await authStore.logout()

    setTimeout(() => {
      window.location.href = '/';
    }, 1000)

  } catch (error) {
    console.error('Logout failed:', error)
  } finally {
    signoutLoading.value = false
  }
}

/* ----------------------------------------------------------
 * Page Transition
 * ---------------------------------------------------------- */

const transitionName = ref('slide-left')
const historyStack = []

router.beforeEach((to, from, next) => {
  const toIndex = historyStack.indexOf(to.fullPath)
  const fromIndex = historyStack.indexOf(from.fullPath)

  if (toIndex === -1) {
    historyStack.push(to.fullPath)
    transitionName.value = 'slide-left'
  } else {
    transitionName.value =
      toIndex < fromIndex ? 'slide-right' : 'slide-left'
  }

  next()
})

window.setPageTransition = (name) => {
  transitionName.value = name
}

/* ----------------------------------------------------------
 * Connection Status
 * ---------------------------------------------------------- */

const connectionStatus = ref('waiting')

let waitingTimeout = null
let connectionListener = null

const updateStatus = () => {
  if (!navigator.onLine) {
    connectionStatus.value = 'offline'
    return
  }

  if ('connection' in navigator) {
    const downlink = navigator.connection.downlink || 10

    if (downlink < 1) {
      connectionStatus.value = 'slow'
    } else {
      connectionStatus.value = 'online'
    }
  } else {
    connectionStatus.value = 'online'
  }
}

const simulateWaiting = () => {
  connectionStatus.value = 'waiting'

  waitingTimeout = setTimeout(() => {
    updateStatus()
  }, 1500)
}

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'offline':
      return 'No internet connection'

    case 'slow':
      return 'Low internet connection'

    case 'waiting':
      return 'Waiting for connection...'

    default:
      return ''
  }
})

const connectionStatusIcon = computed(() => {
  switch (connectionStatus.value) {
    case 'offline':
      return 'mdi-wifi-off'

    case 'slow':
      return 'mdi-wifi-alert'

    case 'waiting':
      return 'mdi-timer-sand'

    default:
      return ''
  }
})

/* ----------------------------------------------------------
 * Lifecycle
 * ---------------------------------------------------------- */

onMounted(() => {
  simulateWaiting()

  window.addEventListener('online', updateStatus)
  window.addEventListener('offline', updateStatus)

  if ('connection' in navigator) {
    connectionListener = () => updateStatus()

    navigator.connection.addEventListener(
      'change',
      connectionListener
    )
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('online', updateStatus)
  window.removeEventListener('offline', updateStatus)

  if ('connection' in navigator && connectionListener) {
    navigator.connection.removeEventListener(
      'change',
      connectionListener
    )
  }

  if (waitingTimeout) {
    clearTimeout(waitingTimeout)
  }
})
</script>

<style scoped>
/* ----------------------------------------------------------
 * Navigation
 * ---------------------------------------------------------- */
:deep(.v-toolbar__content) {
  /* height: 64px !important; */
  height: 50px !important;
  padding: 7px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 0.3cm;
  cursor: pointer;
  width: 50px;
  color: #a1a1a1;
  padding: 6px 0 6px 0;
}

.v-icon {
  /* font-size: 22px !important; */
  transition: all 0.3s ease;
}

.active-page {
  /* border-radius: 20%; */
  /* background-color: #a34400 !important; */
  color: #a34400 !important;
  font-weight: 600;
}

.nav-text {
  text-transform: none;
  font-size: 10px;
  padding-bottom: 2px !important;
}

.active-nav-text {
  font-weight: 600;
}
</style>