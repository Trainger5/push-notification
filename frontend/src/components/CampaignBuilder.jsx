import { useState, useEffect, useCallback } from 'react'
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
  useDisclosure,
  SimpleGrid,
  Switch,
  Checkbox,
  Stack,
  Tag,
  TagLabel,
  Tooltip
} from '@chakra-ui/react'
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/tabs'
import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/number-input'
// Note: Using Box with border instead of Divider due to import issues
import {
  FormControl,
  FormLabel,
  FormHelperText
} from '@chakra-ui/form-control'
import { Card, CardBody, CardHeader } from '@chakra-ui/card'
import { Spinner } from '@chakra-ui/spinner'
import { Alert, AlertIcon } from '@chakra-ui/alert'
import { useToast } from '@chakra-ui/toast'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter
} from '@chakra-ui/modal'
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/stat'
import {
  FiPlay,
  FiPause,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCopy,
  FiUsers,
  FiMail,
  FiClock,
  FiZap,
  FiTarget,
  FiBarChart,
  FiSettings,
  FiArrowDown,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiSave,
  FiActivity
} from 'react-icons/fi'

// CSS for spinner animation and modals
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
  `
  document.head.appendChild(style)
}
import { format, parseISO } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const CampaignCard = ({ campaign, onView, onEdit, onStart, onPause, onDelete, onDuplicate }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green'
      case 'paused': return 'orange'
      case 'completed': return 'blue'
      case 'draft': return 'gray'
      default: return 'gray'
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num?.toString() || '0'
  }

  return (
    <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
      <CardHeader>
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold" noOfLines={1}>
              {campaign.name}
            </Text>
            <Badge 
              colorScheme={getStatusColor(campaign.status)}
              textTransform="capitalize"
            >
              {campaign.status}
            </Badge>
          </HStack>
          {campaign.description && (
            <Text fontSize="sm" color="gray.600" noOfLines={2}>
              {campaign.description}
            </Text>
          )}
          <HStack spacing={2}>
            <Tag size="sm" colorScheme="blue">
              <TagLabel>{campaign.trigger?.type || 'manual'} trigger</TagLabel>
            </Tag>
            <Tag size="sm" colorScheme="purple">
              <TagLabel>{campaign.steps?.length || 0} steps</TagLabel>
            </Tag>
          </HStack>
        </VStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          {/* Campaign Stats */}
          <SimpleGrid columns={3} spacing={4}>
            <VStack spacing={1}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">Entered</Text>
              <Text fontSize="lg" fontWeight="bold" color="blue.500">
                {formatNumber(campaign.stats?.totalEntered || 0)}
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">Active</Text>
              <Text fontSize="lg" fontWeight="bold" color="orange.500">
                {formatNumber(campaign.stats?.currentlyActive || 0)}
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">Converted</Text>
              <Text fontSize="lg" fontWeight="bold" color="green.500">
                {campaign.stats?.conversionRate || 0}%
              </Text>
            </VStack>
          </SimpleGrid>

          {/* Progress for active campaigns */}
          {campaign.status === 'active' && (
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color="gray.600">Campaign Progress</Text>
                <Text fontSize="sm" color="gray.600">
                  {campaign.stats?.completed || 0} completed
                </Text>
              </HStack>
              <div style={{width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px'}}>
                <div style={{width: '60%', height: '100%', backgroundColor: '#3182CE', borderRadius: '4px'}}></div>
              </div>
            </Box>
          )}

          {/* Actions */}
          <HStack spacing={2} justify="stretch">
            <Button size="sm" variant="outline" flex={1} onClick={() => onView(campaign)}>
              <Icon as={FiEye} mr={1} />
              View
            </Button>
            
            {campaign.status === 'draft' || campaign.status === 'paused' ? (
              <Button size="sm" colorScheme="green" onClick={() => onStart(campaign)}>
                <Icon as={FiPlay} />
              </Button>
            ) : campaign.status === 'active' ? (
              <Button size="sm" colorScheme="orange" onClick={() => onPause(campaign)}>
                <Icon as={FiPause} />
              </Button>
            ) : null}
            
            <Button size="sm" variant="outline" onClick={() => onEdit(campaign)}>
              <Icon as={FiEdit2} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDuplicate(campaign)}>
              <Icon as={FiCopy} />
            </Button>
            
            {campaign.status !== 'active' && (
              <Button size="sm" colorScheme="red" variant="outline" onClick={() => onDelete(campaign)}>
                <Icon as={FiTrash2} />
              </Button>
            )}
          </HStack>

          {/* Last Updated */}
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Updated: {format(parseISO(campaign.updatedAt || campaign.createdAt), 'MMM d, yyyy')}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  )
}

const CampaignBuilderModal = ({ campaign, isOpen, onClose, onSave, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: {
      type: 'subscription',
      conditions: {}
    },
    steps: [],
    targetSegment: 'all',
    isActive: false
  })
  
  const [currentStep, setCurrentStep] = useState({
    type: 'notification',
    name: '',
    title: '',
    body: '',
    url: '',
    duration: 1,
    unit: 'days'
  })
  
  const [loading, setLoading] = useState(false)
  const [segments, setSegments] = useState([])
  const [templates, setTemplates] = useState([])
  
  const headers = useAuthHeaders()
  const toast = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchSegments()
      fetchTemplates()
      
      if (campaign && mode === 'edit') {
        setFormData({
          name: campaign.name || '',
          description: campaign.description || '',
          trigger: campaign.trigger || { type: 'subscription', conditions: {} },
          steps: campaign.steps || [],
          targetSegment: campaign.targetSegment || 'all',
          isActive: campaign.isActive !== false
        })
      }
    }
  }, [campaign, mode, isOpen])

  const fetchSegments = async () => {
    try {
      const response = await fetch(getApiUrl('/api/segments/list'), { headers })
      if (response.ok) {
        const data = await response.json()
        setSegments(data.segments || [])
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch(getApiUrl('/api/templates/list?active=true'), { headers })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.name || formData.steps.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Campaign name and at least one step are required',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      const endpoint = mode === 'edit' 
        ? getApiUrl(`/api/campaigns/${campaign._id}`)
        : getApiUrl('/api/campaigns/create')
      
      const method = mode === 'edit' ? 'PUT' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save campaign')
      }

      toast({
        title: 'Success',
        description: `Campaign ${mode === 'edit' ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 3000,
      })

      onSave()
      onClose()
      resetForm()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger: { type: 'subscription', conditions: {} },
      steps: [],
      targetSegment: 'all',
      isActive: false
    })
    setCurrentStep({
      type: 'notification',
      name: '',
      title: '',
      body: '',
      url: '',
      duration: 1,
      unit: 'days'
    })
  }

  const addStep = () => {
    if (currentStep.type === 'notification' && (!currentStep.title || !currentStep.body)) {
      toast({
        title: 'Validation Error',
        description: 'Notification steps require title and body',
        status: 'error',
        duration: 3000,
      })
      return
    }

    const newStep = {
      ...currentStep,
      id: Date.now().toString(),
      order: formData.steps.length
    }

    setFormData({
      ...formData,
      steps: [...formData.steps, newStep]
    })

    // Reset current step
    setCurrentStep({
      type: 'notification',
      name: '',
      title: '',
      body: '',
      url: '',
      duration: 1,
      unit: 'days'
    })
  }

  const removeStep = (stepIndex) => {
    const updatedSteps = formData.steps.filter((_, index) => index !== stepIndex)
    setFormData({
      ...formData,
      steps: updatedSteps.map((step, index) => ({ ...step, order: index }))
    })
  }

  const moveStep = (fromIndex, toIndex) => {
    const steps = [...formData.steps]
    const [movedStep] = steps.splice(fromIndex, 1)
    steps.splice(toIndex, 0, movedStep)
    
    setFormData({
      ...formData,
      steps: steps.map((step, index) => ({ ...step, order: index }))
    })
  }

  const getStepIcon = (stepType) => {
    switch (stepType) {
      case 'notification': return FiMail
      case 'wait': return FiClock
      case 'condition': return FiTarget
      case 'segment_update': return FiUsers
      case 'webhook': return FiZap
      default: return FiSettings
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {mode === 'edit' ? 'Edit' : 'Create'} Drip Campaign
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Basic Info */}
            <Box>
              <Heading size="md" mb={4}>Campaign Details</Heading>
              <VStack spacing={4} align="stretch">
                <HStack spacing={4}>
                  <FormControl isRequired flex={2}>
                    <FormLabel>Campaign Name</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter campaign name"
                    />
                  </FormControl>

                  <FormControl flex={1}>
                    <FormLabel>Target Segment</FormLabel>
                    <select
                      value={formData.targetSegment}
                      onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
                    >
                      <option value="all">All Subscribers</option>
                      {segments.map(segment => (
                        <option key={segment._id} value={segment._id}>
                          {segment.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this campaign"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </Box>

            <Box h="1px" bg="gray.200" my={4} />

            {/* Trigger Configuration */}
            <Box>
              <Heading size="md" mb={4}>Campaign Trigger</Heading>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Trigger Type</FormLabel>
                  <select
                    value={formData.trigger.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger: { ...formData.trigger, type: e.target.value }
                    })}
                  >
                    <option value="subscription">New Subscription</option>
                    <option value="event">Custom Event</option>
                    <option value="date">Specific Date</option>
                    <option value="inactivity">User Inactivity</option>
                    <option value="segment_entry">Segment Entry</option>
                    <option value="behavior">Behavior-based</option>
                  </select>
                  <FormHelperText>
                    When should this campaign be triggered for users?
                  </FormHelperText>
                </FormControl>

                {formData.trigger.type === 'inactivity' && (
                  <HStack>
                    <FormControl>
                      <FormLabel>Inactivity Period</FormLabel>
                      <NumberInput
                        value={formData.trigger.conditions?.days || 7}
                        onChange={(val) => setFormData({
                          ...formData,
                          trigger: {
                            ...formData.trigger,
                            conditions: { ...formData.trigger.conditions, days: val }
                          }
                        })}
                        min={1}
                        max={365}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    <Text mt={8}>days of inactivity</Text>
                  </HStack>
                )}

                {formData.trigger.type === 'event' && (
                  <FormControl>
                    <FormLabel>Event Name</FormLabel>
                    <Input
                      value={formData.trigger.conditions?.eventName || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        trigger: {
                          ...formData.trigger,
                          conditions: { ...formData.trigger.conditions, eventName: e.target.value }
                        }
                      })}
                      placeholder="e.g., purchase_completed"
                    />
                    <FormHelperText>Custom event name to trigger this campaign</FormHelperText>
                  </FormControl>
                )}
              </VStack>
            </Box>

            <Box h="1px" bg="gray.200" my={4} />

            {/* Campaign Steps */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Campaign Steps</Heading>
                <Badge colorScheme="blue" variant="outline">
                  {formData.steps.length} steps
                </Badge>
              </HStack>

              {/* Existing Steps */}
              {formData.steps.length > 0 && (
                <VStack spacing={3} align="stretch" mb={6}>
                  {formData.steps.map((step, index) => (
                    <Card key={step.id} borderWidth="1px">
                      <CardBody py={3}>
                        <HStack justify="space-between">
                          <HStack spacing={3}>
                            <Box p={2} bg="blue.100" borderRadius="md">
                              <Icon as={getStepIcon(step.type)} color="blue.500" />
                            </Box>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" fontSize="sm">
                                {step.name || `${step.type} Step`}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                {step.type === 'notification' && `"${step.title}"`}
                                {step.type === 'wait' && `Wait ${step.duration} ${step.unit}`}
                                {step.type === 'condition' && 'Conditional logic'}
                              </Text>
                            </VStack>
                          </HStack>
                          <HStack spacing={2}>
                            <Text fontSize="xs" color="gray.500">#{index + 1}</Text>
                            <Button size="xs" variant="ghost" onClick={() => removeStep(index)}>
                              <Icon as={FiTrash2} />
                            </Button>
                          </HStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}

              {/* Add New Step */}
              <Card bg="gray.50" borderWidth="1px" borderStyle="dashed">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="bold">Add New Step</Text>
                      <select
                        value={currentStep.type}
                        onChange={(e) => setCurrentStep({ ...currentStep, type: e.target.value })}
                        w="200px"
                      >
                        <option value="notification">Send Notification</option>
                        <option value="wait">Wait/Delay</option>
                        <option value="condition">Add Condition</option>
                        <option value="segment_update">Update Segment</option>
                        <option value="webhook">Trigger Webhook</option>
                      </select>
                    </HStack>

                    {currentStep.type === 'notification' && (
                      <VStack spacing={3} align="stretch">
                        <FormControl>
                          <FormLabel>Step Name</FormLabel>
                          <Input
                            value={currentStep.name}
                            onChange={(e) => setCurrentStep({ ...currentStep, name: e.target.value })}
                            placeholder="e.g., Welcome Message"
                          />
                        </FormControl>
                        <HStack spacing={4}>
                          <FormControl isRequired>
                            <FormLabel>Notification Title</FormLabel>
                            <Input
                              value={currentStep.title}
                              onChange={(e) => setCurrentStep({ ...currentStep, title: e.target.value })}
                              placeholder="Notification title"
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>URL</FormLabel>
                            <Input
                              value={currentStep.url}
                              onChange={(e) => setCurrentStep({ ...currentStep, url: e.target.value })}
                              placeholder="Landing page URL"
                              type="url"
                            />
                          </FormControl>
                        </HStack>
                        <FormControl isRequired>
                          <FormLabel>Notification Body</FormLabel>
                          <Textarea
                            value={currentStep.body}
                            onChange={(e) => setCurrentStep({ ...currentStep, body: e.target.value })}
                            placeholder="Notification message"
                            rows={3}
                          />
                        </FormControl>
                      </VStack>
                    )}

                    {currentStep.type === 'wait' && (
                      <VStack spacing={3} align="stretch">
                        <FormControl>
                          <FormLabel>Step Name</FormLabel>
                          <Input
                            value={currentStep.name}
                            onChange={(e) => setCurrentStep({ ...currentStep, name: e.target.value })}
                            placeholder="e.g., Wait 3 days"
                          />
                        </FormControl>
                        <HStack>
                          <FormControl>
                            <FormLabel>Wait Duration</FormLabel>
                            <NumberInput
                              value={currentStep.duration}
                              onChange={(val) => setCurrentStep({ ...currentStep, duration: val || 1 })}
                              min={1}
                              max={365}
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Unit</FormLabel>
                            <select
                              value={currentStep.unit}
                              onChange={(e) => setCurrentStep({ ...currentStep, unit: e.target.value })}
                            >
                              <option value="minutes">Minutes</option>
                              <option value="hours">Hours</option>
                              <option value="days">Days</option>
                              <option value="weeks">Weeks</option>
                            </select>
                          </FormControl>
                        </HStack>
                      </VStack>
                    )}

                    <HStack justify="flex-end">
                      <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={addStep}>
                        Add Step
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSave}
              isLoading={loading}
              loadingText={mode === 'edit' ? 'Updating...' : 'Creating...'}
            >
              {mode === 'edit' ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default function CampaignBuilder() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [campaignToDelete, setCampaignToDelete] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()

  const headers = useAuthHeaders()
  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.800')

  const getApiUrl = (endpoint) => {
    const apiBase = 'http://localhost:4000'
    return `${apiBase}${endpoint}`
  }

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const response = await fetch(getApiUrl(`/api/campaigns/list${query}`), { headers })
      
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [statusFilter])

  const handleStart = async (campaign) => {
    try {
      const response = await fetch(getApiUrl(`/api/campaigns/${campaign._id}/start`), {
        method: 'POST',
        headers
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start campaign')
      }

      toast({
        title: 'Success',
        description: 'Campaign started successfully',
        status: 'success',
        duration: 3000,
      })

      fetchCampaigns()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handlePause = async (campaign) => {
    try {
      const response = await fetch(getApiUrl(`/api/campaigns/${campaign._id}/pause`), {
        method: 'POST',
        headers
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to pause campaign')
      }

      toast({
        title: 'Success',
        description: 'Campaign paused successfully',
        status: 'success',
        duration: 3000,
      })

      fetchCampaigns()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleDelete = async () => {
    if (!campaignToDelete) return

    try {
      const response = await fetch(getApiUrl(`/api/campaigns/${campaignToDelete._id}`), {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete campaign')
      }

      toast({
        title: 'Success',
        description: 'Campaign deleted successfully',
        status: 'success',
        duration: 3000,
      })

      fetchCampaigns()
      onDeleteClose()
      setCampaignToDelete(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleDuplicate = (campaign) => {
    const duplicatedCampaign = {
      ...campaign,
      name: `${campaign.name} (Copy)`,
      _id: undefined,
      status: 'draft',
      stats: { totalEntered: 0, currentlyActive: 0, completed: 0, failed: 0, conversionRate: 0 },
      createdAt: undefined,
      updatedAt: undefined
    }
    
    setSelectedCampaign(duplicatedCampaign)
    onCreateOpen()
  }

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    totalEntered: campaigns.reduce((sum, c) => sum + (c.stats?.totalEntered || 0), 0)
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="lg">Drip Campaigns & Journeys</Heading>
          <Text color="gray.600" mt={1}>
            Create automated notification sequences and user journeys
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button leftIcon={<FiRefreshCw />} variant="outline" onClick={fetchCampaigns}>
            Refresh
          </Button>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
            Create Campaign
          </Button>
        </HStack>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel>Total Campaigns</StatLabel>
              <StatNumber color="blue.500">{stats.total}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel>Active</StatLabel>
              <StatNumber color="green.500">{stats.active}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel>Draft</StatLabel>
              <StatNumber color="orange.500">{stats.draft}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel>Total Entered</StatLabel>
              <StatNumber color="purple.500">{stats.totalEntered.toLocaleString()}</StatNumber>
              <StatHelpText>users in campaigns</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filter */}
      <HStack spacing={4}>
        <Text fontSize="sm" color="gray.600">Filter:</Text>
        <select w="200px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Campaigns</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </HStack>

      {/* Campaigns Grid */}
      {loading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : campaigns.length === 0 ? (
        <Card bg={cardBg} borderRadius="xl">
          <CardBody py={16}>
            <VStack spacing={4}>
              <Icon as={FiActivity} boxSize={16} color="gray.400" />
              <VStack spacing={2} textAlign="center">
                <Heading size="md" color="gray.600">
                  {statusFilter === 'all' ? 'No Campaigns Yet' : `No ${statusFilter} campaigns`}
                </Heading>
                <Text color="gray.500" maxW="md">
                  Create your first drip campaign to automate user journeys and improve engagement with targeted notification sequences
                </Text>
              </VStack>
              {statusFilter === 'all' && (
                <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
                  Create Your First Campaign
                </Button>
              )}
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign._id}
              campaign={campaign}
              onView={(c) => { setSelectedCampaign(c); onViewOpen() }}
              onEdit={(c) => { setSelectedCampaign(c); onEditOpen() }}
              onStart={handleStart}
              onPause={handlePause}
              onDelete={(c) => { setCampaignToDelete(c); onDeleteOpen() }}
              onDuplicate={handleDuplicate}
            />
          ))}
        </SimpleGrid>
      )}

      {/* Modals */}
      <CampaignBuilderModal
        campaign={selectedCampaign}
        isOpen={isCreateOpen}
        onClose={() => {
          onCreateClose()
          setSelectedCampaign(null)
        }}
        onSave={fetchCampaigns}
        mode="create"
      />

      <CampaignBuilderModal
        campaign={selectedCampaign}
        isOpen={isEditOpen}
        onClose={() => {
          onEditClose()
          setSelectedCampaign(null)
        }}
        onSave={fetchCampaigns}
        mode="edit"
      />

      {/* Delete Confirmation */}
      {isDeleteOpen && (
        <div className="modal-overlay" onClick={onDeleteClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <Heading size="md" mb={4}>Delete Campaign</Heading>
            <Text mb={6}>
              Are you sure you want to delete "{campaignToDelete?.name}"? This action cannot be undone and will stop all active user journeys.
            </Text>
            <HStack justify="flex-end">
              <Button onClick={onDeleteClose}>Cancel</Button>
              <Button colorScheme="red" ml={3} onClick={handleDelete}>
                Delete
              </Button>
            </HStack>
          </div>
        </div>
      )}
    </VStack>
  )
}