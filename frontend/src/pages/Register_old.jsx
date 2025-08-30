import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { Button, Card, CardBody, CardHeader, Input, Alert, Badge } from '../components/ui'
import { Check, User, Mail, Lock, Briefcase, Globe, Bell, Zap, Shield } from 'lucide-react'
import Layout from '../components/Layout.jsx'

export default function Register() {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  
  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.900', 'gray.100')
  const mutedColor = useColorModeValue('gray.700', 'gray.300')
  const headingColor = useColorModeValue('gray.900', 'white')
  const labelColor = useColorModeValue('gray.800', 'gray.200')

  const validateForm = () => {
    const newErrors = {}
    
    if (!form.name || form.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (!form.companyName || form.companyName.length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters'
    }
    
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!form.password || form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          companyName: form.companyName,
          email: form.email,
          password: form.password
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }
      
      // Store token and role
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      
      toast({
        title: 'Registration successful!',
        description: `Welcome to Push Notification Service, ${form.name}!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      // Show country info if available
      if (data.customer.country) {
        toast({
          title: 'Location detected',
          description: `Registered from ${data.customer.city || 'Unknown City'}, ${data.customer.country}`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        })
      }
      
      // Redirect to dashboard
      navigate('/app')
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <Layout>
      <Box bg={bgColor} minH="100vh" py={12}>
        <Container maxW="7xl">
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={12} alignItems="center">
            {/* Left Side - Registration Form */}
            <GridItem>
              <Card maxW="md" mx="auto" bg={cardBg} shadow="xl" borderRadius="xl">
                <CardBody p={8}>
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center">
                    <Box bg="blue.50" p={4} borderRadius="full" display="inline-block" mb={4}>
                      <Icon as={FiBell} boxSize={12} color="blue.500" />
                    </Box>
                    <Text as="h1" fontSize="3xl" fontWeight="bold" mb={2} color="gray.900">Create Your Account</Text>
                    <Text color="gray.600" fontSize="lg">Start sending push notifications in minutes</Text>
                  </Box>
                  
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4}>
                      <FormControl isInvalid={!!errors.name}>
                        <FormLabel color="gray.700" fontWeight="semibold" display="flex" alignItems="center">
                          <Icon as={FiUser} mr={2} />
                          Your Name
                        </FormLabel>
                        <Input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                        />
                        <FormErrorMessage>{errors.name}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.companyName}>
                        <FormLabel color="gray.700" fontWeight="semibold" display="flex" alignItems="center">
                          <Icon as={FiBriefcase} mr={2} />
                          Company Name
                        </FormLabel>
                        <Input
                          name="companyName"
                          value={form.companyName}
                          onChange={handleChange}
                          placeholder="Acme Inc."
                        />
                        <FormErrorMessage>{errors.companyName}</FormErrorMessage>
                        <FormHelperText color="gray.600">This will be used in your notifications</FormHelperText>
                      </FormControl>

                      <FormControl isInvalid={!!errors.email}>
                        <FormLabel color="gray.700" fontWeight="semibold" display="flex" alignItems="center">
                          <Icon as={FiMail} mr={2} />
                          Email Address
                        </FormLabel>
                        <Input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                        />
                        <FormErrorMessage>{errors.email}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.password}>
                        <FormLabel color="gray.700" fontWeight="semibold" display="flex" alignItems="center">
                          <Icon as={FiLock} mr={2} />
                          Password
                        </FormLabel>
                        <Input
                          type="password"
                          name="password"
                          value={form.password}
                          onChange={handleChange}
                          placeholder="At least 6 characters"
                        />
                        <FormErrorMessage>{errors.password}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.confirmPassword}>
                        <FormLabel color="gray.700" fontWeight="semibold" display="flex" alignItems="center">
                          <Icon as={FiLock} mr={2} />
                          Confirm Password
                        </FormLabel>
                        <Input
                          type="password"
                          name="confirmPassword"
                          value={form.confirmPassword}
                          onChange={handleChange}
                          placeholder="Re-enter your password"
                        />
                        <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                      </FormControl>

                      <Button
                        type="submit"
                        colorScheme="blue"
                        size="lg"
                        width="full"
                        isLoading={isLoading}
                        loadingText="Creating account..."
                      >
                        Create Account
                      </Button>
                    </VStack>
                  </form>

                  <Box borderTop="1px solid" borderColor="gray.200" />

                  <Text textAlign="center" fontSize="sm" color="gray.600">
                    Already have an account?{' '}
                    <Link as={RouterLink} to="/login" color="blue.500" fontWeight="semibold">
                      Sign in
                    </Link>
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Right Side - Features */}
          <GridItem>
            <VStack spacing={8} align="stretch">
              <Box>
                <Text as="h2" fontSize="4xl" fontWeight="bold" mb={4} color="gray.800">
                  Why Choose Our Platform?
                </Text>
                <Text fontSize="xl" color="gray.600" mb={6}>
                  Join thousands of businesses worldwide using our push notification service
                </Text>
              </Box>

              <Alert status="success" borderRadius="lg" bg="green.50" borderWidth="1px" borderColor="green.200">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" color="green.800">Free Plan Included</Text>
                  <Text fontSize="sm" color="green.700">Start with 1,000 free subscribers. No credit card required.</Text>
                </Box>
              </Alert>

              <VStack spacing={6} align="stretch">
                <HStack align="start" spacing={4}>
                  <Box bg="blue.50" p={3} borderRadius="lg">
                    <Icon as={FiGlobe} boxSize={6} color="blue.500" />
                  </Box>
                  <Box flex={1}>
                    <Text fontWeight="bold" fontSize="lg" color="gray.800">Global Reach</Text>
                    <Text fontSize="md" color="gray.600" mt={1}>
                      We automatically detect your location to provide optimized service and comply with regional regulations
                    </Text>
                  </Box>
                </HStack>

                <HStack align="start" spacing={4}>
                  <Box bg="green.50" p={3} borderRadius="lg">
                    <Icon as={FiZap} boxSize={6} color="green.500" />
                  </Box>
                  <Box flex={1}>
                    <Text fontWeight="bold" fontSize="lg" color="gray.800">Instant Setup</Text>
                    <Text fontSize="md" color="gray.600" mt={1}>
                      VAPID keys generated automatically. Start sending notifications in under 5 minutes
                    </Text>
                  </Box>
                </HStack>

                <HStack align="start" spacing={4}>
                  <Box bg="purple.50" p={3} borderRadius="lg">
                    <Icon as={FiShield} boxSize={6} color="purple.500" />
                  </Box>
                  <Box flex={1}>
                    <Text fontWeight="bold" fontSize="lg" color="gray.800">Enterprise Security</Text>
                    <Text fontSize="md" color="gray.600" mt={1}>
                      JWT authentication, encrypted storage, and API key protection
                    </Text>
                  </Box>
                </HStack>
              </VStack>

              <Card bg="blue.50" borderColor="blue.200" borderWidth={2} shadow="md">
                <CardHeader pb={2}>
                  <Text fontSize="xl" fontWeight="bold" color="blue.900">What's Included:</Text>
                </CardHeader>
                <CardBody pt={2}>
                  <VStack spacing={3} align="stretch">
                    <HStack spacing={3}>
                      <Icon as={FiCheck} color="green.500" boxSize={5} />
                      <Text color="blue.800" fontWeight="medium">Real-time push notifications</Text>
                    </HStack>
                    <HStack spacing={3}>
                      <Icon as={FiCheck} color="green.500" boxSize={5} />
                      <Text color="blue.800" fontWeight="medium">Comprehensive API documentation</Text>
                    </HStack>
                    <HStack spacing={3}>
                      <Icon as={FiCheck} color="green.500" boxSize={5} />
                      <Text color="blue.800" fontWeight="medium">JavaScript SDK for easy integration</Text>
                    </HStack>
                    <HStack spacing={3}>
                      <Icon as={FiCheck} color="green.500" boxSize={5} />
                      <Text color="blue.800" fontWeight="medium">Analytics and delivery metrics</Text>
                    </HStack>
                    <HStack spacing={3}>
                      <Icon as={FiCheck} color="green.500" boxSize={5} />
                      <Text color="blue.800" fontWeight="medium">Multi-browser support</Text>
                    </HStack>
                    <HStack spacing={3}>
                      <Icon as={FiCheck} color="green.500" boxSize={5} />
                      <Text color="blue.800" fontWeight="medium">24/7 technical support</Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              <HStack spacing={4} justify="center">
                <Badge colorScheme="green" fontSize="md" px={3} py={1}>No Setup Fees</Badge>
                <Badge colorScheme="blue" fontSize="md" px={3} py={1}>GDPR Compliant</Badge>
                <Badge colorScheme="purple" fontSize="md" px={3} py={1}>99.9% Uptime</Badge>
              </HStack>
            </VStack>
          </GridItem>
        </Grid>
        </Container>
      </Box>
    </Layout>
  )
}