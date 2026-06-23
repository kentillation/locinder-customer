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

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if(!authStore.initialized) {
    await authStore.restoreAuth()
  }

  const isAuth = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuth) {
    return next({
      path: '/',
      query: { redirect: to.fullPath }
    })
  }

  if ((to.path === '/' || to.path === '/register') && isAuth) {
    const redirect = to.query.redirect || '/home'
    return next(redirect)
  }

  setSlideTransition(to, from)

  next()
})

export default router