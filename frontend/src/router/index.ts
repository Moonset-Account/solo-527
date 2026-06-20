import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import NProgress from 'nprogress';
import { useUserStore } from '../stores/user';
import { Role } from '../types';

NProgress.configure({ showSpinner: false });

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '工作台', icon: 'HomeFilled' },
      },
      {
        path: 'interviews',
        name: 'Interviews',
        component: () => import('../views/interviews/InterviewList.vue'),
        meta: { title: '面试管理', icon: 'Calendar', roles: [Role.ADMIN, Role.INTERVIEWER, Role.HR] },
      },
      {
        path: 'interviews/create',
        name: 'CreateInterview',
        component: () => import('../views/interviews/CreateInterview.vue'),
        meta: { title: '预约面试', icon: 'Plus', roles: [Role.ADMIN, Role.INTERVIEWER, Role.HR] },
      },
      {
        path: 'interviews/:id',
        name: 'InterviewDetail',
        component: () => import('../views/interviews/InterviewDetail.vue'),
        meta: { title: '面试详情', roles: [Role.ADMIN, Role.INTERVIEWER, Role.HR] },
      },
      {
        path: 'assessments',
        name: 'Assessments',
        component: () => import('../views/assessments/AssessmentList.vue'),
        meta: { title: '测评管理', icon: 'Star', roles: [Role.ADMIN, Role.INTERVIEWER] },
      },
      {
        path: 'assessments/create/:interviewId',
        name: 'CreateAssessment',
        component: () => import('../views/assessments/CreateAssessment.vue'),
        meta: { title: '快速测评', roles: [Role.ADMIN, Role.INTERVIEWER] },
      },
      {
        path: 'question-bank',
        name: 'QuestionBank',
        component: () => import('../views/question-bank/QuestionList.vue'),
        meta: { title: '测评题库', icon: 'Reading', roles: [Role.ADMIN, Role.INTERVIEWER] },
      },
      {
        path: 'schedules',
        name: 'Schedules',
        component: () => import('../views/schedules/ScheduleList.vue'),
        meta: { title: '讲师档期', icon: 'Clock', roles: [Role.ADMIN, Role.HR] },
      },
      {
        path: 'check-in',
        name: 'CheckIn',
        component: () => import('../views/CheckIn.vue'),
        meta: { title: '签到记录', icon: 'Finished', roles: [Role.ADMIN, Role.INTERVIEWER, Role.HR] },
      },
      {
        path: 'hire-results',
        name: 'HireResults',
        component: () => import('../views/HireResults.vue'),
        meta: { title: '录用结果', icon: 'Medal', roles: [Role.ADMIN, Role.INTERVIEWER, Role.HR] },
      },
      {
        path: 'exports',
        name: 'Exports',
        component: () => import('../views/exports/ExportCenter.vue'),
        meta: { title: '数据导出', icon: 'Download', roles: [Role.ADMIN, Role.HR] },
      },
      {
        path: 'reminders',
        name: 'Reminders',
        component: () => import('../views/reminders/ReminderList.vue'),
        meta: { title: '提醒配置', icon: 'Bell', roles: [Role.ADMIN, Role.HR] },
      },
      {
        path: 'operation-logs',
        name: 'OperationLogs',
        component: () => import('../views/OperationLogs.vue'),
        meta: { title: '操作日志', icon: 'Document', roles: [Role.ADMIN] },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/users/UserList.vue'),
        meta: { title: '用户管理', icon: 'User', roles: [Role.ADMIN] },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: { title: '页面不存在' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  NProgress.start();
  const userStore = useUserStore();
  userStore.loadUserFromStorage();

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }

  if (to.path === '/login' && userStore.isLoggedIn) {
    next('/dashboard');
    return;
  }

  const roles = to.meta.roles as string[];
  if (roles && !userStore.hasRole(roles)) {
    next('/dashboard');
    return;
  }

  next();
});

router.afterEach((to) => {
  NProgress.done();
  const title = to.meta.title as string;
  if (title) {
    document.title = `${title} - 技术面试排课签到台`;
  }
});

export default router;
