import { useOutletContext } from 'react-router-dom'
import { SendNotification } from '../../components/temp/DashboardComponents.jsx'

export default function SendNotificationPage() {
  const { me, stats, loadUserData, apiBase } = useOutletContext()
  
  // Pass customer data and refresh function to the component
  return (
    <SendNotification 
      customerData={me}
      onNotificationSent={loadUserData}
      apiBase={apiBase}
    />
  )
}