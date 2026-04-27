<template>
  <v-app dark>
    <div v-if="connectionStatus !== 'online'" class="connection-container">
      <div class="connection-banner" :class="connectionStatus">
        <v-icon left>
          {{ connectionStatusIcon }}
        </v-icon>
        <span>&nbsp;{{ connectionStatusText }}</span>
      </div>
    </div>
    <v-main class="main-container" :class="{ 'mt-5' : connectionStatus !== 'online'}">
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
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
// import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
// const route = useRoute()
const updateStatus = () => {
  if (!navigator.onLine) {
    connectionStatus.value = 'offline';
  } else {
    connectionStatus.value = 'online';
  }
};

let waitingTimeout;
const simulateWaiting = () => {
  connectionStatus.value = 'waiting';
  waitingTimeout = setTimeout(() => {
    connectionStatus.value = navigator.onLine ? 'online' : 'offline';
  }, 3000);
};

const transitionName = ref('slide-left')
let historyStack = []
router.beforeEach((to, from, next) => {
  const toIndex = historyStack.indexOf(to.fullPath)
  const fromIndex = historyStack.indexOf(from.fullPath)
  if (toIndex === -1) {
    historyStack.push(to.fullPath)
    transitionName.value = 'slide-left'
  } else {
    transitionName.value = toIndex < fromIndex ? 'slide-right' : 'slide-left'
  }
  next()
})
window.setPageTransition = (name) => {
  transitionName.value = name
}

const connectionStatus = ref('online')

onMounted(() => {
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  simulateWaiting();
  if ('connection' in navigator) {
    navigator.connection.addEventListener('change', () => {
      if (navigator.connection.downlink < 1) {
        connectionStatus.value = 'slow';
      } else if (navigator.onLine) {
        connectionStatus.value = 'online';
      }
    });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('online', updateStatus);
  window.removeEventListener('offline', updateStatus);
  if (waitingTimeout) clearTimeout(waitingTimeout);
});

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'offline':
      return 'No internet connection';
    case 'slow':
      return 'Low internet connection';
    case 'waiting':
      return 'Waiting for connection...';
    default:
      return '';
  }
});

const connectionStatusIcon = computed(() => {
  switch (connectionStatus.value) {
    case 'offline':
      return 'mdi-wifi-off';
    case 'slow':
      return 'mdi-wifi-alert';
    case 'waiting':
      return 'mdi-timer-sand';
    default:
      return '';
  }
});
</script>
