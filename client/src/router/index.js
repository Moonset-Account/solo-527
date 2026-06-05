import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/mobile/Login.vue'),
    meta: { requiresAuth: false, layout: 'mobile' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/mobile/Register.vue'),
    meta: { requiresAuth: false, layout: 'mobile' }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/mobile/Home.vue'),
    meta: { requiresAuth: true, layout: 'mobile' }
  },
  {
    path: '/tools',
    name: 'Tools',
    component: () => import('@/views/mobile/Tools.vue'),
    meta: { requiresAuth: true, layout: 'mobile' }
  },
  {
    path: '/tools/:id',
    name: 'ToolDetail',
    component: () => import('@/views/mobile/ToolDetail.vue'),
    meta: { requiresAuth: true, layout: 'mobile' }
  },
  {
    path: '/scan',
    name: 'Scan',
    component: () => import('@/views/mobile/Scan.vue'),
    meta: { requiresAuth: true, layout: 'mobile' }
  },
  {
    path: '/my-borrows',
    name: 'MyBorrows',
    component: () => import('@/views/mobile/MyBorrows.vue'),
    meta: { requiresAuth: true, layout: 'mobile' }
  },
  {
    path: '/borrow/:toolId',
    name: 'BorrowForm',
    component: () => import('@/views/mobile/BorrowForm.vue'),
    meta: { requiresAuth: true, layout: 'mobile' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/mobile/Profile.vue'),
    meta: { requiresAuth: true, layout: 'mobile' }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/mobile/Notifications.vue'),
    meta: { requiresAuth: true, layout: 'mobile' }
  },
  {
    path: '/maintenance',
    name: 'MaintenanceList',
    component: () => import('@/views/mobile/MaintenanceList.vue'),
    meta: { requiresAuth: true, layout: 'mobile' }
  },
  {
    path: '/maintenance/report/:toolId',
    name: 'MaintenanceReport',
    component: () => import('@/views/mobile/MaintenanceReport.vue'),
    meta: { requiresAuth: true, layout: 'mobile' }
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { requiresAuth: true, requiresRole: ['admin', 'volunteer'] },
    children: [
      {
        path: '',
        name: 'AdminHome',
        component: () => import('@/views/admin/Home.vue')
      },
      {
        path: 'borrows',
        name: 'AdminBorrows',
        component: () => import('@/views/admin/Borrows.vue')
      },
      {
        path: 'tools',
        name: 'AdminTools',
        component: () => import('@/views/admin/Tools.vue')
      },
      {
        path: 'calendar',
        name: 'AdminCalendar',
        component: () => import('@/views/admin/Calendar.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { requiresRole: ['admin'] }
      },
      {
        path: 'maintenances',
        name: 'AdminMaintenances',
        component: () => import('@/views/admin/Maintenances.vue')
      },
      {
        path: 'audit',
        name: 'AdminAudit',
        component: () => import('@/views/admin/Audit.vue'),
        meta: { requiresRole: ['admin'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  userStore.restoreFromStorage();

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login');
  } else if (to.meta.requiresRole && !to.meta.requiresRole.includes(userStore.user?.role)) {
    next('/');
  } else {
    next();
  }
});

export default router;
