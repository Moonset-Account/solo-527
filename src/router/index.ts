import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import Dashboard from '@/views/Dashboard.vue';
import Heatmap from '@/views/Heatmap.vue';
import AreaUtilization from '@/views/AreaUtilization.vue';
import ViolationAnalysis from '@/views/ViolationAnalysis.vue';
import ExamWeek from '@/views/ExamWeek.vue';
import Settings from '@/views/Settings.vue';
import StudentRecords from '@/views/StudentRecords.vue';
import { useAuthStore } from '@/stores/auth';

const ADMIN_ROUTES = ['dashboard', 'heatmap', 'area-utilization', 'violation', 'exam-week', 'settings'];
const STUDENT_ROUTES = ['my-records'];

const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: Dashboard,
        meta: { requiresAuth: 'admin' },
      },
      {
        path: 'heatmap',
        name: 'heatmap',
        component: Heatmap,
        meta: { requiresAuth: 'admin' },
      },
      {
        path: 'area-utilization',
        name: 'area-utilization',
        component: AreaUtilization,
        meta: { requiresAuth: 'admin' },
      },
      {
        path: 'violation',
        name: 'violation',
        component: ViolationAnalysis,
        meta: { requiresAuth: 'admin' },
      },
      {
        path: 'exam-week',
        name: 'exam-week',
        component: ExamWeek,
        meta: { requiresAuth: 'admin' },
      },
      {
        path: 'settings',
        name: 'settings',
        component: Settings,
        meta: { requiresAuth: 'super_admin' },
      },
      {
        path: 'my-records',
        name: 'my-records',
        component: StudentRecords,
        meta: { requiresAuth: 'student' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth as string | undefined;
  
  if (!requiresAuth) {
    next();
    return;
  }
  
  if (requiresAuth === 'student') {
    if (authStore.userRole === 'student') {
      next();
    } else {
      next('/dashboard');
    }
    return;
  }
  
  if (requiresAuth === 'admin') {
    if (authStore.userRole === 'student') {
      next('/my-records');
    } else {
      next();
    }
    return;
  }
  
  if (requiresAuth === 'super_admin') {
    if (authStore.userRole === 'super_admin') {
      next();
    } else if (authStore.userRole === 'student') {
      next('/my-records');
    } else {
      next('/dashboard');
    }
    return;
  }
  
  next();
});

export default router;
