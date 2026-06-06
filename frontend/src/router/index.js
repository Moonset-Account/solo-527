import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/librarian/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/librarian/dashboard',
    name: 'LibrarianDashboard',
    component: () => import('@/views/librarian/Dashboard.vue')
  },
  {
    path: '/librarian/books',
    name: 'LibrarianBooks',
    component: () => import('@/views/librarian/Books.vue')
  },
  {
    path: '/librarian/borrows',
    name: 'LibrarianBorrows',
    component: () => import('@/views/librarian/Borrows.vue')
  },
  {
    path: '/librarian/repairs',
    name: 'LibrarianRepairs',
    component: () => import('@/views/librarian/Repairs.vue')
  },
  {
    path: '/librarian/activities',
    name: 'LibrarianActivities',
    component: () => import('@/views/librarian/Activities.vue')
  },
  {
    path: '/librarian/deposits',
    name: 'LibrarianDeposits',
    component: () => import('@/views/librarian/Deposits.vue')
  },
  {
    path: '/librarian/members',
    name: 'LibrarianMembers',
    component: () => import('@/views/librarian/Members.vue')
  },
  {
    path: '/parent/dashboard',
    name: 'ParentDashboard',
    component: () => import('@/views/parent/Dashboard.vue')
  },
  {
    path: '/parent/borrows',
    name: 'ParentBorrows',
    component: () => import('@/views/parent/Borrows.vue')
  },
  {
    path: '/parent/activities',
    name: 'ParentActivities',
    component: () => import('@/views/parent/Activities.vue')
  },
  {
    path: '/parent/deposits',
    name: 'ParentDeposits',
    component: () => import('@/views/parent/Deposits.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
