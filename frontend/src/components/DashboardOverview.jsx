import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Flex,
  Icon,
  SimpleGrid,
  Spinner,
  Progress,
  Avatar,
  AvatarGroup
} from '@chakra-ui/react'
import { Card, CardBody, CardHeader } from '@chakra-ui/card'
import { useToast } from '@chakra-ui/toast'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { Tooltip } from '@chakra-ui/tooltip'
import {
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/stat'
import {
  FiTrendingUp,
  FiUsers,
  FiBell,
  FiEye,
  FiMousePointer,
  FiGlobe,
  FiActivity,
  FiSend,
  FiPlus,
  FiArrowRight,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiTarget
} from 'react-icons/fi'
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
import { format, parseISO, subDays } from 'date-fns'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const MetricCard = ({ title, value, subtitle, icon, color = 'blue', trend, isLoading, onClick }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  
  return (
    <Card 
      bg={cardBg} 
      borderRadius="xl" 
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md', bg: onClick ? hoverBg : cardBg }}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
    >
      <CardBody>
        <Flex justify="space-between" align="start">
          <Box>
            <Text fontSize="sm" color="gray.500" fontWeight="medium" mb="1">
              {title}
            </Text>
            {isLoading ? (
              <Spinner size="sm" />
            ) : (
              <Text fontSize="3xl" fontWeight="bold" color={`${color}.500`} mb="1">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </Text>
            )}
            {subtitle && (
              <Text fontSize="sm" color="gray.600">{subtitle}</Text>
            )}
            {trend && (
              <HStack spacing={1} mt={2}>
                <Text fontSize="sm" color={trend.direction === 'increase' ? 'green.500' : 'red.500'}>
                  {trend.direction === 'increase' ? '↗' : '↘'} {trend.value}% vs last period
                </Text>
              </HStack>
            )}
          </Box>
          <Box p="3" bg={`${color}.50`} borderRadius="lg">
            <Icon as={icon} boxSize={6} color={`${color}.500`} />
          </Box>
        </Flex>
      </CardBody>
    </Card>
  )
}

const QuickActionCard = ({ title, description, icon, color = 'blue', onClick, badge }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  
  return (
    <Card 
      bg={cardBg} 
      borderRadius="xl" 
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md', bg: hoverBg }}
      cursor="pointer"
      onClick={onClick}
      position="relative"
    >
      {badge && (
        <Badge 
          position="absolute" 
          top={3} 
          right={3} 
          colorScheme={color} 
          variant="solid"
          borderRadius="full"
        >
          {badge}
        </Badge>
      )}
      <CardBody>
        <VStack spacing={4}>
          <Box p="4" bg={`${color}.50`} borderRadius="xl">
            <Icon as={icon} boxSize={8} color={`${color}.500`} />
          </Box>
          <VStack spacing={1} textAlign="center">
            <Text fontWeight="semibold" fontSize="lg">{title}</Text>
            <Text fontSize="sm" color="gray.600" noOfLines={2}>
              {description}
            </Text>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

const COLORS = ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5', '#00B5D8']

export default function DashboardOverview({ setCurrentTab }) {
  const [analytics, setAnalytics] = useState(null)
  const [timeseries, setTimeseries] = useState([])
  const [templates, setTemplates] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  const headers = useAuthHeaders()
  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.800')

  const getApiUrl = (endpoint) => {
    const apiBase = 'http://localhost:4000'
    return `${apiBase}${endpoint}`
  }

  const fetchWithRateLimit = async (url, delay = 0, retryCount = 0) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    const fullUrl = getApiUrl(url)
    const response = await fetch(fullUrl, { headers })
    if (response.status === 429 && retryCount < 2) {
      // Rate limited, wait and retry (max 2 retries)
      console.warn(`Rate limited for ${url}, retrying... (attempt ${retryCount + 1}/2)`)
      await new Promise(resolve => setTimeout(resolve, 3000))
      return fetchWithRateLimit(url, 0, retryCount + 1)
    }
    return response
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch user data first (most important)
      const userRes = await fetchWithRateLimit('/api/customer/me')
      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData)
      }

      // Fetch other data with delays to avoid rate limiting
      const analyticsRes = await fetchWithRateLimit('/api/metrics/analytics/overview', 200)
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData)
      }

      const timeseriesRes = await fetchWithRateLimit('/api/metrics/analytics/timeseries?days=7', 400)
      if (timeseriesRes.ok) {
        const timeseriesData = await timeseriesRes.json()
        setTimeseries(timeseriesData)
      }

      const templatesRes = await fetchWithRateLimit('/api/templates/list?active=true', 600)
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData.templates || [])
      }

      const activityRes = await fetchWithRateLimit('/api/metrics/analytics/activity?limit=5', 800)
      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setRecentActivity(activityData.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never'
    return format(parseISO(dateStr), 'MMM d, HH:mm')
  }

  const quickActions = [
    {
      title: 'Send Notification',
      description: 'Send push notifications to your subscribers',
      icon: FiSend,
      color: 'blue',
      onClick: () => setCurrentTab('send')
    },
    {
      title: 'Create Template',
      description: 'Build reusable notification templates',
      icon: FiFileText,
      color: 'purple',
      onClick: () => setCurrentTab('templates'),
      badge: templates.length
    },
    {
      title: 'View Analytics',
      description: 'Monitor your notification performance',
      icon: FiActivity,
      color: 'green',
      onClick: () => setCurrentTab('analytics')
    },
    {
      title: 'Manage Subscribers',
      description: 'View and organize your audience',
      icon: FiUsers,
      color: 'orange',
      onClick: () => setCurrentTab('subscribers'),
      badge: analytics?.subscribers?.total
    }
  ]

  return (
    <VStack spacing={8} align="stretch">
      {/* Welcome Header */}
      <Box>
        <Heading size="xl" mb={2}>
          Welcome back, {user?.customer?.name || 'User'}! 👋
        </Heading>
        <Text color="gray.600" fontSize="lg">
          Here's what's happening with your push notifications today.
        </Text>
      </Box>

      {/* Key Metrics */}
      <Box>
        <Heading size="lg" mb={6}>Key Metrics</Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <MetricCard
            title="Total Subscribers"
            value={analytics?.subscribers?.total || 0}
            subtitle={`+${analytics?.subscribers?.new7d || 0} this week`}
            icon={FiUsers}
            color="blue"
            isLoading={loading}
            onClick={() => setCurrentTab('subscribers')}
            trend={{
              direction: 'increase',
              value: Math.round(((analytics?.subscribers?.new7d || 0) / (analytics?.subscribers?.total || 1)) * 100)
            }}
          />
          <MetricCard
            title="Notifications Sent"
            value={analytics?.notifications?.total || 0}
            subtitle={`${analytics?.notifications?.sent7d || 0} this week`}
            icon={FiBell}
            color="green"
            isLoading={loading}
          />
          <MetricCard
            title="Open Rate"
            value={analytics?.engagement?.openRate ? `${analytics.engagement.openRate}%` : '0%'}
            subtitle={`${analytics?.engagement?.opens7d || 0} opens this week`}
            icon={FiEye}
            color="purple"
            isLoading={loading}
            onClick={() => setCurrentTab('analytics')}
          />
          <MetricCard
            title="Click Rate"
            value={analytics?.engagement?.clickRate ? `${analytics.engagement.clickRate}%` : '0%'}
            subtitle={`${analytics?.engagement?.clicks7d || 0} clicks this week`}
            icon={FiMousePointer}
            color="orange"
            isLoading={loading}
            onClick={() => setCurrentTab('analytics')}
          />
        </SimpleGrid>
      </Box>

      {/* Quick Actions */}
      <Box>
        <Heading size="lg" mb={6}>Quick Actions</Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              color={action.color}
              onClick={action.onClick}
              badge={action.badge}
            />
          ))}
        </SimpleGrid>
      </Box>

      {/* Charts Section */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
        {/* Performance Chart */}
        <Card bg={cardBg} borderRadius="xl" boxShadow="sm">
          <CardHeader>
            <HStack justify="space-between">
              <Box>
                <Heading size="md">Performance Trends</Heading>
                <Text color="gray.600" fontSize="sm">Last 7 days</Text>
              </Box>
              <Button 
                size="sm" 
                variant="ghost" 
                rightIcon={<FiArrowRight />}
                onClick={() => setCurrentTab('analytics')}
              >
                View Details
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Flex justify="center" align="center" h="300px">
                <Spinner size="lg" />
              </Flex>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeseries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(parseISO(value), 'MMM d')} 
                  />
                  <YAxis />
                  <RechartsTooltip 
                    labelFormatter={(value) => format(parseISO(value), 'MMM d, yyyy')} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="notifications" 
                    stroke="#3182CE" 
                    strokeWidth={3}
                    name="Sent"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="opens" 
                    stroke="#38A169" 
                    strokeWidth={2}
                    name="Opens"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#D69E2E" 
                    strokeWidth={2}
                    name="Clicks"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card bg={cardBg} borderRadius="xl" boxShadow="sm">
          <CardHeader>
            <HStack justify="space-between">
              <Box>
                <Heading size="md">Recent Activity</Heading>
                <Text color="gray.600" fontSize="sm">Latest notifications</Text>
              </Box>
              <Button 
                size="sm" 
                variant="ghost" 
                rightIcon={<FiArrowRight />}
                onClick={() => setCurrentTab('analytics')}
              >
                View All
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner />
              </Flex>
            ) : recentActivity.length === 0 ? (
              <VStack spacing={4} py={8}>
                <Icon as={FiBell} boxSize={10} color="gray.400" />
                <Text color="gray.500" textAlign="center">
                  No recent activity
                </Text>
                <Button 
                  size="sm" 
                  colorScheme="blue" 
                  leftIcon={<FiPlus />}
                  onClick={() => setCurrentTab('send')}
                >
                  Send First Notification
                </Button>
              </VStack>
            ) : (
              <VStack spacing={4} align="stretch">
                {recentActivity.slice(0, 5).map((activity, index) => (
                  <HStack key={index} spacing={3} p={3} bg="gray.50" borderRadius="md">
                    <Box p={2} bg="blue.100" borderRadius="md">
                      <Icon as={FiBell} color="blue.500" />
                    </Box>
                    <Box flex={1}>
                      <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                        {activity.title}
                      </Text>
                      <HStack spacing={2} mt={1}>
                        <HStack spacing={1}>
                          <Icon as={FiCheckCircle} boxSize={3} color="green.500" />
                          <Text fontSize="xs" color="green.600">{activity.success || 0}</Text>
                        </HStack>
                        {activity.failed > 0 && (
                          <HStack spacing={1}>
                            <Icon as={FiAlertCircle} boxSize={3} color="red.500" />
                            <Text fontSize="xs" color="red.600">{activity.failed}</Text>
                          </HStack>
                        )}
                        <Text fontSize="xs" color="gray.500">
                          {formatDate(activity.createdAt)}
                        </Text>
                      </HStack>
                    </Box>
                  </HStack>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>
      </Grid>

      {/* Account Overview */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={6}>
        <Card bg={cardBg} borderRadius="xl" boxShadow="sm">
          <CardBody>
            <VStack spacing={4} align="start">
              <HStack spacing={3}>
                <div style={{width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#3182CE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'}}>
                  {user?.customer?.name?.charAt(0) || "U"}
                </div>
                <Box>
                  <Text fontWeight="bold" fontSize="lg">
                    {user?.customer?.name}
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    {user?.customer?.email}
                  </Text>
                  <HStack spacing={2} mt={1}>
                    <Badge colorScheme="blue">
                      {user?.customer?.plan || 'Free'}
                    </Badge>
                    <Badge colorScheme="green">
                      {user?.customer?.country || 'Unknown'}
                    </Badge>
                  </HStack>
                </Box>
              </HStack>
              <Button 
                size="sm" 
                variant="outline" 
                w="full"
                onClick={() => setCurrentTab('settings')}
              >
                Manage Account
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="xl" boxShadow="sm">
          <CardBody>
            <VStack spacing={4} align="start">
              <HStack justify="space-between" w="full">
                <Text fontWeight="medium">Templates</Text>
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {templates.length}
                </Text>
              </HStack>
              <div style={{width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px'}}>
                <div style={{width: `${Math.min((templates.length / 10) * 100, 100)}%`, height: '100%', backgroundColor: '#805AD5', borderRadius: '4px'}}></div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                w="full"
                leftIcon={<FiPlus />}
                onClick={() => setCurrentTab('templates')}
              >
                Create Template
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="xl" boxShadow="sm">
          <CardBody>
            <VStack spacing={4} align="start">
              <HStack justify="space-between" w="full">
                <Text fontWeight="medium">Delivery Rate</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {analytics?.delivery?.rate || 0}%
                </Text>
              </HStack>
              <div style={{width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px'}}>
                <div style={{width: `${analytics?.delivery?.rate || 0}%`, height: '100%', backgroundColor: '#38A169', borderRadius: '4px'}}></div>
              </div>
              <HStack justify="space-between" w="full" fontSize="sm" color="gray.600">
                <Text>Sent: {analytics?.delivery?.sent?.toLocaleString() || 0}</Text>
                <Text>Failed: {analytics?.delivery?.failed?.toLocaleString() || 0}</Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </Grid>
    </VStack>
  )
}