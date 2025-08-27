import { useEffect, useState } from 'react'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { 
  Box, 
  Button, 
  Container, 
  Grid, 
  GridItem, 
  Heading, 
  Input, 
  Text, 
  Textarea,
  VStack,
  HStack,
  Badge
} from '@chakra-ui/react'
import { Card, CardBody, CardHeader } from '@chakra-ui/card'
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/tabs'
import Layout from '../components/Layout.jsx'
import AnalyticsDashboard from '../components/AnalyticsDashboard.jsx'
import NotificationScheduler from '../components/NotificationScheduler.jsx'
import NotificationTemplates from '../components/NotificationTemplates.jsx'
import UserSegments from '../components/UserSegments.jsx'
import WebhookManagement from '../components/WebhookManagement.jsx'

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

  const cardBg = useColorModeValue('white', 'gray.800')

  if (!me) return null

  return (
    <Layout>
      <Container maxW="8xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="xl" mb={2}>Dashboard</Heading>
            <HStack spacing={4}>
              <Text color="gray.600">Welcome back, {me.customer.name}</Text>
              <Badge colorScheme="blue" variant="subtle">
                {me.customer.country || 'Unknown'} {me.customer.city && `• ${me.customer.city}`}
              </Badge>
            </HStack>
          </Box>

          {/* Tab Navigation */}
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Analytics</Tab>
              <Tab>Settings</Tab>
              <Tab>Send Notification</Tab>
              <Tab>Scheduler</Tab>
              <Tab>Templates</Tab>
              <Tab>Segments</Tab>
              <Tab>Webhooks</Tab>
            </TabList>
            
            <TabPanels>
              {/* Analytics Tab */}
              <TabPanel px={0}>
                <AnalyticsDashboard />
              </TabPanel>
              
              {/* Settings Tab */}
              <TabPanel px={0}>
                <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
                  <Card bg={cardBg} borderRadius="xl">
                    <CardHeader>
                      <Heading size="lg">Push Notification Settings</Heading>
                      <Text color="gray.600" mt={2}>Configure your notification preferences and VAPID keys</Text>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        {['vapidPublicKey','vapidPrivateKey','vapidSubject','title','iconUrl','badgeUrl','defaultUrl'].map((k) => (
                          <Box key={k}>
                            <Text fontWeight="semibold" mb={2} textTransform="capitalize" color="gray.700">
                              {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Text>
                            <Input 
                              value={form[k] || ''} 
                              onChange={e => setForm({ ...form, [k]: e.target.value })}
                              placeholder={k === 'vapidSubject' ? 'mailto:admin@example.com' : ''}
                              size="lg"
                            />
                          </Box>
                        ))}
                        <Button 
                          colorScheme="blue" 
                          size="lg" 
                          onClick={() => saveSettings().catch(e=>alert(e.message))}
                        >
                          Save Settings
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>

                  <VStack spacing={6} align="stretch">
                    {/* Account Overview */}
                    <Card bg={cardBg} borderRadius="xl">
                      <CardHeader>
                        <Heading size="md">Account Overview</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          <Box>
                            <Text fontSize="sm" color="gray.500" fontWeight="medium">Company</Text>
                            <Text fontWeight="semibold">{me.customer.name}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.500" fontWeight="medium">API Key</Text>
                            <Text fontFamily="mono" fontSize="sm" bg="gray.100" p={2} borderRadius="md">
                              {me.customer.apiKey}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.500" fontWeight="medium">Total Subscribers</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                              {me.subscriberCount?.toLocaleString() || 0}
                            </Text>
                          </Box>
                          {me.customer.plan && (
                            <Box>
                              <Text fontSize="sm" color="gray.500" fontWeight="medium">Plan</Text>
                              <Badge colorScheme="green" textTransform="capitalize">
                                {me.customer.plan}
                              </Badge>
                            </Box>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Quick Stats */}
                    <Card bg={cardBg} borderRadius="xl">
                      <CardHeader>
                        <Heading size="md">Quick Stats</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">Total Sent</Text>
                            <Text fontWeight="bold" color="green.500">
                              {me.notificationStats?.sent?.toLocaleString() || 0}
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">Failed</Text>
                            <Text fontWeight="bold" color="red.500">
                              {me.notificationStats?.failed?.toLocaleString() || 0}
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">Open Rate</Text>
                            <Text fontWeight="bold" color="purple.500">
                              {me.notificationStats?.openRate || 0}%
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">Click Rate</Text>
                            <Text fontWeight="bold" color="orange.500">
                              {me.notificationStats?.clickRate || 0}%
                            </Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </Grid>
              </TabPanel>
              
              {/* Send Notification Tab */}
              <TabPanel px={0}>
                <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
                  <Card bg={cardBg} borderRadius="xl">
                    <CardHeader>
                      <Heading size="lg">Send Test Notification</Heading>
                      <Text color="gray.600" mt={2}>Send a test notification to all your subscribers</Text>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <Box>
                          <Text fontWeight="semibold" mb={2} color="gray.700">Title</Text>
                          <Input 
                            value={test.title} 
                            onChange={e => setTest({ ...test, title: e.target.value })}
                            placeholder="Notification title"
                            size="lg"
                          />
                        </Box>
                        <Box>
                          <Text fontWeight="semibold" mb={2} color="gray.700">Message</Text>
                          <Textarea 
                            value={test.body} 
                            onChange={e => setTest({ ...test, body: e.target.value })}
                            placeholder="Notification message"
                            rows={4}
                            size="lg"
                          />
                        </Box>
                        <Box>
                          <Text fontWeight="semibold" mb={2} color="gray.700">Landing URL (Optional)</Text>
                          <Input 
                            value={test.url} 
                            onChange={e => setTest({ ...test, url: e.target.value })}
                            placeholder="https://example.com"
                            size="lg"
                          />
                        </Box>
                        <Button 
                          colorScheme="blue" 
                          size="lg" 
                          onClick={() => sendTest().catch(e=>alert(e.message))}
                          isDisabled={!test.title || !test.body}
                        >
                          Send Test Notification
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} borderRadius="xl">
                    <CardHeader>
                      <Heading size="md">Preview</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Box p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
                          <HStack spacing={3} mb={2}>
                            <Box w={10} h={10} bg="blue.500" borderRadius="md" flexShrink={0} />
                            <VStack align="start" spacing={1} flex={1}>
                              <Text fontWeight="bold" fontSize="sm" color="gray.900">
                                {test.title || 'Notification Title'}
                              </Text>
                              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                {test.body || 'Your notification message will appear here...'}
                              </Text>
                              {test.url && (
                                <Text fontSize="xs" color="blue.500" textDecoration="underline">
                                  {test.url}
                                </Text>
                              )}
                            </VStack>
                          </HStack>
                        </Box>
                        <Text fontSize="sm" color="gray.500" textAlign="center">
                          This is how your notification will appear to users
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>
              </TabPanel>
              
              {/* Scheduler Tab */}
              <TabPanel px={0}>
                <NotificationScheduler />
              </TabPanel>
              
              {/* Templates Tab */}
              <TabPanel px={0}>
                <NotificationTemplates />
              </TabPanel>
              
              {/* Segments Tab */}
              <TabPanel px={0}>
                <UserSegments />
              </TabPanel>
              
              {/* Webhooks Tab */}
              <TabPanel px={0}>
                <WebhookManagement />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Layout>
  )
}

