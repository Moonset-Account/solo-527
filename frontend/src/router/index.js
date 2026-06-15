import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/Index.vue'),
        meta: { title: '数据复盘看板', icon: 'DataAnalysis' }
      },
      {
        path: 'workbench',
        name: 'Workbench',
        component: () => import('../views/Workbench.vue'),
        meta: { title: '工作台', icon: 'Odometer' }
      },
      {
        path: 'topic',
        name: 'TopicList',
        component: () => import('../views/topic/List.vue'),
        meta: { title: '选题管理', icon: 'Collection' }
      },
      {
        path: 'topic/create',
        name: 'TopicCreate',
        component: () => import('../views/topic/Form.vue'),
        meta: { title: '提交选题', icon: 'Plus', hidden: true }
      },
      {
        path: 'topic/edit/:id',
        name: 'TopicEdit',
        component: () => import('../views/topic/Form.vue'),
        meta: { title: '编辑选题', hidden: true }
      },
      {
        path: 'script',
        name: 'ScriptList',
        component: () => import('../views/script/List.vue'),
        meta: { title: '脚本管理', icon: 'Document' }
      },
      {
        path: 'script/create',
        name: 'ScriptCreate',
        component: () => import('../views/script/Form.vue'),
        meta: { title: '提交脚本', icon: 'Plus', hidden: true }
      },
      {
        path: 'script/edit/:id',
        name: 'ScriptEdit',
        component: () => import('../views/script/Form.vue'),
        meta: { title: '编辑脚本', hidden: true }
      },
      {
        path: 'review',
        name: 'Review',
        component: () => import('../views/review/Index.vue'),
        meta: { title: '审核追溯', icon: 'View' }
      },
      {
        path: 'abnormal',
        name: 'AbnormalList',
        component: () => import('../views/abnormal/List.vue'),
        meta: { title: '异常记录', icon: 'Warning' }
      },
      {
        path: 'abnormal/create',
        name: 'AbnormalCreate',
        component: () => import('../views/abnormal/Form.vue'),
        meta: { title: '上报异常', hidden: true }
      },
      {
        path: 'productivity',
        name: 'Productivity',
        component: () => import('../views/Productivity.vue'),
        meta: { title: '内容产能复盘', icon: 'TrendCharts' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/404.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = (to.meta.title ? to.meta.title + ' - ' : '') + '青禾选题协作台'
  const userStore = useUserStore()
  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn()) {
    next('/login')
  } else {
    next()
  }
})

export default router
