import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Input,
  Textarea,
  Switch,
  Badge,
  IconButton,
  useDisclosure,
  Flex,
  Tag
} from '@chakra-ui/react'
import { Card, CardBody, CardHeader } from '@chakra-ui/card'
import { useToast } from '@chakra-ui/toast'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/modal'
import { Alert } from '@chakra-ui/alert'
import { Spinner } from '@chakra-ui/spinner'
import { Tooltip } from '@chakra-ui/tooltip'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/tabs'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/table'
import {
  FormControl,
  FormLabel,
  FormErrorMessage
} from '@chakra-ui/form-control'
import { FiCalendar, FiClock, FiEdit, FiTrash2, FiPlay, FiPause, FiPlus, FiRefreshCw } from 'react-icons/fi'
import { format, parseISO, addDays, addHours, addMinutes } from 'date-fns'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const QuickScheduleOptions = ({ onselect }) => {
  const options = [
    { label: 'In 1 hour', value: addHours(new Date(), 1) },
    { label: 'In 2 hours', value: addHours(new Date(), 2) },
    { label: 'Tomorrow 9 AM', value: new Date(addDays(new Date(), 1).setHours(9, 0, 0, 0)) },
    { label: 'Tomorrow 2 PM', value: new Date(addDays(new Date(), 1).setHours(14, 0, 0, 0)) },
    { label: 'Next week', value: addDays(new Date(), 7) }
  ]

  return (
    <VStack spacing={2} align="stretch">
      <Text fontSize="sm" fontWeight="medium" color="gray.600">Quick Schedule</Text>
      {options.map((option, index) => (
        <Button
          key={index}
          size="sm"
          variant="ghost"
          justifyContent="start"
          onClick={() => onselect(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </VStack>
  )
}

const ScheduledNotificationItem = ({ notification, onEdit, onCancel, onRefresh }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'blue'
      case 'sent': return 'green'
      case 'failed': return 'red'
      case 'cancelled': return 'gray'
      default: return 'gray'
    }
  }

  const formatScheduledTime = (dateStr) => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy HH:mm')
    } catch {
      return 'Invalid date'
    }
  }

  const isEditable = notification.status === 'scheduled' && new Date(notification.scheduledFor) > new Date()

  return (
    <Card bg={cardBg} borderRadius="md" size="sm">
      <CardBody>
        <Flex justify="space-between" align="start" mb={3}>
          <Box flex={1}>
            <Heading size="sm" mb={1}>{notification.title}</Heading>
            <Text fontSize="sm" color="gray.600" noOfLines={2} mb={2}>
              {notification.body}
            </Text>
            <HStack spacing={2} mb={2}>
              <Badge colorScheme={getStatusColor(notification.status)} size="sm">
                {notification.status}
              </Badge>
              <Text fontSize="xs" color="gray.500">
                <FiCalendar style={{ display: 'inline', marginRight: '4px' }} />
                {formatScheduledTime(notification.scheduledFor)}
              </Text>
            </HStack>
            {notification.timezone && (
              <Text fontSize="xs" color="gray.400">
                Timezone: {notification.timezone}
              </Text>
            )}
          </Box>
          <VStack spacing={1}>
            {isEditable && (
              <>
                <Tooltip label="Edit">
                  <IconButton
                    icon={<FiEdit />}
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(notification)}
                  />
                </Tooltip>
                <Tooltip label="Cancel">
                  <IconButton
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => onCancel(notification._id)}
                  />
                </Tooltip>
              </>
            )}
          </VStack>
        </Flex>
      </CardBody>
    </Card>
  )
}

export default function NotificationScheduler() {
  const [scheduledNotifications, setScheduledNotifications] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingNotification, setEditingNotification] = useState(null)
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const headers = useAuthHeaders()
  const cardBg = useColorModeValue('white', 'gray.800')

  const [form, setForm] = useState({
    title: '',
    body: '',
    url: '',
    icon: '',
    badge: '',
    image: '',
    tag: '',
    scheduledFor: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  const [errors, setErrors] = useState({})

  const getApiUrl = (endpoint) => {
    const apiBase = 'http://localhost:4000'
    return `${apiBase}${endpoint}`
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [notificationsRes, statsRes] = await Promise.all([
        fetch(getApiUrl('/api/scheduled/list'), { headers }),
        fetch(getApiUrl('/api/scheduled/stats/overview'), { headers })
      ])

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json()
        setScheduledNotifications(notificationsData.notifications)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load scheduled notifications',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const validateForm = () => {
    const newErrors = {}
    
    if (!form.title.trim()) newErrors.title = 'Title is required'
    if (!form.body.trim()) newErrors.body = 'Message is required'
    if (!form.scheduledFor) newErrors.scheduledFor = 'Schedule time is required'
    
    if (form.scheduledFor) {
      const scheduledTime = new Date(form.scheduledFor)
      if (scheduledTime <= new Date()) {
        newErrors.scheduledFor = 'Schedule time must be in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const url = editingNotification 
        ? `/api/scheduled/${editingNotification._id}`
        : '/api/scheduled/schedule'
      
      const method = editingNotification ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          url: form.url || undefined,
          icon: form.icon || undefined,
          badge: form.badge || undefined,
          image: form.image || undefined,
          tag: form.tag || undefined,
          scheduledFor: new Date(form.scheduledFor).toISOString(),
          timezone: form.timezone
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to schedule notification')
      }

      toast({
        title: 'Success',
        description: editingNotification 
          ? 'Notification updated successfully' 
          : 'Notification scheduled successfully',
        status: 'success',
        duration: 3000,
      })

      resetForm()
      onClose()
      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (notification) => {
    setEditingNotification(notification)
    setForm({
      title: notification.title,
      body: notification.body,
      url: notification.url || '',
      icon: notification.icon || '',
      badge: notification.badge || '',
      image: notification.image || '',
      tag: notification.tag || '',
      scheduledFor: notification.scheduledFor.slice(0, 16), // Format for datetime-local input
      timezone: notification.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    onOpen()
  }

  const handleCancel = async (notificationId) => {
    try {
      const response = await fetch(`/api/scheduled/${notificationId}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel notification')
      }

      toast({
        title: 'Success',
        description: 'Notification cancelled successfully',
        status: 'success',
        duration: 3000,
      })

      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      body: '',
      url: '',
      icon: '',
      badge: '',
      image: '',
      tag: '',
      scheduledFor: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    setEditingNotification(null)
    setErrors({})
  }

  const handleQuickSchedule = (date) => {
    setForm(prev => ({
      ...prev,
      scheduledFor: date.toISOString().slice(0, 16)
    }))
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg">Notification Scheduler</Heading>
          <Text color="gray.600">Schedule notifications for future delivery</Text>
        </Box>
        <HStack spacing={3}>
          <Button leftIcon={<FiRefreshCw />} variant="ghost" onClick={fetchData}>
            Refresh
          </Button>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={() => { resetForm(); onOpen(); }}>
            Schedule Notification
          </Button>
        </HStack>
      </Flex>

      {/* Stats Cards */}
      {stats && (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
          <Card bg={cardBg} borderRadius="xl">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {stats.stats.pending}
              </Text>
              <Text fontSize="sm" color="gray.600">Pending</Text>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderRadius="xl">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {stats.stats.sent}
              </Text>
              <Text fontSize="sm" color="gray.600">Sent</Text>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderRadius="xl">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="red.500">
                {stats.stats.failed}
              </Text>
              <Text fontSize="sm" color="gray.600">Failed</Text>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderRadius="xl">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                {stats.stats.total}
              </Text>
              <Text fontSize="sm" color="gray.600">Total</Text>
            </CardBody>
          </Card>
        </Grid>
      )}

      <Tabs>
        <TabList>
          <Tab>All Notifications</Tab>
          <Tab>Upcoming</Tab>
          <Tab>Sent</Tab>
          <Tab>Failed</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
              {scheduledNotifications.map((notification) => (
                <ScheduledNotificationItem
                  key={notification._id}
                  notification={notification}
                  onEdit={handleEdit}
                  onCancel={handleCancel}
                />
              ))}
            </Grid>
            {scheduledNotifications.length === 0 && (
              <Alert status="info" borderRadius="md">
                No scheduled notifications found. Create your first scheduled notification!
              </Alert>
            )}
          </TabPanel>

          <TabPanel px={0}>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
              {scheduledNotifications
                .filter(n => n.status === 'scheduled' && new Date(n.scheduledFor) > new Date())
                .map((notification) => (
                  <ScheduledNotificationItem
                    key={notification._id}
                    notification={notification}
                    onEdit={handleEdit}
                    onCancel={handleCancel}
                  />
                ))}
            </Grid>
          </TabPanel>

          <TabPanel px={0}>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
              {scheduledNotifications
                .filter(n => n.status === 'sent')
                .map((notification) => (
                  <ScheduledNotificationItem
                    key={notification._id}
                    notification={notification}
                    onEdit={handleEdit}
                    onCancel={handleCancel}
                  />
                ))}
            </Grid>
          </TabPanel>

          <TabPanel px={0}>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
              {scheduledNotifications
                .filter(n => n.status === 'failed')
                .map((notification) => (
                  <ScheduledNotificationItem
                    key={notification._id}
                    notification={notification}
                    onEdit={handleEdit}
                    onCancel={handleCancel}
                  />
                ))}
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Schedule/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingNotification ? 'Edit Scheduled Notification' : 'Schedule New Notification'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Grid templateColumns={{ base: '1fr', md: '2fr 1fr' }} gap={6}>
                <VStack spacing={4} align="stretch">
                  <FormControl isInvalid={!!errors.title}>
                    <FormLabel>Title</FormLabel>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Notification title"
                    />
                    <FormErrorMessage>{errors.title}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.body}>
                    <FormLabel>Message</FormLabel>
                    <Textarea
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      placeholder="Notification message"
                      rows={3}
                    />
                    <FormErrorMessage>{errors.body}</FormErrorMessage>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Landing URL (Optional)</FormLabel>
                    <Input
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </FormControl>

                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <FormControl>
                      <FormLabel>Icon URL</FormLabel>
                      <Input
                        value={form.icon}
                        onChange={(e) => setForm({ ...form, icon: e.target.value })}
                        placeholder="Icon URL"
                        size="sm"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Badge URL</FormLabel>
                      <Input
                        value={form.badge}
                        onChange={(e) => setForm({ ...form, badge: e.target.value })}
                        placeholder="Badge URL"
                        size="sm"
                      />
                    </FormControl>
                  </Grid>

                  <FormControl isInvalid={!!errors.scheduledFor}>
                    <FormLabel>Schedule Time</FormLabel>
                    <Input
                      type="datetime-local"
                      value={form.scheduledFor}
                      onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
                    />
                    <FormErrorMessage>{errors.scheduledFor}</FormErrorMessage>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Timezone</FormLabel>
                    <select
                      value={form.timezone}
                      onChange={(e) => setForm({ ...form, timezone: e.target.value })}
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

                <VStack spacing={4} align="stretch">
                  <QuickScheduleOptions onselect={handleQuickSchedule} />
                  
                  {form.title && form.body && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>Preview</Text>
                      <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                        <HStack spacing={3} align="start">
                          <Box w={8} h={8} bg="blue.500" borderRadius="md" flexShrink={0} />
                          <VStack align="start" spacing={1} flex={1}>
                            <Text fontWeight="bold" fontSize="sm">{form.title}</Text>
                            <Text fontSize="sm" color="gray.600" noOfLines={2}>{form.body}</Text>
                            {form.url && (
                              <Text fontSize="xs" color="blue.500">{form.url}</Text>
                            )}
                          </VStack>
                        </HStack>
                      </Box>
                    </Box>
                  )}
                </VStack>
              </Grid>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                colorScheme="blue" 
                isLoading={submitting}
                loadingText={editingNotification ? "Updating..." : "Scheduling..."}
              >
                {editingNotification ? 'Update' : 'Schedule'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </VStack>
  )
}