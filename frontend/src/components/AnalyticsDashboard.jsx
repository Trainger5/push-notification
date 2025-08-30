import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Icon,
  Flex,
  Spinner
} from '@chakra-ui/react'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { Card, CardBody, CardHeader } from '@chakra-ui/card'
import { Alert } from '@chakra-ui/alert'
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/stat'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { FiTrendingUp, FiUsers, FiBell, FiMail, FiEye, FiMousePointer, FiMonitor, FiSmartphone, FiGlobe, FiMapPin, FiTablet, FiBarChart } from 'react-icons/fi'
import { format, parseISO } from 'date-fns'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const MetricCard = ({ title, value, subtitle, icon, color = 'blue', trend, isLoading }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  
  return (
    <Card bg={cardBg} borderRadius="xl" boxShadow="md">
      <CardBody>
        <Flex justify="space-between" align="start" mb={2}>
          <Box>
            <Text fontSize="sm" color="gray.500" fontWeight="medium">{title}</Text>
            {isLoading ? (
              <Spinner size="sm" mt={2} />
            ) : (
              <Text fontSize="2xl" fontWeight="bold" color={`${color}.500`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </Text>
            )}
            {subtitle && (
              <Text fontSize="sm" color="gray.600" mt={1}>{subtitle}</Text>
            )}
          </Box>
          <Icon as={icon} boxSize={6} color={`${color}.400`} />
        </Flex>
        {trend && (
          <HStack spacing={2} mt={2}>
            {trend.direction === 'increase' ? (
              <Box color="green.500">↗</Box>
            ) : (
              <Box color="red.500">↙</Box>
            )}
            <Text fontSize="sm" color={trend.direction === 'increase' ? 'green.500' : 'red.500'}>
              {trend.value}% vs last period
            </Text>
          </HStack>
        )}
      </CardBody>
    </Card>
  )
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [timeseries, setTimeseries] = useState([])
  const [demographics, setDemographics] = useState(null)
  const [activity, setActivity] = useState(null)
  const [timeRange, setTimeRange] = useState('30')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const headers = useAuthHeaders()
  const cardBg = useColorModeValue('white', 'gray.800')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const getApiUrl = (endpoint) => 'http://localhost:4000' + endpoint
      
      const [overviewRes, timeseriesRes, demographicsRes, activityRes] = await Promise.all([
        fetch(getApiUrl('/api/metrics/analytics/overview'), { headers }),
        fetch(getApiUrl(`/api/metrics/analytics/timeseries?days=${timeRange}`), { headers }),
        fetch(getApiUrl('/api/metrics/analytics/demographics'), { headers }),
        fetch(getApiUrl('/api/metrics/analytics/activity?limit=10'), { headers })
      ])

      if (!overviewRes.ok) throw new Error('Failed to fetch analytics')

      const [overviewData, timeseriesData, demographicsData, activityData] = await Promise.all([
        overviewRes.json(),
        timeseriesRes.json(),
        demographicsRes.json(),
        activityRes.json()
      ])

      setAnalytics(overviewData)
      setTimeseries(timeseriesData)
      setDemographics(demographicsData)
      setActivity(activityData)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loading) {
      fetchAnalytics()
    }
  }, [timeRange])

  const formatDate = (dateStr) => {
    return format(parseISO(dateStr), 'MMM d')
  }

  const formatDateTime = (dateStr) => {
    return format(parseISO(dateStr), 'MMM d, HH:mm')
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        Error loading analytics: {error}
      </Alert>
    )
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* Professional Header */}
      <Box 
        bgGradient="linear(to-r, green.500, teal.600)"
        borderRadius="2xl"
        p={8}
        color="white"
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" top={0} right={0} opacity={0.1}>
          <Icon as={FiTrendingUp} boxSize="120px" />
        </Box>
        <Flex justify="space-between" align="center" position="relative" zIndex={1}>
          <HStack spacing={4}>
            <Box p={3} bg="whiteAlpha.200" borderRadius="xl">
              <Icon as={FiBarChart} boxSize={8} />
            </Box>
            <VStack align="start" spacing={1}>
              <Heading size="xl" color="white">Analytics Dashboard</Heading>
              <Text opacity={0.9} fontSize="lg">
                Monitor performance and engagement metrics
              </Text>
            </VStack>
          </HStack>
          <Box bg="whiteAlpha.200" borderRadius="xl" p={4}>
            <Text fontSize="sm" opacity={0.8} mb={2}>Time Period</Text>
            <select 
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.3)', 
                border: 'none', 
                color: 'white', 
                padding: '8px 12px', 
                borderRadius: '8px', 
                width: '100%'
              }}
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7" style={{color: 'black'}}>Last 7 days</option>
              <option value="30" style={{color: 'black'}}>Last 30 days</option>
              <option value="90" style={{color: 'black'}}>Last 90 days</option>
            </select>
          </Box>
        </Flex>
      </Box>

      {/* Overview Cards */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
        <MetricCard
          title="Total Subscribers"
          value={analytics?.subscribers.total}
          subtitle={`+${analytics?.subscribers.new7d || 0} this week`}
          icon={FiUsers}
          color="blue"
          isLoading={loading}
        />
        <MetricCard
          title="Notifications Sent"
          value={analytics?.notifications.total}
          subtitle={`${analytics?.notifications.sent7d || 0} this week`}
          icon={FiBell}
          color="green"
          isLoading={loading}
        />
        <MetricCard
          title="Open Rate"
          value={analytics?.engagement.openRate ? `${analytics.engagement.openRate}%` : '0%'}
          subtitle={`${analytics?.engagement.opens7d || 0} opens this week`}
          icon={FiEye}
          color="purple"
          isLoading={loading}
        />
        <MetricCard
          title="Click Rate"
          value={analytics?.engagement.clickRate ? `${analytics.engagement.clickRate}%` : '0%'}
          subtitle={`${analytics?.engagement.clicks7d || 0} clicks this week`}
          icon={FiMousePointer}
          color="orange"
          isLoading={loading}
        />
      </Grid>

      {/* Charts Section */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* Time Series Chart */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Heading size="md">Performance Over Time</Heading>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Flex justify="center" align="center" h="300px">
                <Spinner size="lg" />
              </Flex>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeseries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => format(parseISO(value), 'MMM d, yyyy')} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="notifications" 
                    stackId="1"
                    stroke="#3182CE" 
                    fill="#3182CE" 
                    fillOpacity={0.6}
                    name="Notifications"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="opens" 
                    stackId="2"
                    stroke="#38A169" 
                    fill="#38A169" 
                    fillOpacity={0.6}
                    name="Opens"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="clicks" 
                    stackId="3"
                    stroke="#D69E2E" 
                    fill="#D69E2E" 
                    fillOpacity={0.6}
                    name="Clicks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Demographics */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Heading size="md">Subscriber Demographics</Heading>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Flex justify="center" align="center" h="300px">
                <Spinner size="lg" />
              </Flex>
            ) : (
              <Tabs variant="enclosed" size="sm">
                <TabList>
                  <Tab>Devices</Tab>
                  <Tab>Browsers</Tab>
                  <Tab>Locations</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel p={0} pt={4}>
                    <VStack spacing={4}>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={demographics?.devices || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {demographics?.devices?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                      <HStack spacing={4} justify="center">
                        {demographics?.devices?.map((device, i) => (
                          <HStack key={i} spacing={1}>
                            <Icon as={
                              device.name === 'Mobile' ? FiSmartphone : 
                              device.name === 'Tablet' ? FiTablet : 
                              FiMonitor
                            } color={COLORS[i % COLORS.length]} />
                            <Text fontSize="xs">{device.value}</Text>
                          </HStack>
                        ))}
                      </HStack>
                    </VStack>
                  </TabPanel>
                  <TabPanel p={0} pt={4}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={demographics?.browsers || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {demographics?.browsers?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </TabPanel>
                  <TabPanel p={0} pt={4}>
                    <VStack spacing={2} align="stretch">
                      {demographics?.countries?.slice(0, 5).map((country, i) => (
                        <HStack key={i} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                          <HStack>
                            <Icon as={FiMapPin} color={COLORS[i % COLORS.length]} />
                            <Text fontSize="sm" fontWeight="medium">{country.name}</Text>
                          </HStack>
                          <Badge colorScheme="blue">{country.value}</Badge>
                        </HStack>
                      ))}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </CardBody>
        </Card>
      </Grid>

      {/* Detailed Stats */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={6}>
        {/* Delivery Stats */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Heading size="md">Delivery Performance</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Flex justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">Delivery Rate</Text>
                  <Text fontSize="sm" fontWeight="bold">{analytics?.delivery.rate || 0}%</Text>
                </Flex>
                <div style={{width: '100%', height: '12px', backgroundColor: '#E2E8F0', borderRadius: '6px'}}>
                  <div style={{width: `${analytics?.delivery.rate || 0}%`, height: '100%', backgroundColor: '#38A169', borderRadius: '6px'}}></div>
                </div>
              </Box>
              <Box borderTop="1px" borderColor="gray.200" />
              <HStack justify="space-between">
                <VStack spacing={1} align="start">
                  <Text fontSize="sm" color="gray.500">Delivered</Text>
                  <Text fontSize="lg" fontWeight="bold" color="green.500">
                    {analytics?.delivery.sent?.toLocaleString() || 0}
                  </Text>
                </VStack>
                <VStack spacing={1} align="end">
                  <Text fontSize="sm" color="gray.500">Failed</Text>
                  <Text fontSize="lg" fontWeight="bold" color="red.500">
                    {analytics?.delivery.failed?.toLocaleString() || 0}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Engagement Stats */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Heading size="md">Engagement Metrics</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Flex justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">Open Rate</Text>
                  <Text fontSize="sm" fontWeight="bold">{analytics?.engagement.openRate || 0}%</Text>
                </Flex>
                <div style={{width: '100%', height: '12px', backgroundColor: '#E2E8F0', borderRadius: '6px'}}>
                  <div style={{width: `${analytics?.engagement.openRate || 0}%`, height: '100%', backgroundColor: '#3182CE', borderRadius: '6px'}}></div>
                </div>
              </Box>
              <Box>
                <Flex justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">Click Rate</Text>
                  <Text fontSize="sm" fontWeight="bold">{analytics?.engagement.clickRate || 0}%</Text>
                </Flex>
                <div style={{width: '100%', height: '12px', backgroundColor: '#E2E8F0', borderRadius: '6px'}}>
                  <div style={{width: `${analytics?.engagement.clickRate || 0}%`, height: '100%', backgroundColor: '#3182CE', borderRadius: '6px'}}></div>
                </div>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Growth Stats */}
        <Card bg={cardBg} borderRadius="xl">
          <CardHeader>
            <Heading size="md">Subscriber Growth</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <VStack spacing={1} align="start">
                  <Text fontSize="sm" color="gray.500">This Week</Text>
                  <Text fontSize="lg" fontWeight="bold" color="blue.500">
                    +{analytics?.subscribers.new7d?.toLocaleString() || 0}
                  </Text>
                </VStack>
                <VStack spacing={1} align="end">
                  <Text fontSize="sm" color="gray.500">This Month</Text>
                  <Text fontSize="lg" fontWeight="bold" color="green.500">
                    +{analytics?.subscribers.new30d?.toLocaleString() || 0}
                  </Text>
                </VStack>
              </HStack>
              <Box borderTop="1px" borderColor="gray.200" />
              <Box textAlign="center">
                <Text fontSize="sm" color="gray.500">Total Subscribers</Text>
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {analytics?.subscribers.total?.toLocaleString() || 0}
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Card bg={cardBg} borderRadius="xl">
        <CardHeader>
          <Heading size="md">Recent Activity</Heading>
        </CardHeader>
        <CardBody>
          <Tabs variant="enclosed">
            <TabList>
              <Tab>Recent Notifications</Tab>
              <Tab>New Subscribers</Tab>
              <Tab>Engagement Events</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Title</Th>
                        <Th>Sent</Th>
                        <Th>Failed</Th>
                        <Th>Date</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {activity?.notifications?.slice(0, 5).map((notif, index) => (
                        <Tr key={index}>
                          <Td fontWeight="medium">{notif.title}</Td>
                          <Td color="green.500">{notif.success || 0}</Td>
                          <Td color="red.500">{notif.failed || 0}</Td>
                          <Td color="gray.500">{formatDateTime(notif.createdAt)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>
              <TabPanel>
                <VStack spacing={3} align="stretch">
                  {activity?.subscriptions?.slice(0, 5).map((sub, index) => (
                    <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                      <Text fontSize="sm">{sub.userAgent?.split(' ')[0] || 'Unknown Browser'}</Text>
                      <Text fontSize="xs" color="gray.500">{formatDateTime(sub.createdAt)}</Text>
                    </HStack>
                  ))}
                </VStack>
              </TabPanel>
              <TabPanel>
                <VStack spacing={3} align="stretch">
                  {activity?.engagement?.slice(0, 10).map((event, index) => (
                    <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                      <HStack>
                        <Icon as={event.type === 'open' ? FiEye : FiMousePointer} 
                              color={event.type === 'open' ? 'blue.500' : 'purple.500'} />
                        <Text fontSize="sm" textTransform="capitalize">{event.type}</Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">{formatDateTime(event.at)}</Text>
                    </HStack>
                  ))}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </VStack>
  )
}