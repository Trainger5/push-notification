import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import Home from './pages/Home.jsx'
import Docs from './pages/Docs.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NotifyPro from './pages/NotifyPro.jsx'
import Pricing from './pages/Pricing.jsx'

const router = createBrowserRouter([
  { path: '/', element: <NotifyPro /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/login', element: <NotifyPro /> },
  { path: '/admin', element: <NotifyPro /> },
  { path: '/app', element: <NotifyPro /> },
  { path: '/admin-dashboard', element: <NotifyPro /> },
  // Legacy/demo routes still available
  { path: '/docs', element: <Docs /> },
  { path: '/home', element: <Home /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider value={defaultSystem}>
      <RouterProvider router={router} />
    </ChakraProvider>
  </StrictMode>,
)
