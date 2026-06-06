import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/courses',
    name: 'Courses',
    component: () => import('@/views/Courses.vue'),
    meta: { title: '课程列表' }
  },
  {
    path: '/courses/:id',
    name: 'CourseDetail',
    component: () => import('@/views/CourseDetail.vue'),
    meta: { title: '课程详情' }
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: () => import('@/views/Gallery.vue'),
    meta: { title: '作品画廊' }
  },
  {
    path: '/gallery/:id',
    name: 'WorkDetail',
    component: () => import('@/views/WorkDetail.vue'),
    meta: { title: '作品详情' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', guest: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/profile/enrollments'
      },
      {
        path: 'enrollments',
        name: 'MyEnrollments',
        component: () => import('@/views/profile/Enrollments.vue'),
        meta: { title: '我的报名' }
      },
      {
        path: 'works',
        name: 'MyWorks',
        component: () => import('@/views/profile/Works.vue'),
        meta: { title: '我的作品' }
      },
      {
        path: 'reviews',
        name: 'MyReviews',
        component: () => import('@/views/profile/Reviews.vue'),
        meta: { title: '我的评价' }
      },
      {
        path: 'settings',
        name: 'ProfileSettings',
        component: () => import('@/views/profile/Settings.vue'),
        meta: { title: '账户设置' }
      }
    ]
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '运营看板', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { title: '管理后台', requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/overview'
      },
      {
        path: 'overview',
        name: 'AdminOverview',
        component: () => import('@/views/admin/AdminOverview.vue'),
        meta: { title: '管理概览' }
      },
      {
        path: 'courses',
        name: 'AdminCourses',
        component: () => import('@/views/admin/Courses.vue'),
        meta: { title: '课程管理' }
      },
      {
        path: 'enrollments',
        name: 'AdminEnrollments',
        component: () => import('@/views/admin/Enrollments.vue'),
        meta: { title: '报名管理' }
      },
      {
        path: 'materials',
        name: 'AdminMaterials',
        component: () => import('@/views/admin/Materials.vue'),
        meta: { title: '材料管理' }
      },
      {
        path: 'works',
        name: 'AdminWorks',
        component: () => import('@/views/admin/Works.vue'),
        meta: { title: '作品审核' }
      },
      {
        path: 'teachers',
        name: 'AdminTeachers',
        component: () => import('@/views/admin/Teachers.vue'),
        meta: { title: '老师管理' }
      },
      {
        path: 'students',
        name: 'AdminStudents',
        component: () => import('@/views/admin/Students.vue'),
        meta: { title: '学员管理' }
      },
      {
        path: 'audits',
        name: 'AdminAuditLogs',
        component: () => import('@/views/admin/AuditLogs.vue'),
        meta: { title: '审计日志', requiresSuperAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  document.title = `${to.meta.title || '手作工坊'} - 匠心手作`

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.guest && authStore.isLoggedIn) {
    next({ name: 'Home' })
    return
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'Home' })
    return
  }

  if (to.meta.requiresSuperAdmin && !authStore.isSuperAdmin) {
    next({ name: 'Home' })
    return
  }

  if (authStore.isLoggedIn && !authStore.user) {
    try {
      await authStore.fetchCurrentUser()
    } catch (e) {
      authStore.logout()
      next({ name: 'Login' })
      return
    }
  }

  next()
})

export default router
