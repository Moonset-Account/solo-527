import { Routes, Route, Navigate } from 'react-router-dom'
import { routes } from './router'
import MainLayout from './layouts/MainLayout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/workbench" replace />} />
      <Route element={<MainLayout />}>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>
    </Routes>
  )
}

export default App
