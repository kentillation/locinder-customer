import NotFound from '@/views/NotFound.vue'

export const fallbackRoutes = [
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFound
    }
]