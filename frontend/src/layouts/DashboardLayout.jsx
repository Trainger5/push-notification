import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import SimpleDashboardLayout from '../components/SimpleDashboardLayout'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function useApiBase() {
  const apiBaseRaw = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'https://pushads123.com'
  return apiBaseRaw.toString().replace(/\/?$/, '')
}

export default function DashboardLayout() {
  const [me, setMe] = useState(null)
  const [stats, setStats] = useState({ subscribers: 0 })
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const headers = useAuthHeaders()
  const apiBase = useApiBase()
  const navigate = useNavigate()
  const location = useLocation()
  const mountedRef = useRef(true)
  const timeoutRef = useRef(null)

  // Get current tab from URL path
  const getCurrentTab = () => {
    const path = location.pathname.split('/app/')[1] || 'overview'
    return path.split('/')[0]
  }

  async function loadUserData(retryCount = 0) {
    if (!mountedRef.current) return

    try {
      setLoading(true)
      const r = await fetch(`${apiBase}/api/customer/me`, { headers })
      
      if (!r.ok) {
        if (r.status === 401 || r.status === 403) {
          console.log('Authentication failed, redirecting to login')
          if (mountedRef.current) {
            setAuthError(true)
            navigate('/login')
          }
          return
        }
        if (r.status === 429) {
          if (retryCount < 3) {
            console.warn(`Rate limited, retrying in ${2 + retryCount} seconds...`)
            timeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                loadUserData(retryCount + 1)
              }
            }, (2 + retryCount) * 1000)
            return
          } else {
            if (mountedRef.current) {
              setAuthError(true)
            }
            return
          }
        }
        throw new Error(`HTTP ${r.status}: ${r.statusText}`)
      }
      const data = await r.json()
      if (mountedRef.current) {
        setMe(data)
        setStats({ subscribers: data.subscriberCount || 0 })
        setAuthError(false)
      }
    } catch (error) {
      console.error('Dashboard load error:', error)
      if (mountedRef.current) {
        setAuthError(true)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true
    loadUserData()
    
    // Cleanup function to prevent memory leaks
    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Redirect to login if not authenticated
  if (authError || (!loading && !me)) {
    navigate('/login')
    return null
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const mapTabToRoute = (tab) => {
    // Map specific tabs to their route equivalents
    if (tab === 'abtesting') return 'ab-testing'
    return tab
  }

  const mapRouteToTab = (route) => {
    // Map routes back to their tab equivalents
    if (route === 'ab-testing') return 'abtesting'
    return route
  }

  return (
    <SimpleDashboardLayout 
      me={me} 
      stats={stats} 
      currentTab={mapRouteToTab(getCurrentTab())}
      onTabChange={(tab) => navigate(`/app/${mapTabToRoute(tab)}`)}
    >
      <Outlet context={{ me, stats, loadUserData, apiBase }} />
    </SimpleDashboardLayout>
  )
}