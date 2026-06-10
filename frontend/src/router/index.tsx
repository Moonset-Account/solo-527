import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'
import ProjectList from '@/pages/ProjectList'
import ProjectDetail from '@/pages/ProjectDetail'
import SalesEntry from '@/pages/SalesEntry'
import ConstructionManagement from '@/pages/ConstructionManagement'
import Inspection from '@/pages/Inspection'
import AfterSales from '@/pages/AfterSales'
import Reports from '@/pages/Reports'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <ProjectList />
      },
      {
        path: 'projects',
        element: <ProjectList />
      },
      {
        path: 'projects/:id',
        element: <ProjectDetail />
      },
      {
        path: 'sales',
        element: <SalesEntry />
      },
      {
        path: 'construction',
        element: <ConstructionManagement />
      },
      {
        path: 'inspection',
        element: <Inspection />
      },
      {
        path: 'after-sales',
        element: <AfterSales />
      },
      {
        path: 'reports',
        element: <Reports />
      }
    ]
  }
])

export default router
