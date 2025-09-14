import { useOutletContext } from 'react-router-dom'
import { SubscriberManagement } from '../../components/temp/DashboardComponents.jsx'

export default function SubscribersPage() {
  const { me, stats, loadUserData, apiBase } = useOutletContext()
  
  return (
    <SubscriberManagement 
      customerData={me}
      initialStats={stats}
      onDataRefresh={loadUserData}
      apiBase={apiBase}
    />
  )
}