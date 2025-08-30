import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from './ui'

export default function Layout({ children }) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  function logout() {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
    } catch (_) {}
    navigate('/login')
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white border-b border-gray-200 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link 
                to="/" 
                className="font-bold text-lg text-gray-900 hover:text-primary-600 transition-colors"
              >
                PushNotify
              </Link>
              <nav className="hidden md:flex items-center space-x-4">
                <Link 
                  to="/docs" 
                  className={`hover:text-primary-600 transition-colors ${
                    isActive('/docs') ? 'text-primary-600' : 'text-gray-600'
                  }`}
                >
                  Docs
                </Link>
                {token && (
                  <Link 
                    to="/app" 
                    className={`hover:text-primary-600 transition-colors ${
                      isActive('/app') ? 'text-primary-600' : 'text-gray-600'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              {token ? (
                <Button variant="secondary" onClick={logout}>
                  Logout
                </Button>
              ) : (
                <Link to="/login">
                  <Button variant="primary">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-12 py-6 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} PushNotify. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}


