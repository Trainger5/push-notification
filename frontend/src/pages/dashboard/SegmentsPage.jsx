import { useOutletContext } from 'react-router-dom'
import { UserSegments } from '../../components/temp/DashboardComponents.jsx'

export default function SegmentsPage() {
  const { me, stats, loadUserData, apiBase } = useOutletContext()
  
  return (
    <UserSegments 
      customerData={me}
      initialStats={stats}
      onDataRefresh={loadUserData}
      apiBase={apiBase}
    />
  )
}