import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Home, 
  BarChart3, 
  Send, 
  Activity, 
  FileText, 
  Clock, 
  Users, 
  Filter, 
  Target, 
  Link, 
  HelpCircle, 
  Settings, 
  Menu, 
  X,
  User,
  LogOut,
  Bell
} from 'lucide-react'

const NavItem = ({ icon: Icon, label, isActive, onClick, badge, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center w-full px-4 py-3 text-left rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
          : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
        }
        ${className}
      `}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="font-medium flex-1">{label}</span>
      {badge && (
        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
          {badge}
        </span>
      )}
    </button>
  )
}

const NavSection = ({ title, items, currentTab, onTabChange }) => {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 mb-3">
        {title}
      </h3>
      <div className="space-y-1 px-2">
        {items.map((item) => (
          <NavItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            isActive={currentTab === item.key}
            onClick={() => onTabChange(item.key)}
            badge={item.badge}
          />
        ))}
      </div>
    </div>
  )
}

const Sidebar = ({ currentTab, onTabChange, stats, isOpen, onClose, isAdmin, navSections }) => {
  const navigate = useNavigate()

  function logout() {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
    } catch (_) {}
    navigate('/', { replace: true })
  }

  const defaultNavSections = [
    {
      title: 'Dashboard',
      items: [
        { key: 'overview', label: 'Overview', icon: Home },
        { key: 'analytics', label: 'Analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'Messaging',
      items: [
        { key: 'send', label: 'Send Notifications', icon: Send },
        { key: 'campaigns', label: 'Campaigns', icon: Activity },
        { key: 'templates', label: 'Templates', icon: FileText },
        { key: 'scheduler', label: 'Scheduler', icon: Clock },
      ]
    },
    {
      title: 'Audience',
      items: [
        { key: 'subscribers', label: 'Subscribers', icon: Users, badge: stats.subscribers },
        { key: 'segments', label: 'Segments', icon: Filter },
      ]
    },
    {
      title: 'Tools',
      items: [
        { key: 'abtesting', label: 'A/B Testing', icon: Target },
        { key: 'webhooks', label: 'Webhooks', icon: Link },
        { key: 'documentation', label: 'Documentation', icon: HelpCircle },
        { key: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ]

  const sectionsToUse = navSections || defaultNavSections

  const sidebarContent = (
    <div className="h-full flex flex-col bg-gradient-to-b from-blue-50 to-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:block">
            <div className="text-xl font-bold text-blue-600">NotifyPro</div>
            <div className="text-xs text-gray-500 font-medium">{isAdmin ? 'Admin Dashboard' : 'Push Notification Platform'}</div>
          </div>
        </div>
        {isOpen && (
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 overflow-y-auto">
        {sectionsToUse.map((section) => (
          <NavSection
            key={section.title}
            title={section.title}
            items={section.items}
            currentTab={currentTab}
            onTabChange={onTabChange}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-gray-900">Account</div>
              <div className="text-xs text-gray-500">Manage settings</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 w-80 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 w-80 max-w-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}

const TopBar = ({ user, onMenuClick, currentTab }) => {
  const getPageTitle = (tab) => {
    const titles = {
      overview: 'Overview',
      analytics: 'Analytics',
      send: 'Send Notifications',
      campaigns: 'Campaigns',
      templates: 'Templates',
      scheduler: 'Scheduler',
      subscribers: 'Subscribers',
      segments: 'Segments',
      abtesting: 'A/B Testing',
      webhooks: 'Webhooks',
      documentation: 'Documentation',
      settings: 'Settings'
    }
    return titles[tab] || 'Dashboard'
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getPageTitle(currentTab)}
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {user?.customer?.name || 'User'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.customer?.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SimpleDashboardLayout({ children, currentTab, onTabChange, user, stats, isAdmin, navSections }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        currentTab={currentTab}
        onTabChange={onTabChange}
        stats={stats || {}}
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        isAdmin={isAdmin}
        navSections={navSections}
      />
      
      <div className="md:pl-80">
        <TopBar
          user={user}
          onMenuClick={handleMenuClick}
          currentTab={currentTab}
        />
        
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}