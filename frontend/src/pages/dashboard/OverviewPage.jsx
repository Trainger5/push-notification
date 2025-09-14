import { useOutletContext, useNavigate } from 'react-router-dom'
import { DashboardOverview } from '../../components/temp/DashboardComponents.jsx'

export default function OverviewPage() {
  const { me, stats } = useOutletContext()
  const navigate = useNavigate()
  
  const handleTabChange = (tab) => {
    // Map tab to route and navigate
    const tabToRouteMap = {
      'send': '/app/send',
      'analytics': '/app/analytics',
      'subscribers': '/app/subscribers',
      'campaigns': '/app/campaigns',
      'templates': '/app/templates',
      'scheduler': '/app/scheduler',
      'segments': '/app/segments',
      'webhooks': '/app/webhooks',
      'abtesting': '/app/ab-testing',
      'settings': '/app/settings',
      'documentation': '/app/documentation'
    }
    
    const route = tabToRouteMap[tab] || `/app/${tab}`
    navigate(route)
  }
  
  return <DashboardOverview setCurrentTab={handleTabChange} />
}