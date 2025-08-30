import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Flex,
  Card,
  CardBody
} from '@chakra-ui/react'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { Alert, AlertIcon } from '@chakra-ui/alert'
import { FormControl, FormLabel } from '@chakra-ui/form-control'

export default function DemoLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const cardBg = useColorModeValue('white', 'gray.800')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store the token
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)

      setSuccess('Login successful! Redirecting to professional dashboard...')
      
      // Redirect to professional dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50">
      <Box maxW="md" w="full" mx="auto" p={8}>
        {/* Header */}
        <Box 
          bgGradient="linear(to-r, blue.500, purple.600)"
          borderRadius="2xl"
          p={8}
          color="white"
          textAlign="center"
          mb={8}
        >
          <Heading size="xl" mb={2}>🚀 Professional Dashboard</Heading>
          <Text opacity={0.9}>
            Login to access the full-featured notification platform
          </Text>
        </Box>

        {/* Login Form */}
        <Card bg={cardBg} borderRadius="xl" boxShadow="xl">
          <CardBody p={8}>
            <form onSubmit={handleLogin}>
              <VStack spacing={6}>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    size="lg"
                    required
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    size="lg"
                    required
                  />
                </FormControl>

                {error && (
                  <Alert status="error" borderRadius="lg">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert status="success" borderRadius="lg">
                    <AlertIcon />
                    {success}
                  </Alert>
                )}

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  isLoading={loading}
                  loadingText="Logging in..."
                >
                  Login to Dashboard
                </Button>

                {/* Demo Accounts */}
                <Box w="full" pt={4} borderTop="1px solid" borderColor="gray.200">
                  <Text fontSize="sm" color="gray.600" mb={3} textAlign="center">
                    Quick Demo Access:
                  </Text>
                  <VStack spacing={2}>
                    <Button
                      variant="outline"
                      size="sm"
                      w="full"
                      onClick={() => quickLogin('demo@customer.com', 'password123')}
                    >
                      Demo Customer Account
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      w="full"
                      onClick={() => quickLogin('admin@example.com', 'admin123')}
                    >
                      Demo Admin Account
                    </Button>
                  </VStack>
                </Box>

                <HStack spacing={4} w="full">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                  >
                    ← Back to Home
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/register')}
                  >
                    Create Account →
                  </Button>
                </HStack>
              </VStack>
            </form>
          </CardBody>
        </Card>

        <Text fontSize="sm" color="gray.500" textAlign="center" mt={4}>
          Need help? The demo accounts above provide instant access to explore the professional dashboard features.
        </Text>
      </Box>
    </Flex>
  )
}