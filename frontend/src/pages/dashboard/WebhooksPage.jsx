import { useOutletContext } from 'react-router-dom'
import { WebhookManagement } from '../../components/temp/DashboardComponents.jsx'

export default function WebhooksPage() {
  const { me, stats, loadUserData, apiBase } = useOutletContext()
  
  return (
    <WebhookManagement 
      customerData={me}
      initialStats={stats}
      onDataRefresh={loadUserData}
      apiBase={apiBase}
    />
  )
}