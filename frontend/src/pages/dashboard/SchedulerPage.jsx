import { useOutletContext } from 'react-router-dom'
import { NotificationScheduler } from '../../components/temp/DashboardComponents.jsx'

export default function SchedulerPage() {
  const { me, stats, loadUserData, apiBase } = useOutletContext()
  
  return (
    <NotificationScheduler 
      customerData={me}
      initialStats={stats}
      onDataRefresh={loadUserData}
      apiBase={apiBase}
    />
  )
}