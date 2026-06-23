import HomePage from '@/views/HomePage.vue'
import ShopPage from '@/views/ShopPage.vue'
import StorePage from '@/views/StorePage.vue'
import ShopList from '@/views/ShopList.vue'
import ShopWhereToBuy from '@/views/ShopWhereToBuy.vue'
import MealPage from '@/views/MealPage.vue'
import NewProducts from '@/views/NewProducts.vue'

export const protectedRoutes = [
    {
        path: '/home',
        name: 'HomePage',
        component: HomePage,
        meta: { requiresAuth: true }
    },
    {
        path: '/shop',
        name: 'ShopPage',
        component: ShopPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/store',
        name: 'StorePage',
        component: StorePage,
        meta: { requiresAuth: true }
    },
    {
        path: '/shop-list',
        name: 'ShopList',
        component: ShopList,
        meta: { requiresAuth: true }
    },
    {
        path: '/shop-where-to-buy',
        name: 'ShopWhereToBuy',
        component: ShopWhereToBuy,
        meta: { requiresAuth: true }
    },
    {
        path: '/meal',
        name: 'MealPage',
        component: MealPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/new-products',
        name: 'NewProducts',
        component: NewProducts,
        meta: { requiresAuth: true }
    }
]