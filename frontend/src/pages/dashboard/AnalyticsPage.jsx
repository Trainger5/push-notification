import { useOutletContext } from 'react-router-dom'
import { AnalyticsDashboard } from '../../components/temp/DashboardComponents.jsx'

export default function AnalyticsPage() {
  const { me, stats, loadUserData, apiBase } = useOutletContext()
  
  // Pass customer data and API configuration to the analytics component
  return (
    <AnalyticsDashboard 
      customerData={me}
      initialStats={stats}
      onDataRefresh={loadUserData}
      apiBase={apiBase}
    />
  )
}