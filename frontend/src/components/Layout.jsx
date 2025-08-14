import { Box, Button, Container, Flex, HStack, Link as ChakraLink, Text } from '@chakra-ui/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Layout({ children }) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  function logout() {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
    } catch (_) {}
    navigate('/login')
  }

  return (
    <Box bg="#f7fafc" minH="100vh">
      <Box bg="white" borderBottom="1px solid #e2e8f0" py={3} position="sticky" top={0} zIndex={10}>
        <Container maxW="6xl">
          <Flex align="center" justify="space-between">
            <HStack spacing={6}>
              <ChakraLink as={Link} to="/" fontWeight={700} fontSize="lg" _hover={{ textDecoration: 'none' }}>PushNotify</ChakraLink>
              <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
                <ChakraLink as={Link} to="/docs" color={isActive('/docs') ? 'blue.600' : 'gray.600'}>Docs</ChakraLink>
                {token ? (
                  <ChakraLink as={Link} to="/app" color={isActive('/app') ? 'blue.600' : 'gray.600'}>Dashboard</ChakraLink>
                ) : null}
              </HStack>
            </HStack>
            <HStack spacing={3}>
              {token ? (
                <Button variant="outline" onClick={logout}>Logout</Button>
              ) : (
                <Button as={Link} to="/login" colorScheme="blue">Sign In</Button>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Box as="main">{children}</Box>

      <Box as="footer" mt={12} py={6} bg="white" borderTop="1px solid #e2e8f0">
        <Container maxW="6xl">
          <Text fontSize="sm" color="gray.600">© {new Date().getFullYear()} PushNotify. All rights reserved.</Text>
        </Container>
      </Box>
    </Box>
  )
}


