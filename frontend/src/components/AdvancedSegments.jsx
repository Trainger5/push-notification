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
  CheckboxGroup,
  Stack,
  inputThumb,
  inputMark,
  Tag,
  TagLabel,
  TagCloseButton,
  Progress,
  Tooltip
} from '@chakra-ui/react'
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
  FormControl,
  FormLabel,
  FormHelperText
} from '@chakra-ui/form-control'
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/tabs'
import { Card, CardBody, CardHeader } from '@chakra-ui/card'
import { Spinner } from '@chakra-ui/spinner'
import { Alert, AlertIcon } from '@chakra-ui/alert'
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
  StatHelpText,
  StatArrow
} from '@chakra-ui/stat'
import {
  FiUsers,
  FiPlus,
  FiTarget,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiFilter,
  FiTrendingUp,
  FiCalendar,
  FiGlobe,
  FiSmartphone,
  FiMonitor,
  FiMail,
  FiMousePointer,
  FiClock,
  FiTag,
  FiZap,
  FiRefreshCw,
  FiDownload,
  FiShare2
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
import { format, parseISO, subDays, subWeeks, subMonths } from 'date-fns'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const SegmentCard = ({ segment, onView, onEdit, onDelete, onDuplicate }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  const getEngagementColor = (score) => {
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    if (score >= 40) return 'orange'
    return 'red'
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
      <CardHeader>
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Box
                w={4}
                h={4}
                borderRadius="full"
                bg={segment.color || 'blue.500'}
                flexShrink={0}
              />
              <Text fontSize="lg" fontWeight="bold" noOfLines={1}>
                {segment.name}
              </Text>
            </HStack>
            <Badge 
              colorScheme={segment.isActive ? 'green' : 'gray'}
              textTransform="capitalize"
            >
              {segment.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </HStack>
          {segment.description && (
            <Text fontSize="sm" color="gray.600" noOfLines={2}>
              {segment.description}
            </Text>
          )}
        </VStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          {/* Segment Stats */}
          <SimpleGrid columns={3} spacing={4}>
            <VStack spacing={1}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">Size</Text>
              <Text fontSize="lg" fontWeight="bold" color="blue.500">
                {formatNumber(segment.subscriberCount || 0)}
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">Engagement</Text>
              <Text fontSize="lg" fontWeight="bold" color={`${getEngagementColor(segment.engagementScore || 0)}.500`}>
                {segment.engagementScore || 0}%
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">Growth</Text>
              <HStack spacing={1}>
                <Text fontSize="lg" fontWeight="bold" color="green.500">
                  +{segment.growthRate || 0}%
                </Text>
                <Icon as={FiTrendingUp} color="green.500" boxSize={3} />
              </HStack>
            </VStack>
          </SimpleGrid>

          {/* Criteria Summary */}
          <Box>
            <Text fontSize="xs" color="gray.500" mb={2} textTransform="uppercase">Criteria</Text>
            <HStack spacing={2} flexWrap="wrap">
              {segment.criteriaCount?.location > 0 && (
                <Tag size="sm" colorScheme="blue">
                  <Icon as={FiGlobe} mr={1} />
                  <TagLabel>{segment.criteriaCount.location} locations</TagLabel>
                </Tag>
              )}
              {segment.criteriaCount?.device > 0 && (
                <Tag size="sm" colorScheme="purple">
                  <Icon as={FiSmartphone} mr={1} />
                  <TagLabel>{segment.criteriaCount.device} devices</TagLabel>
                </Tag>
              )}
              {segment.criteriaCount?.behavior > 0 && (
                <Tag size="sm" colorScheme="green">
                  <Icon as={FiZap} mr={1} />
                  <TagLabel>{segment.criteriaCount.behavior} behaviors</TagLabel>
                </Tag>
              )}
              {segment.criteriaCount?.time > 0 && (
                <Tag size="sm" colorScheme="orange">
                  <Icon as={FiClock} mr={1} />
                  <TagLabel>{segment.criteriaCount.time} time filters</TagLabel>
                </Tag>
              )}
            </HStack>
          </Box>

          {/* Actions */}
          <HStack spacing={2} justify="stretch">
            <Button size="sm" variant="outline" flex={1} onClick={() => onView(segment)}>
              <Icon as={FiEye} mr={1} />
              View
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(segment)}>
              <Icon as={FiEdit2} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDuplicate(segment)}>
              <Icon as={FiShare2} />
            </Button>
            <Button size="sm" colorScheme="red" variant="outline" onClick={() => onDelete(segment)}>
              <Icon as={FiTrash2} />
            </Button>
          </HStack>

          {/* Last Updated */}
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Updated: {format(parseISO(segment.updatedAt || segment.createdAt), 'MMM d, yyyy')}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  )
}

const SegmentBuilder = ({ segment, isOpen, onClose, onSave, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3182CE',
    isActive: true,
    criteria: {
      // Geographic filters
      countries: [],
      cities: [],
      regions: [],
      
      // Device/Browser filters
      browsers: [],
      os: [],
      devices: [],
      
      // Behavioral filters
      engagementScore: { min: 0, max: 100 },
      lastSeen: { value: 30, unit: 'days' },
      notificationOpens: { min: 0, max: 1000 },
      notificationClicks: { min: 0, max: 1000 },
      subscriptionDate: { start: '', end: '' },
      
      // Advanced filters
      customTags: [],
      abTestParticipant: false,
      highValueUser: false,
      recentlyActive: false,
      
      // Time-based filters
      timezone: '',
      activeHours: { start: 9, end: 17 },
      weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  })
  
  const [currentSize, setCurrentSize] = useState(0)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  
  const headers = useAuthHeaders()
  const toast = useToast()

  useEffect(() => {
    if (segment && mode === 'edit') {
      setFormData({
        name: segment.name || '',
        description: segment.description || '',
        color: segment.color || '#3182CE',
        isActive: segment.isActive !== false,
        criteria: { ...formData.criteria, ...segment.criteria }
      })
    }
  }, [segment, mode])

  // Real-time segment size calculation
  const calculateSegmentSize = useCallback(async () => {
    if (!formData.name || calculating) return
    
    setCalculating(true)
    try {
      const response = await fetch('/api/segments/calculate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ criteria: formData.criteria })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentSize(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to calculate segment size:', error)
    } finally {
      setCalculating(false)
    }
  }, [formData.criteria, calculating, headers])

  // Debounced size calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateSegmentSize()
    }, 1000)
    return () => clearTimeout(timer)
  }, [calculateSegmentSize])

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Segment name is required',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      const endpoint = mode === 'edit' 
        ? `/api/segments/${segment._id}`
        : '/api/segments/create'
      
      const method = mode === 'edit' ? 'PUT' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save segment')
      }

      toast({
        title: 'Success',
        description: `Segment ${mode === 'edit' ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 3000,
      })

      onSave()
      onClose()
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

  const addCustomTag = (tag) => {
    if (tag && !formData.criteria.customTags.includes(tag)) {
      setFormData({
        ...formData,
        criteria: {
          ...formData.criteria,
          customTags: [...formData.criteria.customTags, tag]
        }
      })
    }
  }

  const removeCustomTag = (tagToRemove) => {
    setFormData({
      ...formData,
      criteria: {
        ...formData.criteria,
        customTags: formData.criteria.customTags.filter(tag => tag !== tagToRemove)
      }
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Text>{mode === 'edit' ? 'Edit' : 'Create'} Advanced Segment</Text>
              <HStack spacing={2}>
                <Text fontSize="sm" color="gray.600">Current size:</Text>
                <Badge colorScheme="blue" variant="outline">
                  {calculating ? <Spinner size="xs" mr={1} /> : null}
                  {currentSize.toLocaleString()} users
                </Badge>
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Basic Info */}
            <Box>
              <Heading size="md" mb={4}>Basic Information</Heading>
              <VStack spacing={4} align="stretch">
                <HStack spacing={4}>
                  <FormControl isRequired flex={2}>
                    <FormLabel>Segment Name</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter segment name"
                    />
                  </FormControl>

                  <FormControl flex={1}>
                    <FormLabel>Color</FormLabel>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </FormControl>

                  <FormControl flex={1}>
                    <FormLabel>Status</FormLabel>
                    <Switch
                      isChecked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      colorScheme="green"
                    />
                    <FormHelperText>{formData.isActive ? 'Active' : 'Inactive'}</FormHelperText>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this segment"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </Box>

            <hr style={{border: 'none', borderTop: '1px solid #E2E8F0', margin: '16px 0'}} />

            {/* Segment Criteria */}
            <Box>
              <Heading size="md" mb={4}>Targeting Criteria</Heading>
              <Tabs variant="enclosed">
                <TabList>
                  <Tab>Geographic</Tab>
                  <Tab>Device & Browser</Tab>
                  <Tab>Behavior</Tab>
                  <Tab>Time-based</Tab>
                  <Tab>Advanced</Tab>
                </TabList>
                
                <TabPanels>
                  {/* Geographic Filters */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Alert status="info" size="sm">
                        <AlertIcon />
                        Target users based on their geographic location
                      </Alert>
                      
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel>Countries</FormLabel>
                          <select placeholder="select countries">
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="GB">United Kingdom</option>
                            <option value="DE">Germany</option>
                            <option value="FR">France</option>
                            <option value="JP">Japan</option>
                            <option value="AU">Australia</option>
                          </select>
                          <FormHelperText>select specific countries to target</FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Regions/States</FormLabel>
                          <Input
                            placeholder="e.g., California, New York"
                          />
                          <FormHelperText>Comma-separated list of regions</FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Cities</FormLabel>
                          <Input
                            placeholder="e.g., San Francisco, London"
                          />
                          <FormHelperText>Comma-separated list of cities</FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Timezone</FormLabel>
                          <select
                            value={formData.criteria.timezone}
                            onChange={(e) => setFormData({
                              ...formData,
                              criteria: { ...formData.criteria, timezone: e.target.value }
                            })}
                          >
                            <option value="">Any timezone</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="Europe/London">London</option>
                            <option value="Europe/Paris">Paris</option>
                            <option value="Asia/Tokyo">Tokyo</option>
                          </select>
                        </FormControl>
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>

                  {/* Device & Browser Filters */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Alert status="info" size="sm">
                        <AlertIcon />
                        Target users based on their device and browser characteristics
                      </Alert>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel>Device Types</FormLabel>
                          <CheckboxGroup>
                            <Stack direction="column" spacing={2}>
                              <Checkbox value="desktop">Desktop</Checkbox>
                              <Checkbox value="mobile">Mobile</Checkbox>
                              <Checkbox value="tablet">Tablet</Checkbox>
                            </Stack>
                          </CheckboxGroup>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Browsers</FormLabel>
                          <CheckboxGroup>
                            <Stack direction="column" spacing={2}>
                              <Checkbox value="chrome">Chrome</Checkbox>
                              <Checkbox value="firefox">Firefox</Checkbox>
                              <Checkbox value="safari">Safari</Checkbox>
                              <Checkbox value="edge">Edge</Checkbox>
                            </Stack>
                          </CheckboxGroup>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Operating Systems</FormLabel>
                          <CheckboxGroup>
                            <Stack direction="column" spacing={2}>
                              <Checkbox value="windows">Windows</Checkbox>
                              <Checkbox value="macos">macOS</Checkbox>
                              <Checkbox value="linux">Linux</Checkbox>
                              <Checkbox value="ios">iOS</Checkbox>
                              <Checkbox value="android">Android</Checkbox>
                            </Stack>
                          </CheckboxGroup>
                        </FormControl>
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>

                  {/* Behavioral Filters */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Alert status="info" size="sm">
                        <AlertIcon />
                        Target users based on their engagement and behavior patterns
                      </Alert>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <FormControl>
                          <FormLabel>Engagement Score</FormLabel>
                          <Box px={3}>
                            <input
                              defaultValue={[formData.criteria.engagementScore.min, formData.criteria.engagementScore.max]}
                              min={0}
                              max={100}
                              step={5}
                            >
                              <inputMark value={0} mt={2} ml={-2.5} fontSize="sm">
                                0%
                              </inputMark>
                              <inputMark value={50} mt={2} ml={-2.5} fontSize="sm">
                                50%
                              </inputMark>
                              <inputMark value={100} mt={2} ml={-2.5} fontSize="sm">
                                100%
                              </inputMark>
                              <inputTrack>
                                <inputFilledTrack />
                              </inputTrack>
                              <inputThumb />
                            </input>
                          </Box>
                          <FormHelperText>Users with engagement score between selected range</FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Last Seen</FormLabel>
                          <HStack>
                            <input
                              value={formData.criteria.lastSeen.value}
                              onChange={(val) => setFormData({
                                ...formData,
                                criteria: {
                                  ...formData.criteria,
                                  lastSeen: { ...formData.criteria.lastSeen, value: val }
                                }
                              })}
                              min={1}
                              max={365}
                            >
                              <inputField />
                              <inputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </inputStepper>
                            </input>
                            <select
                              value={formData.criteria.lastSeen.unit}
                              onChange={(e) => setFormData({
                                ...formData,
                                criteria: {
                                  ...formData.criteria,
                                  lastSeen: { ...formData.criteria.lastSeen, unit: e.target.value }
                                }
                              })}
                            >
                              <option value="days">Days</option>
                              <option value="weeks">Weeks</option>
                              <option value="months">Months</option>
                            </select>
                          </HStack>
                          <FormHelperText>Users active within the specified time</FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Notification Opens</FormLabel>
                          <HStack>
                            <input
                              value={formData.criteria.notificationOpens.min}
                              onChange={(val) => setFormData({
                                ...formData,
                                criteria: {
                                  ...formData.criteria,
                                  notificationOpens: { ...formData.criteria.notificationOpens, min: val }
                                }
                              })}
                              min={0}
                            >
                              <inputField placeholder="Min" />
                            </input>
                            <Text>to</Text>
                            <input
                              value={formData.criteria.notificationOpens.max}
                              onChange={(val) => setFormData({
                                ...formData,
                                criteria: {
                                  ...formData.criteria,
                                  notificationOpens: { ...formData.criteria.notificationOpens, max: val }
                                }
                              })}
                              min={0}
                            >
                              <inputField placeholder="Max" />
                            </input>
                          </HStack>
                          <FormHelperText>Total notification opens range</FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Notification Clicks</FormLabel>
                          <HStack>
                            <input
                              value={formData.criteria.notificationClicks.min}
                              onChange={(val) => setFormData({
                                ...formData,
                                criteria: {
                                  ...formData.criteria,
                                  notificationClicks: { ...formData.criteria.notificationClicks, min: val }
                                }
                              })}
                              min={0}
                            >
                              <inputField placeholder="Min" />
                            </input>
                            <Text>to</Text>
                            <input
                              value={formData.criteria.notificationClicks.max}
                              onChange={(val) => setFormData({
                                ...formData,
                                criteria: {
                                  ...formData.criteria,
                                  notificationClicks: { ...formData.criteria.notificationClicks, max: val }
                                }
                              })}
                              min={0}
                            >
                              <inputField placeholder="Max" />
                            </input>
                          </HStack>
                          <FormHelperText>Total notification clicks range</FormHelperText>
                        </FormControl>
                      </SimpleGrid>

                      <FormControl>
                        <FormLabel>Subscription Date Range</FormLabel>
                        <HStack>
                          <Input
                            type="date"
                            value={formData.criteria.subscriptionDate.start}
                            onChange={(e) => setFormData({
                              ...formData,
                              criteria: {
                                ...formData.criteria,
                                subscriptionDate: { ...formData.criteria.subscriptionDate, start: e.target.value }
                              }
                            })}
                          />
                          <Text>to</Text>
                          <Input
                            type="date"
                            value={formData.criteria.subscriptionDate.end}
                            onChange={(e) => setFormData({
                              ...formData,
                              criteria: {
                                ...formData.criteria,
                                subscriptionDate: { ...formData.criteria.subscriptionDate, end: e.target.value }
                              }
                            })}
                          />
                        </HStack>
                        <FormHelperText>Users who subscribed within this date range</FormHelperText>
                      </FormControl>
                    </VStack>
                  </TabPanel>

                  {/* Time-based Filters */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Alert status="info" size="sm">
                        <AlertIcon />
                        Target users based on time patterns and schedule preferences
                      </Alert>

                      <FormControl>
                        <FormLabel>Active Hours</FormLabel>
                        <HStack>
                          <select
                            value={formData.criteria.activeHours.start}
                            onChange={(e) => setFormData({
                              ...formData,
                              criteria: {
                                ...formData.criteria,
                                activeHours: { ...formData.criteria.activeHours, start: parseInt(e.target.value) }
                              }
                            })}
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                            ))}
                          </select>
                          <Text>to</Text>
                          <select
                            value={formData.criteria.activeHours.end}
                            onChange={(e) => setFormData({
                              ...formData,
                              criteria: {
                                ...formData.criteria,
                                activeHours: { ...formData.criteria.activeHours, end: parseInt(e.target.value) }
                              }
                            })}
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                            ))}
                          </select>
                        </HStack>
                        <FormHelperText>Users most active during these hours</FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Active Days</FormLabel>
                        <CheckboxGroup
                          value={formData.criteria.weekdays}
                          onChange={(values) => setFormData({
                            ...formData,
                            criteria: { ...formData.criteria, weekdays: values }
                          })}
                        >
                          <Stack direction="row" spacing={4} flexWrap="wrap">
                            <Checkbox value="monday">Monday</Checkbox>
                            <Checkbox value="tuesday">Tuesday</Checkbox>
                            <Checkbox value="wednesday">Wednesday</Checkbox>
                            <Checkbox value="thursday">Thursday</Checkbox>
                            <Checkbox value="friday">Friday</Checkbox>
                            <Checkbox value="saturday">Saturday</Checkbox>
                            <Checkbox value="sunday">Sunday</Checkbox>
                          </Stack>
                        </CheckboxGroup>
                        <FormHelperText>Users most active on these days</FormHelperText>
                      </FormControl>
                    </VStack>
                  </TabPanel>

                  {/* Advanced Filters */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Alert status="info" size="sm">
                        <AlertIcon />
                        Advanced targeting options and custom attributes
                      </Alert>

                      <FormControl>
                        <FormLabel>Custom Tags</FormLabel>
                        <VStack align="stretch" spacing={3}>
                          <HStack>
                            <Input
                              placeholder="Enter custom tag"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addCustomTag(e.target.value)
                                  e.target.value = ''
                                }
                              }}
                            />
                            <Button size="sm" colorScheme="blue">Add Tag</Button>
                          </HStack>
                          {formData.criteria.customTags.length > 0 && (
                            <HStack spacing={2} flexWrap="wrap">
                              {formData.criteria.customTags.map((tag, index) => (
                                <Tag key={index} size="md" colorScheme="blue" variant="solid">
                                  <TagLabel>{tag}</TagLabel>
                                  <TagCloseButton onClick={() => removeCustomTag(tag)} />
                                </Tag>
                              ))}
                            </HStack>
                          )}
                        </VStack>
                        <FormHelperText>Users with specific custom tags or attributes</FormHelperText>
                      </FormControl>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <HStack justify="space-between">
                            <FormLabel>A/B Test Participants</FormLabel>
                            <Switch
                              isChecked={formData.criteria.abTestParticipant}
                              onChange={(e) => setFormData({
                                ...formData,
                                criteria: { ...formData.criteria, abTestParticipant: e.target.checked }
                              })}
                              colorScheme="purple"
                            />
                          </HStack>
                          <FormHelperText>Users who have participated in A/B tests</FormHelperText>
                        </FormControl>

                        <FormControl>
                          <HStack justify="space-between">
                            <FormLabel>High Value Users</FormLabel>
                            <Switch
                              isChecked={formData.criteria.highValueUser}
                              onChange={(e) => setFormData({
                                ...formData,
                                criteria: { ...formData.criteria, highValueUser: e.target.checked }
                              })}
                              colorScheme="green"
                            />
                          </HStack>
                          <FormHelperText>Users marked as high-value or VIP</FormHelperText>
                        </FormControl>

                        <FormControl>
                          <HStack justify="space-between">
                            <FormLabel>Recently Active</FormLabel>
                            <Switch
                              isChecked={formData.criteria.recentlyActive}
                              onChange={(e) => setFormData({
                                ...formData,
                                criteria: { ...formData.criteria, recentlyActive: e.target.checked }
                              })}
                              colorScheme="blue"
                            />
                          </HStack>
                          <FormHelperText>Users active in the last 7 days</FormHelperText>
                        </FormControl>
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
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
              {mode === 'edit' ? 'Update Segment' : 'Create Segment'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default function AdvancedSegments() {
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSegment, setselectedSegment] = useState(null)
  const [segmentToDelete, setSegmentToDelete] = useState(null)

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()

  const headers = useAuthHeaders()
  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.800')

  const fetchSegments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/segments/list?enhanced=true', { headers })
      
      if (response.ok) {
        const data = await response.json()
        setSegments(data.segments || [])
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load segments',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSegments()
  }, [])

  const handleView = (segment) => {
    setselectedSegment(segment)
    onViewOpen()
  }

  const handleEdit = (segment) => {
    setselectedSegment(segment)
    onEditOpen()
  }

  const handleDelete = async () => {
    if (!segmentToDelete) return

    try {
      const response = await fetch(`/api/segments/${segmentToDelete._id}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete segment')
      }

      toast({
        title: 'Success',
        description: 'Segment deleted successfully',
        status: 'success',
        duration: 3000,
      })

      fetchSegments()
      onDeleteClose()
      setSegmentToDelete(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleDuplicate = async (segment) => {
    const duplicatedSegment = {
      ...segment,
      name: `${segment.name} (Copy)`,
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined
    }
    
    setselectedSegment(duplicatedSegment)
    onCreateOpen()
  }

  const stats = {
    total: segments.length,
    active: segments.filter(s => s.isActive).length,
    totalUsers: segments.reduce((sum, s) => sum + (s.subscriberCount || 0), 0),
    avgEngagement: segments.length > 0 
      ? Math.round(segments.reduce((sum, s) => sum + (s.engagementScore || 0), 0) / segments.length)
      : 0
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="lg">Advanced Segments</Heading>
          <Text color="gray.600" mt={1}>
            Create sophisticated user segments with behavioral and demographic targeting
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button leftIcon={<FiRefreshCw />} variant="outline" onClick={fetchSegments}>
            Refresh
          </Button>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
            Create Segment
          </Button>
        </HStack>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel>Total Segments</StatLabel>
              <StatNumber color="blue.500">{stats.total}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel>Active Segments</StatLabel>
              <StatNumber color="green.500">{stats.active}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel>Total Reach</StatLabel>
              <StatNumber color="purple.500">{stats.totalUsers.toLocaleString()}</StatNumber>
              <StatHelpText>users across all segments</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel>Avg. Engagement</StatLabel>
              <StatNumber color="orange.500">{stats.avgEngagement}%</StatNumber>
              <StatHelpText>across all segments</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Segments Grid */}
      {loading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : segments.length === 0 ? (
        <Card bg={cardBg} borderRadius="xl">
          <CardBody py={16}>
            <VStack spacing={4}>
              <Icon as={FiTarget} boxSize={16} color="gray.400" />
              <VStack spacing={2} textAlign="center">
                <Heading size="md" color="gray.600">No Segments Yet</Heading>
                <Text color="gray.500" maxW="md">
                  Create your first advanced segment to start targeting users with precision based on their behavior, location, and preferences
                </Text>
              </VStack>
              <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
                Create Your First Segment
              </Button>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {segments.map((segment) => (
            <SegmentCard
              key={segment._id}
              segment={segment}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={(segment) => {
                setSegmentToDelete(segment)
                onDeleteOpen()
              }}
              onDuplicate={handleDuplicate}
            />
          ))}
        </SimpleGrid>
      )}

      {/* Modals */}
      <SegmentBuilder
        segment={null}
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSave={fetchSegments}
        mode="create"
      />

      <SegmentBuilder
        segment={selectedSegment}
        isOpen={isEditOpen}
        onClose={() => {
          onEditClose()
          setselectedSegment(null)
        }}
        onSave={fetchSegments}
        mode="edit"
      />

      {/* Delete Confirmation */}
      {isDeleteOpen && (
        <div className="modal-overlay" onClick={onDeleteClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <Heading size="md" mb={4}>Delete Segment</Heading>
            <Text mb={6}>
              Are you sure you want to delete "{segmentToDelete?.name}"? This action cannot be undone.
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