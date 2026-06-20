
import type { RouteObject } from 'react-router-dom'
import { lazy } from 'react'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const Submit = lazy(() => import('../pages/Submit'))
const AdminConsole = lazy(() => import('../pages/AdminConsole'))
const Review = lazy(() => import('../pages/Review'))
const Inventory = lazy(() => import('../pages/Inventory'))
const Todos = lazy(() => import('../pages/Todos'))
const Logs = lazy(() => import('../pages/Logs'))
const ApiRetry = lazy(() => import('../pages/ApiRetry'))

export const routes: RouteObject[] = [
  { path: '/', index: true, Component: Dashboard },
  { path: '/submit', Component: Submit },
  { path: '/admin', Component: AdminConsole },
  { path: '/review', Component: Review },
  { path: '/inventory', Component: Inventory },
  { path: '/todos', Component: Todos },
  { path: '/logs', Component: Logs },
  { path: '/apiretry', Component: ApiRetry }
]
