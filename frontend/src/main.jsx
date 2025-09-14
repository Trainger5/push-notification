import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/dashboard.css'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Dashboard from './pages/NewDashboard.jsx'
import AdminDashboard from './pages/CompleteAdminDashboard.jsx'
import NotifyPro from './pages/NotifyPro.jsx'
import ModernLanding from './pages/ModernLanding.jsx'
import Login from './pages/Login.jsx'
import Pricing from './pages/Pricing.jsx'
import Register from './pages/Register.jsx'
import DemoLogin from './pages/DemoLogin.jsx'
import StandaloneDocs from './pages/StandaloneDocs.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import OverviewPage from './pages/dashboard/OverviewPage.jsx'
import SendNotificationPage from './pages/dashboard/SendNotificationPage.jsx'
import AnalyticsPage from './pages/dashboard/AnalyticsPage.jsx'
import SubscribersPage from './pages/dashboard/SubscribersPage.jsx'
import CampaignsPage from './pages/dashboard/CampaignsPage.jsx'
import TemplatesPage from './pages/dashboard/TemplatesPage.jsx'
import SchedulerPage from './pages/dashboard/SchedulerPage.jsx'
import SegmentsPage from './pages/dashboard/SegmentsPage.jsx'
import WebhooksPage from './pages/dashboard/WebhooksPage.jsx'
import ABTestingPage from './pages/dashboard/ABTestingPage.jsx'
import SettingsPage from './pages/dashboard/SettingsPage.jsx'
import DocumentationPage from './pages/dashboard/DocumentationPage.jsx'

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
            <p style={{ marginBottom: '1rem', opacity: 0.8 }}>There was an error rendering the application.</p>
            <p style={{ marginBottom: '2rem', opacity: 0.6, fontSize: '0.875rem' }}>
              This might be due to a navigation conflict. Please try refreshing the page.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                  // Clear any cached navigation state
                  sessionStorage.clear();
                  localStorage.removeItem('navigationState');
                  window.location.reload();
                }} 
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
              <button 
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/';
                }} 
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Dashboard Authentication Guard
function RequireAuth({ children }) {
  if (shouldUseProfessionalDashboard()) {
    return children
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
  
  // Main customer dashboard routes - new nested structure
  {
    path: '/app',
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/app/overview" replace /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'send', element: <SendNotificationPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'subscribers', element: <SubscribersPage /> },
      { path: 'campaigns', element: <CampaignsPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'scheduler', element: <SchedulerPage /> },
      { path: 'segments', element: <SegmentsPage /> },
      { path: 'webhooks', element: <WebhooksPage /> },
      { path: 'ab-testing', element: <ABTestingPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'documentation', element: <DocumentationPage /> }
    ]
  },
  
  // Legacy dashboard redirects
  { path: '/dashboard', element: <Navigate to="/app" replace /> },
  { path: '/customer-dashboard', element: <Navigate to="/app" replace /> },
  
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
