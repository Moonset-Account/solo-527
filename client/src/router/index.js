import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'contents',
        name: 'Contents',
        component: () => import('@/views/contents/List.vue'),
        meta: { title: '内容管理' }
      },
      {
        path: 'contents/create',
        name: 'ContentCreate',
        component: () => import('@/views/contents/Form.vue'),
        meta: { title: '新建内容' }
      },
      {
        path: 'contents/:id',
        name: 'ContentDetail',
        component: () => import('@/views/contents/Detail.vue'),
        meta: { title: '内容详情' }
      },
      {
        path: 'review-flows',
        name: 'ReviewFlows',
        component: () => import('@/views/review/FlowList.vue'),
        meta: { title: '审稿流程' }
      },
      {
        path: 'exceptions',
        name: 'Exceptions',
        component: () => import('@/views/ExceptionPool.vue'),
        meta: { title: '异常池' }
      },
      {
        path: 'platform-accounts',
        name: 'PlatformAccounts',
        component: () => import('@/views/operation/PlatformAccounts.vue'),
        meta: { title: '平台账号' }
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('@/views/operation/Materials.vue'),
        meta: { title: '采访素材' }
      },
      {
        path: 'schedules',
        name: 'Schedules',
        component: () => import('@/views/operation/Schedules.vue'),
        meta: { title: '发布排期' }
      },
      {
        path: 'settings/dict',
        name: 'DictSettings',
        component: () => import('@/views/settings/DictItems.vue'),
        meta: { title: '字典项管理' }
      },
      {
        path: 'settings/config',
        name: 'ConfigSettings',
        component: () => import('@/views/settings/SystemConfigs.vue'),
        meta: { title: '系统配置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const title = to.meta?.title
  if (title) {
    document.title = `${title} - 品牌短视频审稿发布系统`
  }
  next()
})

export default router
