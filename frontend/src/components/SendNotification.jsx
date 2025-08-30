import { useState, useEffect } from 'react'
import { useColorModeValue } from '@chakra-ui/color-mode'
import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Input,
  Textarea,
  Flex,
  Icon,
  Code,
  Stack,
  ButtonGroup,
  Switch,
  Tag,
  TagLabel
} from '@chakra-ui/react'
import { useToast } from '@chakra-ui/toast'
import {
  FormControl,
  FormLabel,
  FormHelperText
} from '@chakra-ui/form-control'
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/tabs'
import { Card, CardBody, CardHeader } from '@chakra-ui/card'
import { Spinner } from '@chakra-ui/spinner'
import { Alert, AlertIcon } from '@chakra-ui/alert'
import {
  FiSend,
  FiClock,
  FiBell,
  FiFileText,
  FiLink,
  FiImage,
  FiTag,
  FiUsers,
  FiFilter,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi'
import { format } from 'date-fns'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const NotificationPreview = ({ title, body, url, image, icon, badge, actions, requireInteraction }) => {
  const previewBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" mb={2}>Notification Preview</Text>
      <Box p={4} bg={previewBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <VStack align="stretch" spacing={4}>
          {/* Desktop Preview */}
          <Box>
            <Text fontSize="xs" color="gray.500" mb={2}>Desktop Notification</Text>
            <Box bg="white" borderRadius="md" p={3} border="1px solid" borderColor="gray.300" maxW="400px">
              <HStack spacing={3} align="start">
                <Box 
                  w={10} 
                  h={10} 
                  bg={icon ? 'gray.100' : 'blue.500'} 
                  borderRadius="md" 
                  flexShrink={0}
                  backgroundImage={icon ? `url(${icon})` : undefined}
                  backgroundSize="cover"
                  backgroundPosition="center"
                />
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                    {title || 'Notification Title'}
                  </Text>
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>
                    {body || 'Your notification message will appear here...'}
                  </Text>
                  {requireInteraction && (
                    <Badge colorScheme="orange" size="sm">Persistent</Badge>
                  )}
                </VStack>
              </HStack>
              
              {/* Large Image Preview */}
              {image && (
                <Box mt={3}>
                  <Box 
                    h="120px" 
                    bg="gray.200" 
                    borderRadius="md"
                    backgroundImage={`url(${image})`}
                    backgroundSize="cover"
                    backgroundPosition="center"
                  />
                </Box>
              )}
              
              {/* Action Buttons Preview */}
              {actions && actions.length > 0 && (
                <HStack spacing={2} mt={3} justify="flex-end">
                  {actions.slice(0, 2).map((action, index) => (
                    <Button key={index} size="xs" variant="outline" colorScheme="blue">
                      {action.title}
                    </Button>
                  ))}
                </HStack>
              )}
              
              {url && (
                <HStack spacing={1} mt={2} justify="center">
                  <Icon as={FiLink} boxSize={3} color="blue.500" />
                  <Text fontSize="xs" color="blue.500" textDecoration="underline" noOfLines={1}>
                    {url}
                  </Text>
                </HStack>
              )}
            </Box>
          </Box>

          {/* Mobile Preview */}
          <Box>
            <Text fontSize="xs" color="gray.500" mb={2}>Mobile Notification</Text>
            <Box bg="white" borderRadius="md" p={3} border="1px solid" borderColor="gray.300" maxW="300px">
              <HStack spacing={2} align="start">
                <Box 
                  w={8} 
                  h={8} 
                  bg={icon ? 'gray.100' : 'blue.500'} 
                  borderRadius="sm" 
                  flexShrink={0}
                  backgroundImage={icon ? `url(${icon})` : undefined}
                  backgroundSize="cover"
                  backgroundPosition="center"
                />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontWeight="bold" fontSize="xs" noOfLines={1}>
                    {title || 'Notification Title'}
                  </Text>
                  <Text fontSize="xs" color="gray.600" noOfLines={1}>
                    {body || 'Your notification message will appear here...'}
                  </Text>
                </VStack>
              </HStack>
              
              {image && (
                <Box mt={2}>
                  <Box 
                    h="80px" 
                    bg="gray.200" 
                    borderRadius="sm"
                    backgroundImage={`url(${image})`}
                    backgroundSize="cover"
                    backgroundPosition="center"
                  />
                </Box>
              )}
            </Box>
          </Box>
        </VStack>
      </Box>
    </Box>
  )
}

export default function SendNotification() {
  const [mode, setMode] = useState('direct') // 'direct' or 'template'
  const [templates, setTemplates] = useState([])
  const [segments, setSegments] = useState([])
  const [stats, setStats] = useState({ subscribers: 0, sent: 0, failed: 0 })
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    url: '',
    image: '',
    icon: '',
    badge: '',
    tag: '',
    targetSegment: 'all',
    scheduledFor: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    requireInteraction: false,
    silent: false,
    renotify: false,
    vibrate: [200, 100, 200],
    dir: 'auto',
    lang: 'en-US',
    actions: [],
    data: {}
  })

  const [templateForm, setTemplateForm] = useState({
    selectedTemplate: '',
    variables: {},
    targetSegment: 'all',
    scheduledFor: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  const headers = useAuthHeaders()
  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.800')

  const getApiUrl = (endpoint) => {
    const apiBase = 'http://localhost:4000'
    return `${apiBase}${endpoint}`
  }

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
      // Fetch templates
      const templatesRes = await fetch(getApiUrl('/api/templates/list?active=true'), { headers })
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData.templates)
      }

      // Fetch segments
      const segmentsRes = await fetch(getApiUrl('/api/segments/list'), { headers })
      if (segmentsRes.ok) {
        const segmentsData = await segmentsRes.json()
        setSegments(segmentsData.segments || [])
      }

      // Fetch stats
      const meRes = await fetch(getApiUrl('/api/customer/me'), { headers })
      if (meRes.ok) {
        const meData = await meRes.json()
        setStats({
          subscribers: meData.subscriberCount || 0,
          sent: meData.notificationStats?.sent || 0,
          failed: meData.notificationStats?.failed || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load data',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  const handleSendDirect = async (schedule = false) => {
    if (!formData.title || !formData.body) {
      toast({
        title: 'Validation Error',
        description: 'Title and body are required',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      setSending(true)
      
      const payload = {
        title: formData.title,
        body: formData.body,
        url: formData.url || undefined,
        image: formData.image || undefined,
        icon: formData.icon || undefined,
        badge: formData.badge || undefined,
        tag: formData.tag || undefined,
        silent: formData.silent || false,
        requireInteraction: formData.requireInteraction || false,
        renotify: formData.renotify || false,
        vibrate: formData.vibrate,
        dir: formData.dir || 'auto',
        lang: formData.lang || 'en-US',
        actions: formData.actions.length > 0 ? formData.actions : undefined,
        data: Object.keys(formData.data).length > 0 ? formData.data : undefined
      }

      if (schedule && formData.scheduledFor) {
        // Use scheduled endpoint
        const schedulePayload = {
          ...payload,
          scheduledFor: new Date(formData.scheduledFor).toISOString(),
          timezone: formData.timezone,
          targetSegment: formData.targetSegment
        }

        const response = await fetch(getApiUrl('/api/scheduled/schedule'), {
          method: 'POST',
          headers,
          body: JSON.stringify(schedulePayload)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to schedule notification')
        }

        const data = await response.json()
        toast({
          title: 'Success',
          description: 'Notification scheduled successfully',
          status: 'success',
          duration: 5000,
        })
        
        // Reset form
        setFormData({
          title: '',
          body: '',
          url: '',
          image: '',
          icon: '',
          badge: '',
          tag: '',
          targetSegment: 'all',
          scheduledFor: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          requireInteraction: false,
          silent: false,
          renotify: false,
          vibrate: [200, 100, 200],
          dir: 'auto',
          lang: 'en-US',
          actions: [],
          data: {}
        })
      } else {
        // Send immediately
        const response = await fetch(getApiUrl('/api/customer/notify'), {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to send notification')
        }

        const data = await response.json()
        toast({
          title: 'Success',
          description: `Notification sent! Delivered: ${data.sent}, Failed: ${data.failed}`,
          status: 'success',
          duration: 5000,
        })

        // Update stats
        setStats(prev => ({
          ...prev,
          sent: prev.sent + data.sent,
          failed: prev.failed + data.failed
        }))

        // Reset form
        setFormData({
          title: '',
          body: '',
          url: '',
          image: '',
          icon: '',
          badge: '',
          tag: '',
          targetSegment: 'all',
          scheduledFor: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          requireInteraction: false,
          silent: false,
          renotify: false,
          vibrate: [200, 100, 200],
          dir: 'auto',
          lang: 'en-US',
          actions: [],
          data: {}
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    } finally {
      setSending(false)
    }
  }

  const handleSendTemplate = async (schedule = false) => {
    if (!templateForm.selectedTemplate) {
      toast({
        title: 'Validation Error',
        description: 'Please select a template',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      setSending(true)
      
      const payload = {
        variables: templateForm.variables
      }

      if (schedule && templateForm.scheduledFor) {
        payload.scheduledFor = new Date(templateForm.scheduledFor).toISOString()
        payload.timezone = templateForm.timezone
      }

      const response = await fetch(getApiUrl(`/api/templates/${templateForm.selectedTemplate}/send`), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send notification')
      }

      const data = await response.json()
      
      if (schedule) {
        toast({
          title: 'Success',
          description: 'Notification scheduled successfully using template',
          status: 'success',
          duration: 5000,
        })
      } else {
        toast({
          title: 'Success',
          description: `Notification sent! Delivered: ${data.sent}, Failed: ${data.failed}`,
          status: 'success',
          duration: 5000,
        })
        
        // Update stats
        setStats(prev => ({
          ...prev,
          sent: prev.sent + (data.sent || 0),
          failed: prev.failed + (data.failed || 0)
        }))
      }

      // Reset form
      setTemplateForm({
        selectedTemplate: '',
        variables: {},
        targetSegment: 'all',
        scheduledFor: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    } finally {
      setSending(false)
    }
  }

  const selectedTemplate = templates.find(t => t._id === templateForm.selectedTemplate)

  const processTemplateText = (text, variables) => {
    if (!text || !selectedTemplate) return text
    let processed = text
    if (selectedTemplate.variables) {
      selectedTemplate.variables.forEach(varName => {
        const value = variables[varName] || `{{${varName}}}`
        processed = processed.replace(new RegExp(`{{${varName}}}`, 'g'), value)
      })
    }
    return processed
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    )
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* Professional Header with Enhanced Stats */}
      <Box 
        bgGradient="linear(to-r, blue.500, purple.600)"
        borderRadius="2xl"
        p={8}
        color="white"
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" top={0} right={0} opacity={0.1}>
          <Icon as={FiBell} boxSize="120px" />
        </Box>
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8} position="relative" zIndex={1}>
          <VStack align="start" spacing={4}>
            <HStack spacing={3}>
              <Box p={3} bg="whiteAlpha.200" borderRadius="xl">
                <Icon as={FiSend} boxSize={8} />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="xl" color="white">Send Notification</Heading>
                <Text opacity={0.9} fontSize="lg">
                  Reach your audience with engaging push notifications
                </Text>
              </VStack>
            </HStack>
            <Text opacity={0.8} maxW="lg">
              Create and send targeted push notifications to your subscribers. 
              Schedule for optimal delivery times or send immediately to maximize engagement.
            </Text>
          </VStack>
          
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <Box bg="whiteAlpha.200" borderRadius="xl" p={4} textAlign="center">
              <Icon as={FiUsers} boxSize={6} mb={2} />
              <Text fontSize="sm" opacity={0.8}>Total Subscribers</Text>
              <Text fontSize="2xl" fontWeight="bold">{stats.subscribers}</Text>
            </Box>
            <Box bg="whiteAlpha.200" borderRadius="xl" p={4} textAlign="center">
              <Icon as={FiCheckCircle} boxSize={6} mb={2} />
              <Text fontSize="sm" opacity={0.8}>Sent Today</Text>
              <Text fontSize="2xl" fontWeight="bold">{stats.sent}</Text>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Mode Selection */}
      <Card bg={cardBg} borderRadius="xl">
        <CardBody>
          <ButtonGroup size="md" spacing={4}>
            <Button
              variant={mode === 'direct' ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => setMode('direct')}
              leftIcon={<Icon as={FiBell} />}
            >
              Create New Notification
            </Button>
            <Button
              variant={mode === 'template' ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => setMode('template')}
              leftIcon={<Icon as={FiFileText} />}
            >
              Use Template ({templates.length} available)
            </Button>
          </ButtonGroup>
        </CardBody>
      </Card>

      {/* Direct Notification Form */}
      {mode === 'direct' && (
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          <Card bg={cardBg} borderRadius="xl">
            <CardHeader>
              <Heading size="md">Notification Content</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter notification title"
                  />
                  <FormHelperText>The main title of your notification</FormHelperText>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Body</FormLabel>
                  <Textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Enter notification message"
                    rows={4}
                  />
                  <FormHelperText>The message content of your notification</FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Landing URL</FormLabel>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com"
                    type="url"
                  />
                  <FormHelperText>URL to open when notification is clicked</FormHelperText>
                </FormControl>

                <Tabs variant="enclosed" size="sm">
                  <TabList>
                    <Tab>Advanced Options</Tab>
                    <Tab>Schedule</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <VStack spacing={4}>
                        <FormControl>
                          <FormLabel>Image URL</FormLabel>
                          <Input
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            type="url"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Tag</FormLabel>
                          <Input
                            value={formData.tag}
                            onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                            placeholder="notification-tag"
                          />
                          <FormHelperText>Groups notifications with the same tag</FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Target Segment</FormLabel>
                          <select
                            value={formData.targetSegment}
                            onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
                          >
                            <option value="all">All Subscribers</option>
                            {segments.map(segment => (
                              <option key={segment._id} value={segment._id}>
                                {segment.name} ({segment.matchedUsers || 0} users)
                              </option>
                            ))}
                          </select>
                        </FormControl>
                      </VStack>
                    </TabPanel>

                    <TabPanel>
                      <VStack spacing={4}>
                        <FormControl>
                          <FormLabel>Schedule Date & Time</FormLabel>
                          <Input
                            type="datetime-local"
                            value={formData.scheduledFor}
                            onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                          />
                          <FormHelperText>Leave empty to send immediately</FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Timezone</FormLabel>
                          <select
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="Europe/London">London</option>
                            <option value="Europe/Paris">Paris</option>
                            <option value="Asia/Tokyo">Tokyo</option>
                            <option value="Asia/Shanghai">Shanghai</option>
                            <option value="Australia/Sydney">Sydney</option>
                          </select>
                        </FormControl>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>

                <Box borderTop="1px" borderColor="gray.200" w="full" />

                <HStack justify="flex-end" spacing={3}>
                  <Button
                    variant="outline"
                    onClick={() => setFormData({
                      title: '',
                      body: '',
                      url: '',
                      image: '',
                      icon: '',
                      badge: '',
                      tag: '',
                      targetSegment: 'all',
                      scheduledFor: '',
                      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    })}
                  >
                    Reset
                  </Button>
                  {formData.scheduledFor ? (
                    <Button
                      leftIcon={<Icon as={FiClock} />}
                      colorScheme="purple"
                      isLoading={sending}
                      loadingText="Scheduling..."
                      onClick={() => handleSendDirect(true)}
                    >
                      Schedule Notification
                    </Button>
                  ) : (
                    <Button
                      leftIcon={<Icon as={FiSend} />}
                      colorScheme="blue"
                      isLoading={sending}
                      loadingText="Sending..."
                      onClick={() => handleSendDirect(false)}
                    >
                      Send Now
                    </Button>
                  )}
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          <VStack spacing={4}>
            <Card bg={cardBg} borderRadius="xl">
              <CardBody>
                <NotificationPreview
                  title={formData.title}
                  body={formData.body}
                  url={formData.url}
                  image={formData.image}
                  icon={formData.icon}
                  badge={formData.badge}
                />
              </CardBody>
            </Card>

            <Card bg={cardBg} borderRadius="xl">
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="medium">Tips</Text>
                  <VStack align="start" spacing={2}>
                    <HStack align="start">
                      <Icon as={FiCheckCircle} color="green.500" mt={0.5} />
                      <Text fontSize="sm">Keep titles under 50 characters</Text>
                    </HStack>
                    <HStack align="start">
                      <Icon as={FiCheckCircle} color="green.500" mt={0.5} />
                      <Text fontSize="sm">Body text should be under 150 characters</Text>
                    </HStack>
                    <HStack align="start">
                      <Icon as={FiCheckCircle} color="green.500" mt={0.5} />
                      <Text fontSize="sm">Use HTTPS URLs for images and links</Text>
                    </HStack>
                    <HStack align="start">
                      <Icon as={FiCheckCircle} color="green.500" mt={0.5} />
                      <Text fontSize="sm">Test with a small segment first</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Grid>
      )}

      {/* Template Form */}
      {mode === 'template' && (
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          <Card bg={cardBg} borderRadius="xl">
            <CardHeader>
              <Heading size="md">Select Template</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Template</FormLabel>
                  <select
                    value={templateForm.selectedTemplate}
                    onChange={(e) => {
                      setTemplateForm({ 
                        ...templateForm, 
                        selectedTemplate: e.target.value,
                        variables: {}
                      })
                    }}
                    placeholder="Select a template"
                  >
                    {templates.map(template => (
                      <option key={template._id} value={template._id}>
                        {template.name} ({template.category})
                      </option>
                    ))}
                  </select>
                  {templates.length === 0 && (
                    <FormHelperText color="orange.500">
                      No templates available. Create one in the Templates section.
                    </FormHelperText>
                  )}
                </FormControl>

                {selectedTemplate && (
                  <>
                    {selectedTemplate.description && (
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        {selectedTemplate.description}
                      </Alert>
                    )}

                    {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={3}>Template Variables</Text>
                        <VStack spacing={3} align="stretch">
                          {selectedTemplate.variables.map(varName => (
                            <FormControl key={varName}>
                              <FormLabel fontSize="sm">
                                {varName} <Code fontSize="xs">{`{{${varName}}}`}</Code>
                              </FormLabel>
                              <Input
                                value={templateForm.variables[varName] || ''}
                                onChange={(e) => setTemplateForm({
                                  ...templateForm,
                                  variables: {
                                    ...templateForm.variables,
                                    [varName]: e.target.value
                                  }
                                })}
                                placeholder={`Enter ${varName}`}
                              />
                            </FormControl>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    <Tabs variant="enclosed" size="sm">
                      <TabList>
                        <Tab>Schedule</Tab>
                        <Tab>Target</Tab>
                      </TabList>
                      <TabPanels>
                        <TabPanel>
                          <VStack spacing={4}>
                            <FormControl>
                              <FormLabel>Schedule Date & Time</FormLabel>
                              <Input
                                type="datetime-local"
                                value={templateForm.scheduledFor}
                                onChange={(e) => setTemplateForm({ ...templateForm, scheduledFor: e.target.value })}
                              />
                              <FormHelperText>Leave empty to send immediately</FormHelperText>
                            </FormControl>

                            <FormControl>
                              <FormLabel>Timezone</FormLabel>
                              <select
                                value={templateForm.timezone}
                                onChange={(e) => setTemplateForm({ ...templateForm, timezone: e.target.value })}
                              >
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">Eastern Time</option>
                                <option value="America/Chicago">Central Time</option>
                                <option value="America/Denver">Mountain Time</option>
                                <option value="America/Los_Angeles">Pacific Time</option>
                                <option value="Europe/London">London</option>
                                <option value="Europe/Paris">Paris</option>
                                <option value="Asia/Tokyo">Tokyo</option>
                                <option value="Asia/Shanghai">Shanghai</option>
                                <option value="Australia/Sydney">Sydney</option>
                              </select>
                            </FormControl>
                          </VStack>
                        </TabPanel>

                        <TabPanel>
                          <FormControl>
                            <FormLabel>Target Segment</FormLabel>
                            <select
                              value={templateForm.targetSegment}
                              onChange={(e) => setTemplateForm({ ...templateForm, targetSegment: e.target.value })}
                            >
                              <option value="all">All Subscribers</option>
                              {segments.map(segment => (
                                <option key={segment._id} value={segment._id}>
                                  {segment.name} ({segment.matchedUsers || 0} users)
                                </option>
                              ))}
                            </select>
                          </FormControl>
                        </TabPanel>
                      </TabPanels>
                    </Tabs>

                    <Box borderTop="1px" borderColor="gray.200" w="full" />

                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <Badge colorScheme="purple">{selectedTemplate.category}</Badge>
                        <Badge colorScheme="gray">Used {selectedTemplate.usageCount || 0} times</Badge>
                      </HStack>
                      
                      <HStack spacing={3}>
                        {templateForm.scheduledFor ? (
                          <Button
                            leftIcon={<Icon as={FiClock} />}
                            colorScheme="purple"
                            isLoading={sending}
                            loadingText="Scheduling..."
                            onClick={() => handleSendTemplate(true)}
                          >
                            Schedule with Template
                          </Button>
                        ) : (
                          <Button
                            leftIcon={<Icon as={FiSend} />}
                            colorScheme="blue"
                            isLoading={sending}
                            loadingText="Sending..."
                            onClick={() => handleSendTemplate(false)}
                          >
                            Send with Template
                          </Button>
                        )}
                      </HStack>
                    </HStack>
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>

          <VStack spacing={4}>
            <Card bg={cardBg} borderRadius="xl">
              <CardBody>
                {selectedTemplate ? (
                  <NotificationPreview
                    title={processTemplateText(selectedTemplate.title, templateForm.variables)}
                    body={processTemplateText(selectedTemplate.body, templateForm.variables)}
                    url={processTemplateText(selectedTemplate.url, templateForm.variables)}
                    image={selectedTemplate.image}
                    icon={selectedTemplate.icon}
                    badge={selectedTemplate.badge}
                  />
                ) : (
                  <Box textAlign="center" py={8}>
                    <Icon as={FiFileText} boxSize={12} color="gray.400" mb={3} />
                    <Text color="gray.500">Select a template to preview</Text>
                  </Box>
                )}
              </CardBody>
            </Card>

            {selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
              <Card bg={cardBg} borderRadius="xl">
                <CardBody>
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" fontWeight="medium">Template Variables</Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {selectedTemplate.variables.map(varName => (
                        <Tag key={varName} size="sm" colorScheme="purple">
                          <TagLabel>{`{{${varName}}}`}</TagLabel>
                        </Tag>
                      ))}
                    </HStack>
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      Fill in the variable values to personalize your notification
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </Grid>
      )}
    </VStack>
  )
}