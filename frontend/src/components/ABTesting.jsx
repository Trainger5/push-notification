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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  SimpleGrid
} from '@chakra-ui/react'
import { useToast } from '@chakra-ui/toast'
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
  FiPlay,
  FiStopCircleCircle,
  FiPlus,
  FiTrendingUp,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiMousePointer,
  FiUsers,
  FiTarget,
  FiBarChart2,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiAward
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
import { format, parseISO, differenceInDays } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const ABTestCard = ({ test, onView, onStart, onStop, onDelete }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'green'
      case 'completed': return 'blue'
      case 'paused': return 'orange'
      case 'draft': return 'gray'
      default: return 'gray'
    }
  }

  const winner = test.winnerVariant ? 
    test.variants.find(v => v.id === test.winnerVariant) : null

  return (
    <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
      <CardHeader>
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold" noOfLines={1}>
              {test.name}
            </Text>
            <Badge colorScheme={getStatusColor(test.status)} textTransform="capitalize">
              {test.status}
            </Badge>
          </HStack>
          {test.description && (
            <Text fontSize="sm" color="gray.600" noOfLines={2}>
              {test.description}
            </Text>
          )}
        </VStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          {/* Test Stats */}
          <SimpleGrid columns={3} spacing={4}>
            <VStack spacing={1}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">Variants</Text>
              <Text fontSize="lg" fontWeight="bold">{test.variants.length}</Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">Duration</Text>
              <Text fontSize="lg" fontWeight="bold">{test.testDuration}d</Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">Metric</Text>
              <Text fontSize="lg" fontWeight="bold" textTransform="capitalize">
                {test.successMetric.replace('_', ' ')}
              </Text>
            </VStack>
          </SimpleGrid>

          {/* Winner Info */}
          {winner && test.status === 'completed' && (
            <Alert status="success" borderRadius="md" size="sm">
              <AlertIcon boxSize={4} />
              <Text fontSize="sm">
                Winner: <strong>{winner.name}</strong>
                {test.statisticalSignificance > 0 && (
                  <> ({test.statisticalSignificance}% confidence)</>
                )}
              </Text>
            </Alert>
          )}

          {/* div for running tests */}
          {test.status === 'running' && test.startedAt && (
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color="gray.600">Test div</Text>
                <Text fontSize="sm" color="gray.600">
                  Day {Math.min(differenceInDays(new Date(), parseISO(test.startedAt)) + 1, test.testDuration)} of {test.testDuration}
                </Text>
              </HStack>
              <div 
                value={Math.min((differenceInDays(new Date(), parseISO(test.startedAt)) + 1) / test.testDuration * 100, 100)}
                colorScheme="blue"
                borderRadius="md"
              />
            </Box>
          )}

          {/* Actions */}
          <HStack spacing={2} justify="stretch">
            <Button size="sm" variant="outline" flex={1} onClick={() => onView(test)}>
              <Icon as={FiEye} mr={1} />
              View
            </Button>
            
            {test.status === 'draft' && (
              <>
                <Button size="sm" colorScheme="green" onClick={() => onStart(test)}>
                  <Icon as={FiPlay} mr={1} />
                  Start
                </Button>
                <Button size="sm" colorScheme="red" variant="outline" onClick={() => onDelete(test)}>
                  <Icon as={FiTrash2} />
                </Button>
              </>
            )}
            
            {test.status === 'running' && (
              <Button size="sm" colorScheme="orange" onClick={() => onStop(test)}>
                <Icon as={FiStopCircle} mr={1} />
                Stop
              </Button>
            )}
          </HStack>

          {/* Timestamps */}
          <VStack spacing={1} align="start" fontSize="xs" color="gray.500">
            <Text>Created: {format(parseISO(test.createdAt), 'MMM d, yyyy')}</Text>
            {test.startedAt && (
              <Text>Started: {format(parseISO(test.startedAt), 'MMM d, yyyy HH:mm')}</Text>
            )}
            {test.endedAt && (
              <Text>Ended: {format(parseISO(test.endedAt), 'MMM d, yyyy HH:mm')}</Text>
            )}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

const CreateABTestModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    testDuration: 7,
    successMetric: 'open_rate',
    targetSegment: 'all',
    variants: [
      { name: 'Control', title: '', body: '', url: '', traffic: 50 },
      { name: 'Variant A', title: '', body: '', url: '', traffic: 50 }
    ]
  })
  const [loading, setLoading] = useState(false)
  const [segments, setSegments] = useState([])

  const headers = useAuthHeaders()
  const toast = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchSegments()
    }
  }, [isOpen])

  const fetchSegments = async () => {
    try {
      const response = await fetch('/api/segments/list', { headers })
      if (response.ok) {
        const data = await response.json()
        setSegments(data.segments || [])
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.variants.every(v => v.title && v.body)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
      })
      return
    }

    const totalTraffic = formData.variants.reduce((sum, v) => sum + v.traffic, 0)
    if (Math.abs(totalTraffic - 100) > 0.01) {
      toast({
        title: 'Validation Error',
        description: 'Variant traffic must sum to 100%',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/abtests/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create A/B test')
      }

      toast({
        title: 'Success',
        description: 'A/B test created successfully',
        status: 'success',
        duration: 3000,
      })

      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        testDuration: 7,
        successMetric: 'open_rate',
        targetSegment: 'all',
        variants: [
          { name: 'Control', title: '', body: '', url: '', traffic: 50 },
          { name: 'Variant A', title: '', body: '', url: '', traffic: 50 }
        ]
      })
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

  const addVariant = () => {
    if (formData.variants.length >= 5) return
    const remainingTraffic = 100 - formData.variants.reduce((sum, v) => sum + v.traffic, 0)
    const newTraffic = Math.max(0, Math.min(remainingTraffic, 20))
    
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        { 
          name: `Variant ${String.fromCharCode(65 + formData.variants.length - 1)}`, 
          title: '', 
          body: '', 
          url: '', 
          traffic: newTraffic 
        }
      ]
    })
  }

  const removeVariant = (index) => {
    if (formData.variants.length <= 2) return
    const newVariants = formData.variants.filter((_, i) => i !== index)
    setFormData({ ...formData, variants: newVariants })
  }

  const updateVariant = (index, field, value) => {
    const newVariants = [...formData.variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setFormData({ ...formData, variants: newVariants })
  }

  const totalTraffic = formData.variants.reduce((sum, v) => sum + v.traffic, 0)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create A/B Test</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Basic Info */}
            <Box>
              <Heading size="md" mb={4}>Test Configuration</Heading>
              <VStack spacing={4} align="stretch">
                <div isRequired>
                  <label>Test Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter test name"
                  />
                </div>

                <div>
                  <label>Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the test purpose"
                    rows={3}
                  />
                </div>

                <HStack spacing={4}>
                  <div>
                    <label>Test Duration (days)</label>
                    <NumberInput 
                      value={formData.testDuration} 
                      onChange={(_, val) => setFormData({ ...formData, testDuration: val || 7 })}
                      min={1} 
                      max={30}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </div>

                  <div>
                    <label>Success Metric</label>
                    <select
                      value={formData.successMetric}
                      onChange={(e) => setFormData({ ...formData, successMetric: e.target.value })}
                    >
                      <option value="open_rate">Open Rate</option>
                      <option value="click_rate">Click Rate</option>
                      <option value="conversion_rate">Conversion Rate</option>
                    </select>
                  </div>

                  <div>
                    <label>Target Segment</label>
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
                  </div>
                </HStack>
              </VStack>
            </Box>

            <hr style={{border: 'none', borderTop: '1px solid #E2E8F0', margin: '16px 0'}} />

            {/* Variants */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Variants</Heading>
                <HStack>
                  <Text fontSize="sm" color={totalTraffic === 100 ? 'green.500' : 'red.500'}>
                    Traffic: {totalTraffic.toFixed(1)}%
                  </Text>
                  {formData.variants.length < 5 && (
                    <Button size="sm" leftIcon={<FiPlus />} onClick={addVariant}>
                      Add Variant
                    </Button>
                  )}
                </HStack>
              </HStack>

              <VStack spacing={4} align="stretch">
                {formData.variants.map((variant, index) => (
                  <Card key={index} borderWidth="1px">
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <HStack>
                            <Text fontWeight="bold">{variant.name}</Text>
                            {index === 0 && <Badge colorScheme="blue">Control</Badge>}
                          </HStack>
                          {formData.variants.length > 2 && index > 0 && (
                            <Button size="xs" colorScheme="red" variant="ghost" onClick={() => removeVariant(index)}>
                              <FiTrash2 />
                            </Button>
                          )}
                        </HStack>

                        <HStack spacing={4} align="start">
                          <div isRequired flex={1}>
                            <label fontSize="sm">Title</label>
                            <Input
                              size="sm"
                              value={variant.title}
                              onChange={(e) => updateVariant(index, 'title', e.target.value)}
                              placeholder="Notification title"
                            />
                          </div>

                          <div isRequired flex={2}>
                            <label fontSize="sm">Body</label>
                            <Textarea
                              size="sm"
                              value={variant.body}
                              onChange={(e) => updateVariant(index, 'body', e.target.value)}
                              placeholder="Notification message"
                              rows={2}
                            />
                          </div>

                          <div flex={1}>
                            <label fontSize="sm">URL</label>
                            <Input
                              size="sm"
                              value={variant.url}
                              onChange={(e) => updateVariant(index, 'url', e.target.value)}
                              placeholder="Landing page URL"
                              type="url"
                            />
                          </div>

                          <div width="100px">
                            <label fontSize="sm">Traffic %</label>
                            <NumberInput
                              size="sm"
                              value={variant.traffic}
                              onChange={(_, val) => updateVariant(index, 'traffic', val || 0)}
                              min={0}
                              max={100}
                              step={5}
                            >
                              <NumberInputField />
                            </NumberInput>
                          </div>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmit}
              isLoading={loading}
              loadingText="Creating..."
              isDisabled={totalTraffic !== 100}
            >
              Create A/B Test
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const ABTestDetailsModal = ({ test, isOpen, onClose }) => {
  if (!test) return null

  const winner = test.winnerVariant ? 
    test.variants.find(v => v.id === test.winnerVariant) : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Text>{test.name}</Text>
              <HStack>
                <Badge colorScheme={test.status === 'running' ? 'green' : test.status === 'completed' ? 'blue' : 'gray'}>
                  {test.status}
                </Badge>
                {winner && (
                  <Badge colorScheme="purple" leftIcon={<FiAward />}>
                    Winner: {winner.name}
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Test Overview */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Stat>
                <StatLabel>Variants</StatLabel>
                <StatNumber>{test.variants.length}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Duration</StatLabel>
                <StatNumber>{test.testDuration} days</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Success Metric</StatLabel>
                <StatNumber fontSize="lg" textTransform="capitalize">
                  {test.successMetric.replace('_', ' ')}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Confidence</StatLabel>
                <StatNumber>{test.statisticalSignificance || 0}%</StatNumber>
              </Stat>
            </SimpleGrid>

            <hr style={{border: 'none', borderTop: '1px solid #E2E8F0', margin: '16px 0'}} />

            {/* Variant Results */}
            <Box>
              <Heading size="md" mb={4}>Variant Performance</Heading>
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Variant</Th>
                      <Th isNumeric>Traffic %</Th>
                      <Th isNumeric>Sent</Th>
                      <Th isNumeric>Delivered</Th>
                      <Th isNumeric>Opens</Th>
                      <Th isNumeric>Open Rate</Th>
                      <Th isNumeric>Clicks</Th>
                      <Th isNumeric>Click Rate</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {test.variants.map((variant, index) => (
                      <Tr key={variant.id} bg={variant.id === test.winnerVariant ? 'green.50' : undefined}>
                        <Td>
                          <HStack>
                            <Text fontWeight={variant.isControl ? 'bold' : 'normal'}>
                              {variant.name}
                            </Text>
                            {variant.isControl && <Badge size="sm">Control</Badge>}
                            {variant.id === test.winnerVariant && <Icon as={FiAward} color="gold" />}
                          </HStack>
                        </Td>
                        <Td isNumeric>{variant.traffic}%</Td>
                        <Td isNumeric>{variant.sent || 0}</Td>
                        <Td isNumeric>{variant.delivered || 0}</Td>
                        <Td isNumeric>{variant.opens || 0}</Td>
                        <Td isNumeric>{variant.openRate || '0.00'}%</Td>
                        <Td isNumeric>{variant.clicks || 0}</Td>
                        <Td isNumeric>{variant.clickRate || '0.00'}%</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            {/* Variant Content Preview */}
            <Box>
              <Heading size="md" mb={4}>Variant Content</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {test.variants.map((variant) => (
                  <Card key={variant.id} borderWidth="1px">
                    <CardHeader>
                      <HStack>
                        <Text fontWeight="bold">{variant.name}</Text>
                        {variant.isControl && <Badge colorScheme="blue">Control</Badge>}
                        {variant.id === test.winnerVariant && <Badge colorScheme="green">Winner</Badge>}
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack align="stretch" spacing={3}>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.600">Title</Text>
                          <Text>{variant.title}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.600">Body</Text>
                          <Text>{variant.body}</Text>
                        </Box>
                        {variant.url && (
                          <Box>
                            <Text fontSize="sm" fontWeight="medium" color="gray.600">URL</Text>
                            <Text fontSize="sm" color="blue.500" textDecoration="underline">
                              {variant.url}
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default function ABTesting() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTest, setselectedTest] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [testToDelete, setTestToDelete] = useState(null)

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()

  const headers = useAuthHeaders()
  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.800')

  const fetchTests = async () => {
    try {
      setLoading(true)
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const response = await fetch(`/api/abtests/list${query}`, { headers })
      
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests)
      }
    } catch (error) {
      console.error('Failed to fetch A/B tests:', error)
      toast({
        title: 'Error',
        description: 'Failed to load A/B tests',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTests()
  }, [statusFilter])

  const handleStartTest = async (test) => {
    try {
      const response = await fetch(`/api/abtests/${test._id}/start`, {
        method: 'POST',
        headers
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start test')
      }

      const data = await response.json()
      toast({
        title: 'Success',
        description: 'A/B test started successfully',
        status: 'success',
        duration: 5000,
      })

      fetchTests()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleStopTest = async (test) => {
    try {
      const response = await fetch(`/api/abtests/${test._id}/stop`, {
        method: 'POST',
        headers
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to stop test')
      }

      const data = await response.json()
      toast({
        title: 'Test Completed',
        description: `Winner: ${data.winner.variantName} (${data.winner.confidence}% confidence)`,
        status: 'success',
        duration: 8000,
      })

      fetchTests()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleViewTest = async (test) => {
    try {
      const response = await fetch(`/api/abtests/${test._id}`, { headers })
      if (response.ok) {
        const detailedTest = await response.json()
        setselectedTest(detailedTest)
        onDetailsOpen()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load test details',
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleDeleteTest = async () => {
    if (!testToDelete) return

    try {
      const response = await fetch(`/api/abtests/${testToDelete._id}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete test')
      }

      toast({
        title: 'Success',
        description: 'A/B test deleted successfully',
        status: 'success',
        duration: 3000,
      })

      fetchTests()
      onDeleteClose()
      setTestToDelete(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const filteredTests = tests.filter(test => 
    statusFilter === 'all' || test.status === statusFilter
  )

  const stats = {
    total: tests.length,
    running: tests.filter(t => t.status === 'running').length,
    completed: tests.filter(t => t.status === 'completed').length,
    draft: tests.filter(t => t.status === 'draft').length
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="lg">A/B Testing</Heading>
          <Text color="gray.600" mt={1}>
            Create and manage A/B tests to optimize your notifications
          </Text>
        </Box>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
          Create A/B Test
        </Button>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel>Total Tests</StatLabel>
              <StatNumber color="blue.500">{stats.total}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel>Running</StatLabel>
              <StatNumber color="green.500">{stats.running}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel>Completed</StatLabel>
              <StatNumber color="blue.500">{stats.completed}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Stat>
              <StatLabel>Drafts</StatLabel>
              <StatNumber color="gray.500">{stats.draft}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filters */}
      <HStack spacing={4}>
        <Text fontSize="sm" color="gray.600">Filter:</Text>
        <select w="200px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Tests</option>
          <option value="draft">Draft</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>
      </HStack>

      {/* Tests Grid */}
      {loading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : filteredTests.length === 0 ? (
        <Card bg={cardBg} borderRadius="xl">
          <CardBody py={16}>
            <VStack spacing={4}>
              <Icon as={FiBarChart2} boxSize={16} color="gray.400" />
              <VStack spacing={2} textAlign="center">
                <Heading size="md" color="gray.600">
                  {statusFilter === 'all' ? 'No A/B Tests Yet' : `No ${statusFilter} tests`}
                </Heading>
                <Text color="gray.500" maxW="md">
                  Create your first A/B test to start optimizing your push notification performance
                </Text>
              </VStack>
              {statusFilter === 'all' && (
                <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
                  Create Your First A/B Test
                </Button>
              )}
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredTests.map((test) => (
            <ABTestCard
              key={test._id}
              test={test}
              onView={handleViewTest}
              onStart={handleStartTest}
              onStop={handleStopTest}
              onDelete={(test) => {
                setTestToDelete(test)
                onDeleteOpen()
              }}
            />
          ))}
        </SimpleGrid>
      )}

      {/* Modals */}
      <CreateABTestModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={fetchTests}
      />

      <ABTestDetailsModal
        test={selectedTest}
        isOpen={isDetailsOpen}
        onClose={() => {
          onDetailsClose()
          setselectedTest(null)
        }}
      />

      {/* Delete Confirmation */}
      {isDeleteOpen && (
        <div className="modal-overlay" onClick={onDeleteClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <Heading size="md" mb={4}>Delete A/B Test</Heading>
            <Text mb={6}>
              Are you sure you want to delete "{testToDelete?.name}"? This action cannot be undone.
            </Text>
            <HStack justify="flex-end">
              <Button onClick={onDeleteClose}>Cancel</Button>
              <Button colorScheme="red" ml={3} onClick={handleDeleteTest}>
                Delete
              </Button>
            </HStack>
          </div>
        </div>
      )}
    </VStack>
  )
}