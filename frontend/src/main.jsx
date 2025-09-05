import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/dashboard.css'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Dashboard from './pages/NewDashboard.jsx'
import AdminDashboard from './pages/CompleteAdminDashboard.jsx'
import ModernLanding from './pages/ModernLanding.jsx'
import Login from './pages/Login.jsx'
import Pricing from './pages/Pricing.jsx'
import Register from './pages/Register.jsx'
import DemoLogin from './pages/DemoLogin.jsx'
import StandaloneDocs from './pages/StandaloneDocs.jsx'

// Check if user should see professional dashboard
function shouldUseProfessionalDashboard() {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  return token && (role === 'admin' || role === 'customer')
}

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error);
    if (errorInfo) {
      console.error('Error Info:', errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong</h1>
            <p style={{ marginBottom: '2rem', opacity: 0.8 }}>Please refresh the page or try again later.</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Professional Dashboard Redirect Component
function ProfessionalDashboardRedirect() {
  if (shouldUseProfessionalDashboard()) {
    return <Dashboard />
  }
  return <Navigate to="/login" replace />
}

const router = createBrowserRouter([
  // Main landing - use modern landing page
  { path: '/', element: <ModernLanding /> },
  { path: '/home', element: <ModernLanding /> },
  { path: '/login', element: <Login /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/docs', element: <StandaloneDocs /> },
  { path: '/register', element: <Register /> },
  
  // Main customer dashboard routes - new modern UI
  { path: '/app', element: <ProfessionalDashboardRedirect /> },
  { path: '/dashboard', element: <ProfessionalDashboardRedirect /> },
  { path: '/customer-dashboard', element: <ProfessionalDashboardRedirect /> },
  
  // Admin dashboard - isolated UI to prevent DOM errors
  { path: '/admin', element: <AdminDashboard /> },
  { path: '/admin-dashboard', element: <AdminDashboard /> },
  
  // Demo routes
  { path: '/demo-login', element: <DemoLogin /> },
  { path: '/demo', element: <DemoLogin /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)
