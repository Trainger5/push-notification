import { useOutletContext } from 'react-router-dom'
import { ABTesting } from '../../components/temp/DashboardComponents.jsx'

export default function ABTestingPage() {
  const { me, stats, loadUserData, apiBase } = useOutletContext()
  
  return (
    <ABTesting 
      customerData={me}
      initialStats={stats}
      onDataRefresh={loadUserData}
      apiBase={apiBase}
    />
  )
}