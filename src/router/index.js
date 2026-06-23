import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import { publicRoutes } from './publicRoutes'
import { protectedRoutes } from './protectedRoutes'
import { fallbackRoutes } from './fallbackRoutes'

let historyStack = []

const setSlideTransition = (to, from) => {
  const toIndex = historyStack.indexOf(to.fullPath)
  const fromIndex = historyStack.indexOf(from.fullPath)

  if (toIndex === -1) {
    historyStack.push(to.fullPath)
    window.setPageTransition?.('slide-left')
  } else {
    window.setPageTransition?.(
      toIndex < fromIndex ? 'slide-right' : 'slide-left'
    )
  }
}

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    ...publicRoutes,
    ...protectedRoutes,
    ...fallbackRoutes
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  const isAuth = authStore.isAuthenticated

  // 🔒 protect routes
  if (to.meta.requiresAuth && !isAuth) {
    authStore.clearAuth()

    setSlideTransition(to, from)

    return next({
      path: '/',
      query: { redirect: to.fullPath }
    })
  }

  // 🔁 prevent login/register when already logged in
  if ((to.path === '/' || to.path === '/register') && isAuth) {
    const redirect = to.query.redirect || '/home'

    setSlideTransition(to, from)

    return next(redirect)
  }

  setSlideTransition(to, from)

  next()
})

export default router