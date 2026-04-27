import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import NotFound from '@/views/NotFound.vue';
import LoginPage from '@/views/LoginPage.vue';
import HomePage from '@/views/HomePage.vue';
import RegisterPage from '@/views/RegisterPage.vue';
import ShopPage from '@/views/ShopPage.vue';
import ShopList from '@/views/ShopList.vue';
import ShopWhereToBuy from '@/views/ShopWhereToBuy.vue';
import MealPage from '@/views/MealPage.vue';
import NewProducts from '@/views/NewProducts.vue';

const routes = [
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  { path: '/', name: 'LoginPage', component: LoginPage },
  { path: '/register', name: 'RegisterPage', component: RegisterPage },
  { path: '/home', name: 'HomePage', component: HomePage, meta: { requiresAuth: true } },
  { path: '/shop', name: 'ShopPage', component: ShopPage, meta: { requiresAuth: true } },
  { path: '/shop-list', name: 'ShopList', component: ShopList, meta: { requiresAuth: true } },
  { path: '/shop-where-to-buy', name: 'ShopWhereToBuy', component: ShopWhereToBuy, meta: { requiresAuth: true } },
  { path: '/meal', name: 'MealPage', component: MealPage, meta: { requiresAuth: true } },
  { path: '/new-products', name: 'NewProducts', component: NewProducts, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

let historyStack = [];

// Fixed slide transition function
const setSlideTransition = (to, from) => {
  const toIndex = historyStack.indexOf(to.fullPath);
  const fromIndex = historyStack.indexOf(from.fullPath);
  
  if (toIndex === -1) {
    historyStack.push(to.fullPath);
    window.setPageTransition('slide-left');
  } else {
    window.setPageTransition(toIndex < fromIndex ? 'slide-right' : 'slide-left');
  }
};

// Flag to prevent multiple simultaneous checks
let isCheckingAuth = false;

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Wait for auth check if not initialized
  if (!authStore.initialized && !isCheckingAuth) {
    isCheckingAuth = true;
    try {
      await authStore.checkAuth();
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      isCheckingAuth = false;
    }
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    setSlideTransition(to, from);
    next('/');
    return;
  }

  // Redirect authenticated users away from login/register
  if ((to.path === '/' || to.path === '/register') && authStore.isAuthenticated) {
    setSlideTransition(to, from);
    next('/home'); // Redirect to home instead of '/'
    return;
  }

  next();
});

export default router;