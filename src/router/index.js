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
let isCheckingAuth = false;
let authInitialized = false;


const initAuth = async () => {
  if (!authInitialized && !isCheckingAuth) {
    isCheckingAuth = true;
    const authStore = useAuthStore();
    try {
      await authStore.checkAuth();
      authInitialized = true;
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      isCheckingAuth = false;
    }
  }
};

await initAuth();

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

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.initialized && !isCheckingAuth) {
    await initAuth();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    setSlideTransition(to, from);
    next('/');
    return;
  }

  if ((to.path === '/' || to.path === '/register') && authStore.isAuthenticated) {
    setSlideTransition(to, from);
    next('/home');
    return;
  }

  next();
});

export default router;