import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/books'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: 'books',
        name: 'BookList',
        component: () => import('@/views/books/BookList.vue')
      },
      {
        path: 'books/:id',
        name: 'BookDetail',
        component: () => import('@/views/books/BookDetail.vue')
      },
      {
        path: 'activities',
        name: 'ActivityList',
        component: () => import('@/views/activities/ActivityList.vue')
      },
      {
        path: 'activities/:id',
        name: 'ActivityDetail',
        component: () => import('@/views/activities/ActivityDetail.vue')
      },
      {
        path: 'my/borrowing',
        name: 'MyBorrowing',
        component: () => import('@/views/my/MyBorrowing.vue')
      },
      {
        path: 'my/activities',
        name: 'MyActivities',
        component: () => import('@/views/my/MyActivities.vue')
      },
      {
        path: 'my/deposit',
        name: 'MyDeposit',
        component: () => import('@/views/my/MyDeposit.vue')
      },
      {
        path: 'admin/borrowing',
        name: 'AdminBorrowing',
        component: () => import('@/views/admin/BorrowingManage.vue'),
        meta: { roles: ['admin', 'librarian'] }
      },
      {
        path: 'admin/repairs',
        name: 'AdminRepairs',
        component: () => import('@/views/admin/RepairManage.vue'),
        meta: { roles: ['admin', 'librarian'] }
      },
      {
        path: 'admin/activities',
        name: 'AdminActivities',
        component: () => import('@/views/admin/ActivityManage.vue'),
        meta: { roles: ['admin', 'librarian'] }
      },
      {
        path: 'admin/deposits',
        name: 'AdminDeposits',
        component: () => import('@/views/admin/DepositManage.vue'),
        meta: { roles: ['admin', 'librarian'] }
      },
      {
        path: 'admin/books',
        name: 'AdminBooks',
        component: () => import('@/views/admin/BookManage.vue'),
        meta: { roles: ['admin', 'librarian'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = JSON.parse(localStorage.getItem('user') || 'null')
  
  if (to.path === '/login') {
    next()
    return
  }
  
  if (!userStore && to.path !== '/login') {
    next('/login')
    return
  }
  
  if (to.meta.roles && userStore) {
    if (!to.meta.roles.includes(userStore.role)) {
      next('/books')
      return
    }
  }
  
  next()
})

export default router
