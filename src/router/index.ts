import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import Dashboard from '@/views/Dashboard.vue';
import Heatmap from '@/views/Heatmap.vue';
import AreaUtilization from '@/views/AreaUtilization.vue';
import ViolationAnalysis from '@/views/ViolationAnalysis.vue';
import ExamWeek from '@/views/ExamWeek.vue';
import Settings from '@/views/Settings.vue';

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
      },
      {
        path: 'heatmap',
        name: 'heatmap',
        component: Heatmap,
      },
      {
        path: 'area-utilization',
        name: 'area-utilization',
        component: AreaUtilization,
      },
      {
        path: 'violation',
        name: 'violation',
        component: ViolationAnalysis,
      },
      {
        path: 'exam-week',
        name: 'exam-week',
        component: ExamWeek,
      },
      {
        path: 'settings',
        name: 'settings',
        component: Settings,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
