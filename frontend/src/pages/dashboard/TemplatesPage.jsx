import { useOutletContext } from 'react-router-dom'
import { NotificationTemplates } from '../../components/temp/DashboardComponents.jsx'

export default function TemplatesPage() {
  const { me, stats, loadUserData, apiBase } = useOutletContext()
  
  return (
    <NotificationTemplates 
      customerData={me}
      initialStats={stats}
      onDataRefresh={loadUserData}
      apiBase={apiBase}
    />
  )
}