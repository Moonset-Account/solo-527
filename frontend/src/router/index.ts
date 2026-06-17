import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/components/layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Index.vue'),
        meta: { title: '工作台' },
      },
      {
        path: 'bills',
        name: 'Bills',
        component: () => import('@/views/bill/List.vue'),
        meta: { title: '账单管理' },
      },
      {
        path: 'bills/create',
        name: 'BillCreate',
        component: () => import('@/views/bill/Create.vue'),
        meta: { title: '生成账单', roles: ['admin', 'manager'] },
      },
      {
        path: 'bills/statistics',
        name: 'BillStatistics',
        component: () => import('@/views/bill/Statistics.vue'),
        meta: { title: '收费统计' },
      },
      {
        path: 'maintenance',
        name: 'Maintenance',
        component: () => import('@/views/config/Maintenance.vue'),
        meta: { title: '工程报修' },
      },
      {
        path: 'inspection',
        name: 'Inspection',
        component: () => import('@/views/config/Inspection.vue'),
        meta: { title: '巡检任务' },
      },
      {
        path: 'room-pricing',
        name: 'RoomPricing',
        component: () => import('@/views/config/RoomPricing.vue'),
        meta: { title: '房态价格' },
      },
      {
        path: 'access-exceptions',
        name: 'AccessExceptions',
        component: () => import('@/views/exception/List.vue'),
        meta: { title: '通行异常' },
      },
      {
        path: 'system-config',
        name: 'SystemConfig',
        component: () => import('@/views/config/SystemConfig.vue'),
        meta: { title: '系统配置', roles: ['admin', 'manager'] },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/user/List.vue'),
        meta: { title: '账号管理', roles: ['admin', 'manager'] },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (to.meta.public) return next();
  if (!auth.isLoggedIn) return next({ path: '/login' });
  if (to.meta.roles && !(to.meta.roles as string[]).includes(auth.role!)) {
    return next({ path: '/dashboard' });
  }
  next();
});

export default router;
