import { useEffect, useState } from 'react'
import { Box, Button, Container, Grid, GridItem, Heading, Input, Text, Textarea } from '@chakra-ui/react'
import Layout from '../components/Layout.jsx'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export default function Dashboard() {
  const [me, setMe] = useState(null)
  const [form, setForm] = useState({})
  const [test, setTest] = useState({ title: '', body: '', url: '' })
  const headers = useAuthHeaders()

  async function load() {
    const r = await fetch('/api/customer/me', { headers })
    if (!r.ok) throw new Error((await r.json()).error)
    const data = await r.json()
    setMe(data)
    setForm({
      vapidPublicKey: data.settings?.vapidPublicKey || '',
      vapidPrivateKey: data.settings?.vapidPrivateKey || '',
      vapidSubject: data.settings?.vapidSubject || '',
      title: data.settings?.title || '',
      iconUrl: data.settings?.iconUrl || '',
      badgeUrl: data.settings?.badgeUrl || '',
      defaultUrl: data.settings?.defaultUrl || ''
    })
  }

  useEffect(() => { load().catch(e => alert(e.message)) }, [])

  async function saveSettings() {
    const r = await fetch('/api/customer/settings', { method: 'POST', headers, body: JSON.stringify(form) })
    if (!r.ok) throw new Error((await r.json()).error)
    await load()
  }

  async function sendTest() {
    const r = await fetch('/api/customer/notify', { method: 'POST', headers, body: JSON.stringify(test) })
    if (!r.ok) throw new Error((await r.json()).error)
    const data = await r.json()
    alert(`Sent: ${data.sent}, Failed: ${data.failed}`)
  }

  if (!me) return null

  return (
    <Layout>
    <Container maxW="6xl" py={12}>
      <Heading size="lg" mb={6}>Dashboard</Heading>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
        <GridItem colSpan={2}>
          <Box bg="white" borderRadius="xl" p={6} boxShadow="md" border="1px solid #e2e8f0">
            <Heading size="md" mb={4}>Push Settings</Heading>
            {['vapidPublicKey','vapidPrivateKey','vapidSubject','title','iconUrl','badgeUrl','defaultUrl'].map((k) => (
              <Box key={k} mb={3}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, textTransform: 'capitalize' }}>{k}</label>
                <Input value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} />
              </Box>
            ))}
            <Button colorScheme="blue" onClick={() => saveSettings().catch(e=>alert(e.message))}>Save Settings</Button>
          </Box>
        </GridItem>
        <GridItem>
          <Box bg="white" borderRadius="xl" p={6} boxShadow="md" border="1px solid #e2e8f0">
            <Heading size="md" mb={4}>Overview</Heading>
            <Text><b>Company:</b> {me.customer.name}</Text>
            <Text><b>API Key:</b> {me.customer.apiKey}</Text>
            <Text><b>Subscribers:</b> {me.subscriberCount}</Text>
          </Box>
          <Box bg="white" borderRadius="xl" p={6} boxShadow="md" border="1px solid #e2e8f0" mt={6}>
            <Heading size="md" mb={4}>Send Test</Heading>
            <Box mb={3}><label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Title</label><Input value={test.title} onChange={e => setTest({ ...test, title: e.target.value })} /></Box>
            <Box mb={3}><label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Body</label><Textarea value={test.body} onChange={e => setTest({ ...test, body: e.target.value })} /></Box>
            <Box mb={4}><label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>URL</label><Input value={test.url} onChange={e => setTest({ ...test, url: e.target.value })} /></Box>
            <Button onClick={() => sendTest().catch(e=>alert(e.message))}>Send</Button>
          </Box>
        </GridItem>
      </Grid>
    </Container>
    </Layout>
  )
}

