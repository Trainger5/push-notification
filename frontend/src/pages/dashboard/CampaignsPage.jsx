import { useOutletContext } from 'react-router-dom'
import { CampaignBuilder } from '../../components/temp/DashboardComponents.jsx'

export default function CampaignsPage() {
  const { me, stats, loadUserData, apiBase } = useOutletContext()
  
  return (
    <CampaignBuilder 
      customerData={me}
      initialStats={stats}
      onDataRefresh={loadUserData}
      apiBase={apiBase}
    />
  )
}