import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { UserRole } from '../types'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/courses'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/Register.vue'),
    meta: { requiresAuth: false, title: '注册' }
  },
  {
    path: '/courses',
    name: 'Courses',
    component: () => import('../views/courses/CourseList.vue'),
    meta: { requiresAuth: false, title: '课程列表' }
  },
  {
    path: '/courses/:id',
    name: 'CourseDetail',
    component: () => import('../views/courses/CourseDetail.vue'),
    meta: { requiresAuth: false, title: '课程详情' }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('../views/courses/CourseCalendar.vue'),
    meta: { requiresAuth: false, title: '课程日历' }
  },
  {
    path: '/artworks',
    name: 'Artworks',
    component: () => import('../views/artworks/ArtworkGallery.vue'),
    meta: { requiresAuth: false, title: '作品展示' }
  },
  {
    path: '/artworks/:id',
    name: 'ArtworkDetail',
    component: () => import('../views/artworks/ArtworkDetail.vue'),
    meta: { requiresAuth: false, title: '作品详情' }
  },
  {
    path: '/my',
    component: () => import('../views/layouts/MemberLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/my/bookings'
      },
      {
        path: 'bookings',
        name: 'MyBookings',
        component: () => import('../views/member/MyBookings.vue'),
        meta: { title: '我的报名' }
      },
      {
        path: 'artworks',
        name: 'MyArtworks',
        component: () => import('../views/member/MyArtworks.vue'),
        meta: { title: '我的作品' }
      },
      {
        path: 'artworks/upload',
        name: 'UploadArtwork',
        component: () => import('../views/member/UploadArtwork.vue'),
        meta: { title: '上传作品' }
      },
      {
        path: 'profile',
        name: 'MyProfile',
        component: () => import('../views/member/MyProfile.vue'),
        meta: { title: '个人中心' }
      },
      {
        path: 'notifications',
        name: 'MyNotifications',
        component: () => import('../views/member/Notifications.vue'),
        meta: { title: '消息通知' }
      }
    ]
  },
  {
    path: '/teacher',
    component: () => import('../views/layouts/TeacherLayout.vue'),
    meta: { requiresAuth: true, roles: [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    children: [
      {
        path: '',
        redirect: '/teacher/sessions'
      },
      {
        path: 'sessions',
        name: 'TeacherSessions',
        component: () => import('../views/teacher/TeacherSessions.vue'),
        meta: { title: '我的课程' }
      },
      {
        path: 'settlements',
        name: 'TeacherSettlements',
        component: () => import('../views/teacher/TeacherSettlements.vue'),
        meta: { title: '结算记录' }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('../views/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { title: '数据概览' }
      },
      {
        path: 'bookings',
        name: 'AdminBookings',
        component: () => import('../views/admin/BookingsManagement.vue'),
        meta: { title: '报名管理' }
      },
      {
        path: 'courses',
        name: 'AdminCourses',
        component: () => import('../views/admin/CoursesManagement.vue'),
        meta: { title: '课程管理' }
      },
      {
        path: 'materials',
        name: 'AdminMaterials',
        component: () => import('../views/admin/MaterialsManagement.vue'),
        meta: { title: '材料库存' }
      },
      {
        path: 'artworks',
        name: 'AdminArtworks',
        component: () => import('../views/admin/ArtworksManagement.vue'),
        meta: { title: '作品审核' }
      },
      {
        path: 'settlements',
        name: 'AdminSettlements',
        component: () => import('../views/admin/SettlementsManagement.vue'),
        meta: { title: '老师结算' }
      },
      {
        path: 'payments',
        name: 'AdminPayments',
        component: () => import('../views/admin/PaymentsManagement.vue'),
        meta: { title: '支付记录' }
      },
      {
        path: 'audit-logs',
        name: 'AdminAuditLogs',
        component: () => import('../views/admin/AuditLogs.vue'),
        meta: { title: '审计日志' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/UsersManagement.vue'),
        meta: { title: '用户管理' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/error/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false
  const requiredRoles = to.meta.roles as UserRole[] | undefined

  document.title = `${to.meta.title || '手作课程'} - 手作工作室`

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.some(role => authStore.hasRole(role))) {
    next({ name: 'Courses' })
    return
  }

  if ((to.name === 'Login' || to.name === 'Register') && authStore.isAuthenticated) {
    next({ name: 'Courses' })
    return
  }

  next()
})

export default router
