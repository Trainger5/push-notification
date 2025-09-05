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
  Flex,
  Icon
} from '@chakra-ui/react'
import { Card, CardBody, CardHeader } from '@chakra-ui/card'
import { 
  FiSearch, 
  FiGlobe, 
  FiMonitor, 
  FiSmartphone, 
  FiTablet,
  FiMapPin,
  FiClock,
  FiActivity,
  FiRefreshCw,
  FiUsers
} from 'react-icons/fi'
import { SiFirefox, SiSafari, SiGooglechrome } from 'react-icons/si'
import { format, parseISO } from 'date-fns'

// CSS for spinner animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const DeviceIcon = ({ device }) => {
  switch (device?.toLowerCase()) {
    case 'mobile':
      return <Icon as={FiSmartphone} />
    case 'tablet':
      return <Icon as={FiTablet} />
    case 'desktop':
      return <Icon as={FiMonitor} />
    default:
      return <Icon as={FiMonitor} />
  }
}

const BrowserIcon = ({ browser }) => {
  const b = browser?.toLowerCase()
  if (b?.includes('chrome')) return <SiGooglechrome />
  if (b?.includes('firefox')) return <SiFirefox />
  if (b?.includes('safari')) return <SiSafari />
  if (b?.includes('edge')) return <Icon as={FiGlobe} />
  return <Icon as={FiGlobe} />
}

const CountryBadge = ({ country, city }) => {
  const colorScheme = country ? 'blue' : 'gray'
  return (
    <HStack spacing={1}>
      <Icon as={FiMapPin} boxSize={3} />
      <Badge colorScheme={colorScheme} variant="subtle">
        {country || 'Unknown'} {city && `• ${city}`}
      </Badge>
    </HStack>
  )
}

export default function SubscriberManagement() {
  const [subscribers, setSubscribers] = useState([])
  const [filteredSubscribers, setFilteredSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDevice, setFilterDevice] = useState('all')
  const [filterBrowser, setFilterBrowser] = useState('all')
  const [filterCountry, setFilterCountry] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [stats, setStats] = useState({
    total: 0,
    devices: {},
    browsers: {},
    countries: {},
    os: {}
  })

  const headers = useAuthHeaders()
  const cardBg = useColorModeValue('white', 'gray.800')

  const fetchSubscribers = async () => {
    try {
      setLoading(true)
      const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:4000'
      const response = await fetch(`${apiBase}/api/customer/subscribers`, { headers })
      if (!response.ok) throw new Error('Failed to fetch subscribers')
      const data = await response.json()
      
      // Calculate statistics
      const deviceCount = {}
      const browserCount = {}
      const countryCount = {}
      const osCount = {}
      
      data.forEach(sub => {
        deviceCount[sub.device] = (deviceCount[sub.device] || 0) + 1
        browserCount[sub.browser] = (browserCount[sub.browser] || 0) + 1
        osCount[sub.os] = (osCount[sub.os] || 0) + 1
        if (sub.country) {
          countryCount[sub.country] = (countryCount[sub.country] || 0) + 1
        }
      })
      
      setStats({
        total: data.length,
        devices: deviceCount,
        browsers: browserCount,
        countries: countryCount,
        os: osCount
      })
      
      console.log('✅ Fetched subscribers data:', data)
      console.log('✅ Data length:', data.length)
      setSubscribers(data)
      setFilteredSubscribers(data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch subscribers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [])

  useEffect(() => {
    let filtered = [...subscribers]
    
    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.browser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.os?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterDevice !== 'all') {
      filtered = filtered.filter(sub => sub.device === filterDevice)
    }
    
    if (filterBrowser !== 'all') {
      filtered = filtered.filter(sub => sub.browser === filterBrowser)
    }
    
    if (filterCountry !== 'all') {
      filtered = filtered.filter(sub => sub.country === filterCountry)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'lastActive':
          return new Date(b.lastActive || b.created_at) - new Date(a.lastActive || a.created_at)
        case 'engagement':
          return (b.engagementScore || 0) - (a.engagementScore || 0)
        case 'country':
          return (a.country || 'ZZZ').localeCompare(b.country || 'ZZZ')
        default:
          return 0
      }
    })
    
    setFilteredSubscribers(filtered)
  }, [searchTerm, filterDevice, filterBrowser, filterCountry, sortBy, subscribers])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never'
    return format(parseISO(dateStr), 'MMM d, yyyy HH:mm')
  }

  if (error) {
    return (
      <div style={{padding: '16px', backgroundColor: '#FED7D7', border: '1px solid #F56565', borderRadius: '6px', color: '#C53030'}}>
        Error loading subscribers: {error}
      </div>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg">Subscriber Management</Heading>
          <Text color="gray.600" mt={1}>
            Monitor and manage your push notification subscribers
          </Text>
        </Box>
        <Button 
          leftIcon={<Icon as={FiRefreshCw} />} 
          onClick={fetchSubscribers}
          isLoading={loading}
          colorScheme="blue"
          variant="outline"
        >
          Refresh
        </Button>
      </Flex>

      {/* Statistics Cards */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <HStack justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  Total Subscribers
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {loading ? <div style={{width: '16px', height: '16px', border: '2px solid #E2E8F0', borderTop: '2px solid #3182CE', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div> : stats.total.toLocaleString()}
                </Text>
              </Box>
              <Icon as={FiUsers} boxSize={6} color="blue.400" />
            </HStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Text fontSize="sm" color="gray.500" fontWeight="medium" mb={2}>
              Device Distribution
            </Text>
            <VStack spacing={1} align="stretch">
              {Object.entries(stats.devices).slice(0, 3).map(([device, count]) => (
                <HStack key={device} justify="space-between">
                  <HStack>
                    <DeviceIcon device={device} />
                    <Text fontSize="sm">{device}</Text>
                  </HStack>
                  <Badge>{count}</Badge>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Text fontSize="sm" color="gray.500" fontWeight="medium" mb={2}>
              Top Browsers
            </Text>
            <VStack spacing={1} align="stretch">
              {Object.entries(stats.browsers).slice(0, 3).map(([browser, count]) => (
                <HStack key={browser} justify="space-between">
                  <HStack>
                    <BrowserIcon browser={browser} />
                    <Text fontSize="sm">{browser}</Text>
                  </HStack>
                  <Badge>{count}</Badge>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="xl">
          <CardBody>
            <Text fontSize="sm" color="gray.500" fontWeight="medium" mb={2}>
              Top Countries
            </Text>
            <VStack spacing={1} align="stretch">
              {Object.entries(stats.countries).slice(0, 3).map(([country, count]) => (
                <HStack key={country} justify="space-between">
                  <HStack>
                    <Icon as={FiGlobe} boxSize={4} />
                    <Text fontSize="sm">{country}</Text>
                  </HStack>
                  <Badge>{count}</Badge>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </Grid>

      {/* Filters */}
      <Card bg={cardBg} borderRadius="xl">
        <CardBody>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(5, 1fr)' }} gap={4}>
            <div style={{position: 'relative'}}>
              <Icon as={FiSearch} color="gray.400" style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 1}} />
              <Input
                placeholder="Search by location, browser, OS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{paddingLeft: '40px'}}
              />
            </div>

            <select value={filterDevice} onChange={(e) => setFilterDevice(e.target.value)} style={{padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: 'white'}}>
              <option value="all">All Devices</option>
              {Object.keys(stats.devices).map(device => (
                <option key={device} value={device}>{device}</option>
              ))}
            </select>

            <select value={filterBrowser} onChange={(e) => setFilterBrowser(e.target.value)} style={{padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: 'white'}}>
              <option value="all">All Browsers</option>
              {Object.keys(stats.browsers).map(browser => (
                <option key={browser} value={browser}>{browser}</option>
              ))}
            </select>

            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} style={{padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: 'white'}}>
              <option value="all">All Countries</option>
              {Object.keys(stats.countries).map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: 'white'}}>
              <option value="createdAt">Newest First</option>
              <option value="lastActive">Recently Active</option>
              <option value="engagement">Engagement Score</option>
              <option value="country">Country</option>
            </select>
          </Grid>
        </CardBody>
      </Card>

      {/* Subscribers Table */}
      <Card bg={cardBg} borderRadius="xl">
        <CardHeader>
          <Heading size="md">
            Subscribers ({filteredSubscribers.length} of {subscribers.length})
          </Heading>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Flex justify="center" align="center" h="200px">
              <div style={{width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTop: '3px solid #3182CE', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            </Flex>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid #E2E8F0'}}>
                    <th style={{padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#4A5568'}}>Location</th>
                    <th style={{padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#4A5568'}}>Device Info</th>
                    <th style={{padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#4A5568'}}>Tenant</th>
                    <th style={{padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#4A5568'}}>Engagement</th>
                    <th style={{padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#4A5568'}}>Last Active</th>
                    <th style={{padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#4A5568'}}>Subscribed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((sub, index) => (
                    <tr key={sub.id || `subscriber-${index}-${sub.created_at}`} style={{borderBottom: '1px solid #E2E8F0'}}>
                      <td style={{padding: '12px 8px', verticalAlign: 'top'}}>
                        <VStack align="start" spacing={1}>
                          <CountryBadge country={sub.country} city={sub.city} />
                          {sub.timezone && (
                            <HStack spacing={1} fontSize="xs" color="gray.500">
                              <Icon as={FiClock} boxSize={3} />
                              <Text>{sub.timezone}</Text>
                            </HStack>
                          )}
                        </VStack>
                      </td>
                      <td style={{padding: '12px 8px', verticalAlign: 'top'}}>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <DeviceIcon device={sub.device} />
                            <Text fontSize="sm">{sub.device}</Text>
                            <Text fontSize="xs" color="gray.500">• {sub.os}</Text>
                          </HStack>
                          <HStack spacing={1}>
                            <BrowserIcon browser={sub.browser} />
                            <Text fontSize="xs">{sub.browser}</Text>
                          </HStack>
                        </VStack>
                      </td>
                      <td style={{padding: '12px 8px', verticalAlign: 'top'}}>
                        <Badge colorScheme="purple" variant="subtle">
                          {sub.tenant}
                        </Badge>
                      </td>
                      <td style={{padding: '12px 8px', verticalAlign: 'top'}}>
                        <VStack align="start" spacing={0}>
                          <HStack>
                            <Icon as={FiActivity} boxSize={3} color="green.500" />
                            <Text fontSize="sm" fontWeight="medium">
                              {sub.engagementScore || 0}
                            </Text>
                          </HStack>
                          {sub.segments?.length > 0 && (
                            <HStack spacing={1} mt={1}>
                              {sub.segments.slice(0, 2).map((segment, i) => (
                                <Badge key={i} size="xs" colorScheme="teal">
                                  {segment}
                                </Badge>
                              ))}
                            </HStack>
                          )}
                        </VStack>
                      </td>
                      <td style={{padding: '12px 8px', verticalAlign: 'top'}}>
                        <div title={formatDate(sub.lastActive)}>
                          <Text fontSize="sm" color="gray.600">
                            {sub.lastActive ? format(parseISO(sub.lastActive), 'MMM d') : 'Never'}
                          </Text>
                        </div>
                      </td>
                      <td style={{padding: '12px 8px', verticalAlign: 'top'}}>
                        <div title={formatDate(sub.created_at)}>
                          <Text fontSize="sm" color="gray.600">
                            {format(parseISO(sub.created_at), 'MMM d, yyyy')}
                          </Text>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSubscribers.length === 0 && (
                <Flex justify="center" align="center" h="100px">
                  <Text color="gray.500">
                    No subscribers found (Total: {subscribers.length}, Filtered: {filteredSubscribers.length})
                  </Text>
                </Flex>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </VStack>
  )
}