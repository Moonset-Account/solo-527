import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import DashboardPage from '@/pages/DashboardPage.vue'

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'dashboard', component: DashboardPage },
      {
        path: 'batches',
        name: 'batches',
        component: () => import('@/pages/batches/BatchListPage.vue'),
      },
      {
        path: 'batches/:id',
        name: 'batch-detail',
        component: () => import('@/pages/batches/BatchDetailPage.vue'),
      },
      {
        path: 'recipes',
        name: 'recipes',
        component: () => import('@/pages/recipes/RecipeListPage.vue'),
      },
      {
        path: 'recipes/:id',
        name: 'recipe-detail',
        component: () => import('@/pages/recipes/RecipeDetailPage.vue'),
      },
      {
        path: 'ingredients',
        name: 'ingredients',
        component: () => import('@/pages/ingredients/IngredientListPage.vue'),
      },
      {
        path: 'scheduling',
        name: 'scheduling',
        component: () => import('@/pages/scheduling/SchedulePage.vue'),
      },
      {
        path: 'inventory',
        name: 'inventory',
        component: () => import('@/pages/inventory/InventoryPage.vue'),
      },
      {
        path: 'profit',
        name: 'profit',
        component: () => import('@/pages/profit/ProfitPage.vue'),
      },
      {
        path: 'anomalies',
        name: 'anomalies',
        component: () => import('@/pages/anomalies/AnomalyListPage.vue'),
      },
      {
        path: 'anomalies/:id',
        name: 'anomaly-detail',
        component: () => import('@/pages/anomalies/AnomalyDetailPage.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
