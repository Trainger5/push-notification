import { useState } from 'react'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Code,
  Badge,
  Link,
  Icon,
  Flex,
  Grid,
  GridItem,
  IconButton
} from '@chakra-ui/react'
import { useToast } from '@chakra-ui/toast'
import { Alert } from '@chakra-ui/alert'
import { Card, CardBody, CardHeader } from '@chakra-ui/card'
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/tabs'
import { FiBook, FiCode, FiServer, FiKey, FiSend, FiCheck, FiCopy, FiExternalLink, FiGlobe, FiShield, FiZap, FiBell, FiHome, FiUser } from 'react-icons/fi'
import Layout from '../components/Layout.jsx'

const CodeBlock = ({ children, language = 'javascript' }) => {
  const toast = useToast()
  const bg = 'gray.50'
  
  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(children)
      } else {
        // Fallback for non-secure contexts or unsupported browsers
        const textArea = document.createElement('textarea')
        textArea.value = children
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      toast({
        title: 'Copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the code manually',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Box position="relative" bg={bg} p={4} borderRadius="lg" my={4}>
      <IconButton
        icon={<FiCopy />}
        size="sm"
        position="absolute"
        top={2}
        right={2}
        onClick={copyToClipboard}
        aria-label="Copy code"
        variant="ghost"
      />
      <Code display="block" whiteSpace="pre" fontSize="sm" bg="transparent" overflowX="auto">
        {children}
      </Code>
    </Box>
  )
}

const SidebarLink = ({ href, icon, children, isActive, onClick }) => {
  const activeBg = 'blue.50'
  const activeColor = 'blue.600'
  const defaultColor = 'gray.700'
  
  return (
    <Link
      href={href}
      display="flex"
      alignItems="center"
      px={4}
      py={2}
      borderRadius="md"
      bg={isActive ? activeBg : 'transparent'}
      color={isActive ? activeColor : defaultColor}
      _hover={{ bg: activeBg, textDecoration: 'none', color: 'blue.600' }}
      transition="all 0.2s"
      onClick={onClick}
      fontWeight="medium"
    >
      <Icon as={icon} mr={3} color={isActive ? activeColor : 'gray.500'} />
      <Text color={isActive ? activeColor : defaultColor}>{children}</Text>
    </Link>
  )
}

export default function Docs() {
  const [activeSection, setActiveSection] = useState('getting-started')
  const cardBg = 'white'
  const borderColor = 'gray.200'
  const textColor = 'gray.800'
  const mutedColor = 'gray.600'
  const role = typeof localStorage !== 'undefined' ? localStorage.getItem('role') : null

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: FiBook },
    { id: 'api-reference', title: 'API Reference', icon: FiCode },
    { id: 'sdk-integration', title: 'SDK Integration', icon: FiGlobe },
    { id: 'authentication', title: 'Authentication', icon: FiKey },
    { id: 'webhooks', title: 'Webhooks', icon: FiSend },
    { id: 'best-practices', title: 'Best Practices', icon: FiShield },
  ]

  return (
    <Layout>
      <Container maxW="8xl" py={8}>
        <Grid templateColumns={{ base: '1fr', md: '250px 1fr' }} gap={8}>
          {/* Sidebar Navigation */}
          <GridItem>
            <VStack
              as="nav"
              position="sticky"
              top="20px"
              align="stretch"
              spacing={1}
              bg={cardBg}
              p={4}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <Heading size="sm" mb={4} px={4}>Documentation</Heading>
              {sections.map((section) => (
                <SidebarLink
                  key={section.id}
                  href={`#${section.id}`}
                  icon={section.icon}
                  isActive={activeSection === section.id}
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveSection(section.id)
                  }}
                >
                  {section.title}
                </SidebarLink>
              ))}
              <Box borderTop="1px" borderColor="gray.200" my={4} />
              <SidebarLink href="/" icon={FiHome} as={RouterLink} to="/">
                Back to Home
              </SidebarLink>
              {role && (
                <SidebarLink 
                  href={role === 'admin' ? '/admin-dashboard' : '/app'} 
                  icon={FiUser} 
                  as={RouterLink} 
                  to={role === 'admin' ? '/admin-dashboard' : '/app'}
                >
                  Dashboard
                </SidebarLink>
              )}
            </VStack>
          </GridItem>

          {/* Main Content */}
          <GridItem>
            <VStack align="stretch" spacing={8}>
              {/* Hero Section */}
              <Card bg={cardBg} borderRadius="xl" overflow="hidden">
                <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" p={8} color="white">
                  <Heading size="2xl" mb={4}>
                    <Icon as={FiBell} mr={4} />
                    Push Notification API Documentation
                  </Heading>
                  <Text fontSize="lg" opacity={0.9}>
                    Everything you need to integrate web push notifications into your application
                  </Text>
                  <HStack mt={6} spacing={4}>
                    <Badge bg="rgba(255,255,255,0.2)" color="white" fontSize="md" px={3} py={1}>v1.0.0</Badge>
                    <Badge bg="rgba(72,187,120,0.8)" color="white" fontSize="md" px={3} py={1}>Production Ready</Badge>
                  </HStack>
                </Box>
              </Card>

              {/* Getting Started Section */}
              {activeSection === 'getting-started' && (
                <VStack align="stretch" spacing={6}>
                  <Card bg={cardBg} borderRadius="xl">
                    <CardHeader>
                      <Heading size="lg">
                        <Icon as={FiZap} mr={3} color="blue.500" />
                        Quick Start Guide
                      </Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={6}>
                        <Alert status="success" borderRadius="md">
                          <Alert />
                          <Box>
                            <Text fontWeight="bold">
                              🚀 It's literally ONE line of code!
                            </Text>
                            <Text fontSize="sm">
                              No complex setup, no service worker files to create. Just copy, paste, and you're done!
                            </Text>
                          </Box>
                        </Alert>

                        <Box>
                          <Heading size="md" mb={4}>1. Get Your API Key</Heading>
                          <Text mb={4}>Login to your dashboard to get your unique API key for authentication.</Text>
                          <CodeBlock language="text">
{`Navigate to Dashboard > Settings > API Keys
Or for testing: Create a customer account in Admin Dashboard`}
                          </CodeBlock>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>2. Copy & Paste ONE Line of Code!</Heading>
                          <Text mb={4}>It's really that simple - just add this ONE line anywhere in your HTML:</Text>
                          
                          <Alert status="success" borderRadius="md" mb={4}>
                            <Alert />
                            <Box>
                              <Text fontWeight="bold">That's it! No complex setup, no service worker files to create.</Text>
                              <Text fontSize="sm">Our smart button handles everything automatically.</Text>
                            </Box>
                          </Alert>

                          <CodeBlock language="html">
{`<script src="https://pushads123.com/push-button.js" data-api-key="YOUR_API_KEY" data-auto-init></script>`}
                          </CodeBlock>
                          
                          <Box mt={4} p={4} bg="gray.50" borderRadius="md">
                            <Text fontWeight="bold" mb={2}>🎉 What this one line does:</Text>
                            <VStack align="stretch" spacing={1} fontSize="sm">
                              <Text>• Loads the push notification system</Text>
                              <Text>• Creates a beautiful subscribe button</Text>
                              <Text>• Handles service worker registration</Text>
                              <Text>• Manages user permissions</Text>
                              <Text>• Automatically subscribes users</Text>
                            </VStack>
                          </Box>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>3. Customize Your Button (Optional)</Heading>
                          <Text mb={4}>Want to customize the button? Add these optional attributes:</Text>
                          
                          <CodeBlock language="html">
{`<script 
  src="https://pushads123.com/push-button.js" 
  data-api-key="YOUR_API_KEY"
  data-auto-init
  data-theme="gradient"
  data-subscribe-text="🔔 Get Notifications"
  data-subscribed-text="✅ Subscribed!"
></script>`}
                          </CodeBlock>
                          
                          <Text fontWeight="bold" mb={2}>Available Themes:</Text>
                          <Grid templateColumns="repeat(3, 1fr)" gap={2} mb={4}>
                            <Badge colorScheme="purple">primary - Purple gradient</Badge>
                            <Badge colorScheme="green">success - Green gradient</Badge>
                            <Badge colorScheme="red">danger - Pink gradient</Badge>
                            <Badge colorScheme="gray">dark - Dark gradient</Badge>
                            <Badge colorScheme="gray">light - Light theme</Badge>
                            <Badge colorScheme="pink">gradient - Rainbow</Badge>
                          </Grid>
                          
                          <Alert status="info" borderRadius="md">
                            <Alert />
                            <Text>
                              <strong>Pro tip:</strong> The button automatically shows different text based on subscription status!
                            </Text>
                          </Alert>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>4. Send Your First Notification (That's It!)</Heading>
                          <Text mb={4}>Send notifications directly from your website (great for testing):</Text>
                          <CodeBlock language="javascript">
{`async function sendTestNotification() {
  try {
    const response = await fetch('https://pushads123.com/api/customer/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${YOUR_API_KEY}\`
      },
      body: JSON.stringify({
        title: '🎉 Welcome!',
        body: 'Thanks for subscribing to notifications!',
        url: window.location.href // Opens current page when clicked
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(\`Notification sent! Success: \${data.sent}, Failed: \${data.failed}\`);
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}`}
                          </CodeBlock>
                          
                          <Alert status="success" borderRadius="md" mt={4}>
                            <Alert />
                            <Box>
                              <Text fontWeight="bold">🚀 You're Done!</Text>
                              <Text fontSize="sm">Just 4 simple steps and your push notifications are live!</Text>
                            </Box>
                          </Alert>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>Advanced: Send from Backend</Heading>
                          <Text mb={4}>For production, send notifications from your server:</Text>
                          <Tabs variant="enclosed">
                            <TabList>
                              <Tab>cURL</Tab>
                              <Tab>JavaScript</Tab>
                              <Tab>Python</Tab>
                            </TabList>
                            <TabPanels>
                              <TabPanel>
                                <CodeBlock language="bash">
{`# Using customer API key (easier for testing)
curl -X POST https://pushads123.com/api/customer/notify \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "title": "Hello World",
    "body": "Your first push notification!",
    "url": "https://your-site.com"
  }'

# Or login first to get JWT token
curl -X POST https://pushads123.com/api/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"customer@email.com","password":"password"}'`}
                                </CodeBlock>
                              </TabPanel>
                              <TabPanel>
                                <CodeBlock>
{`// Using API key (from customer dashboard)
const API_KEY = 'your-customer-api-key';

const response = await fetch('https://pushads123.com/api/customer/notify', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Hello World',
    body: 'Your first push notification!',
    url: 'https://your-site.com'
  })
});

const result = await response.json();
console.log(\`Sent: \${result.sent}, Failed: \${result.failed}\`);`}
                                </CodeBlock>
                              </TabPanel>
                              <TabPanel>
                                <CodeBlock language="python">
{`import requests

# Using API key (from customer dashboard)
API_KEY = 'your-customer-api-key'

response = requests.post(
    'https://pushads123.com/api/customer/notify',
    headers={
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    },
    json={
        'title': 'Hello World',
        'body': 'Your first push notification!',
        'url': 'https://your-site.com'
    }
)

result = response.json()
print(f"Sent: {result['sent']}, Failed: {result['failed']}")`}
                                </CodeBlock>
                              </TabPanel>
                            </TabPanels>
                          </Tabs>
                        </Box>
                        
                        <Box>
                          <Heading size="md" mb={4}>Live Demo</Heading>
                          <Text mb={4}>Try our subscribe button right here in the documentation:</Text>
                          
                          <Card bg="gray.50" p={6} borderRadius="xl" textAlign="center">
                            <VStack spacing={4}>
                              <Text fontSize="lg" fontWeight="bold">🚀 ONE LINE Integration Demo</Text>
                              <Text color="gray.600" fontSize="sm">
                                This is how simple it really is - just copy the code below!
                              </Text>
                              
                              <Box textAlign="left" bg="white" p={4} borderRadius="md" fontSize="sm" fontFamily="mono" maxW="md">
                                <Text fontWeight="bold" mb={2} textAlign="center" color="green.600">
                                  The ONLY code you need:
                                </Text>
                                <Code display="block" whiteSpace="pre" fontSize="xs" bg="transparent">
{`<script 
  src="https://pushads123.com/push-button.js" 
  data-api-key="YOUR_API_KEY"
  data-auto-init
></script>`}
                                </Code>
                              </Box>
                              
                              <Box>
                                <button 
                                  id="docs-demo-button"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '16px 32px',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)',
                                    color: 'white',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                  }}
                                  onClick={(e) => {
                                    e.target.disabled = true;
                                    e.target.innerHTML = '⏳ Loading...';
                                    setTimeout(() => {
                                      e.target.innerHTML = '✅ Demo Active!';
                                      e.target.style.background = 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)';
                                    }, 2000);
                                  }}
                                >
                                  🔔 Try Demo Notifications
                                </button>
                              </Box>
                              
                              <Text fontSize="xs" color="gray.500" maxW="md">
                                This demo shows the button interaction. For your site, just replace "YOUR_API_KEY" with your actual API key!
                              </Text>
                            </VStack>
                          </Card>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                    <Card bg={cardBg} borderRadius="xl" borderWidth={1} borderColor={borderColor}>
                      <CardBody>
                        <Icon as={FiServer} boxSize={8} color="blue.500" mb={4} />
                        <Heading size="md" mb={2}>Server Requirements</Heading>
                        <VStack spacing={2} align="stretch">
                          <HStack>
                            <Icon as={FiCheck} color="green.500" mr={2} />
                            <Text>Node.js 18+</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheck} color="green.500" mr={2} />
                            <Text>HTTPS in production</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheck} color="green.500" mr={2} />
                            <Text>VAPID keys (auto-generated)</Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg} borderRadius="xl" borderWidth={1} borderColor={borderColor}>
                      <CardBody>
                        <Icon as={FiGlobe} boxSize={8} color="green.500" mb={4} />
                        <Heading size="md" mb={2}>Browser Support</Heading>
                        <VStack spacing={2} align="stretch">
                          <HStack>
                            <Icon as={FiCheck} color="green.500" mr={2} />
                            <Text>Chrome/Edge 42+</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheck} color="green.500" mr={2} />
                            <Text>Firefox 44+</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheck} color="green.500" mr={2} />
                            <Text>Safari 16+</Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg} borderRadius="xl" borderWidth={1} borderColor={borderColor}>
                      <CardBody>
                        <Icon as={FiShield} boxSize={8} color="purple.500" mb={4} />
                        <Heading size="md" mb={2}>Security Features</Heading>
                        <VStack spacing={2} align="stretch">
                          <HStack>
                            <Icon as={FiCheck} color="green.500" mr={2} />
                            <Text>JWT Authentication</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheck} color="green.500" mr={2} />
                            <Text>API Key Protection</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheck} color="green.500" mr={2} />
                            <Text>VAPID Encryption</Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </Grid>
                </VStack>
              )}

              {/* API Reference Section */}
              {activeSection === 'api-reference' && (
                <VStack align="stretch" spacing={6}>
                  <Card bg={cardBg} borderRadius="xl">
                    <CardHeader>
                      <Heading size="lg">
                        <Icon as={FiCode} mr={3} color="blue.500" />
                        API Endpoints
                      </Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={8}>
                        {/* Authentication Endpoint */}
                        <Box>
                          <HStack mb={4}>
                            <Badge colorScheme="blue">POST</Badge>
                            <Code>/api/auth/login</Code>
                          </HStack>
                          <Text mb={4}>Authenticate and receive a JWT token for API access.</Text>
                          <Box>
                            <Text fontWeight="bold" mb={2}>Request Body:</Text>
                            <CodeBlock>
{`{
  "email": "user@example.com",
  "password": "your-password"
}`}
                            </CodeBlock>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" mb={2}>Response:</Text>
                            <CodeBlock>
{`{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "customer",
  "email": "user@example.com"
}`}
                            </CodeBlock>
                          </Box>
                        </Box>

                        <Box borderTop="1px" borderColor="gray.200" />

                        {/* Generate VAPID Keys */}
                        <Box>
                          <HStack mb={4}>
                            <Badge colorScheme="blue">POST</Badge>
                            <Code>/api/customer/generate-vapid</Code>
                            <Badge colorScheme="orange">Requires Auth</Badge>
                          </HStack>
                          <Text mb={4}>Generate VAPID keys for your account (one-time setup).</Text>
                          <Box>
                            <Text fontWeight="bold" mb={2}>Headers:</Text>
                            <CodeBlock>
{`Authorization: Bearer YOUR_JWT_TOKEN`}
                            </CodeBlock>
                          </Box>
                        </Box>

                        <Box borderTop="1px" borderColor="gray.200" />

                        {/* Send Notification Endpoint */}
                        <Box>
                          <HStack mb={4}>
                            <Badge colorScheme="blue">POST</Badge>
                            <Code>/api/customer/notify</Code>
                            <Badge colorScheme="orange">Requires Auth</Badge>
                          </HStack>
                          <Text mb={4}>Send push notifications to all your subscribers.</Text>
                          <Box>
                            <Text fontWeight="bold" mb={2}>Headers:</Text>
                            <CodeBlock>
{`Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json`}
                            </CodeBlock>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" mb={2}>Request Body:</Text>
                            <CodeBlock>
{`{
  "title": "Notification Title",
  "body": "Notification body text",
  "url": "https://example.com/landing",
  "icon": "https://example.com/icon.png",
  "badge": "https://example.com/badge.png",
  "image": "https://example.com/image.jpg",
  "tag": "unique-tag",
  "requireInteraction": false,
  "silent": false
}`}
                            </CodeBlock>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" mb={2}>Response:</Text>
                            <CodeBlock>
{`{
  "sent": 150,
  "failed": 2
}`}
                            </CodeBlock>
                          </Box>
                        </Box>

                        <Box borderTop="1px" borderColor="gray.200" />

                        {/* Get Settings */}
                        <Box>
                          <HStack mb={4}>
                            <Badge colorScheme="green">GET</Badge>
                            <Code>/api/customer/me</Code>
                            <Badge colorScheme="orange">Requires Auth</Badge>
                          </HStack>
                          <Text mb={4}>Get your account information and settings.</Text>
                          <Box>
                            <Text fontWeight="bold" mb={2}>Response:</Text>
                            <CodeBlock>
{`{
  "customer": {
    "id": "uuid",
    "name": "Company Name",
    "email": "user@example.com",
    "apiKey": "your-api-key"
  },
  "settings": {
    "vapidPublicKey": "...",
    "vapidPrivateKey": "...",
    "vapidSubject": "mailto:admin@example.com"
  },
  "subscriberCount": 1250
}`}
                            </CodeBlock>
                          </Box>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              )}

              {/* SDK Integration Section */}
              {activeSection === 'sdk-integration' && (
                <VStack align="stretch" spacing={6}>
                  <Card bg={cardBg} borderRadius="xl">
                    <CardHeader>
                      <Heading size="lg">
                        <Icon as={FiGlobe} mr={3} color="blue.500" />
                        SDK Integration Guide
                      </Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={6}>
                        <Alert status="warning" borderRadius="md">
                          <Alert />
                          <Text>
                            The service worker must be hosted on the same origin as your website for security reasons.
                          </Text>
                        </Alert>

                        <Box>
                          <Heading size="md" mb={4}>Service Worker Setup</Heading>
                          <Text mb={4}>Create a file named <Code>pn-sw.js</Code> at your website root:</Text>
                          <CodeBlock>
{`importScripts('https://pushads123.com/pn-sw.js');`}
                          </CodeBlock>
                          <Text mt={4} fontSize="sm" color="gray.600">
                            This single line imports all the necessary push notification functionality. 
                            You can add additional service worker logic after this line if needed.
                          </Text>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>SDK Methods</Heading>
                          <Tabs variant="enclosed">
                            <TabList>
                              <Tab>Initialize</Tab>
                              <Tab>Subscribe</Tab>
                              <Tab>Unsubscribe</Tab>
                              <Tab>Check Status</Tab>
                            </TabList>
                            <TabPanels>
                              <TabPanel>
                                <CodeBlock>
{`// Basic initialization (with data-api-key attribute)
PN.init({ 
  baseUrl: 'https://pushads123.com', 
  serviceWorkerUrl: '/pn-sw.js' 
});

// Or with API key parameter
PN.init({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://pushads123.com',
  serviceWorkerUrl: '/pn-sw.js'
});`}
                                </CodeBlock>
                              </TabPanel>
                              <TabPanel>
                                <CodeBlock>
{`// Manually trigger subscription
PN.subscribe().then((subscription) => {
  console.log('Subscription successful:', subscription);
}).catch((error) => {
  console.error('Subscription failed:', error);
});`}
                                </CodeBlock>
                              </TabPanel>
                              <TabPanel>
                                <CodeBlock>
{`// Unsubscribe user
PN.unsubscribe().then(() => {
  console.log('User unsubscribed');
}).catch((error) => {
  console.error('Unsubscribe failed:', error);
});`}
                                </CodeBlock>
                              </TabPanel>
                              <TabPanel>
                                <CodeBlock>
{`// Check subscription status
PN.getSubscriptionStatus().then((status) => {
  if (status.isSubscribed) {
    console.log('User is subscribed');
  } else {
    console.log('User is not subscribed');
  }
});`}
                                </CodeBlock>
                              </TabPanel>
                            </TabPanels>
                          </Tabs>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>Handling Permissions</Heading>
                          <CodeBlock>
{`// Check notification permission status
if (Notification.permission === 'granted') {
  // User has granted permission
  PN.init({ apiKey: 'YOUR_API_KEY' });
} else if (Notification.permission === 'denied') {
  // User has blocked notifications
  console.log('Notifications are blocked');
} else {
  // Permission not yet requested
  // Show a custom prompt before requesting permission
  showCustomPrompt().then(() => {
    PN.init({ apiKey: 'YOUR_API_KEY' });
  });
}`}
                          </CodeBlock>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              )}

              {/* Authentication Section */}
              {activeSection === 'authentication' && (
                <VStack align="stretch" spacing={6}>
                  <Card bg={cardBg} borderRadius="xl">
                    <CardHeader>
                      <Heading size="lg">
                        <Icon as={FiKey} mr={3} color="blue.500" />
                        Authentication & Security
                      </Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={6}>
                        <Box>
                          <Heading size="md" mb={4}>JWT Authentication</Heading>
                          <Text mb={4}>
                            All API endpoints (except login) require JWT authentication. Tokens expire after 24 hours.
                          </Text>
                          <CodeBlock>
{`// Login to get JWT token
const response = await fetch('https://pushads123.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'your@email.com',
    password: 'your-password'
  })
});

const { token } = await response.json();

// Use token in subsequent requests
fetch('https://pushads123.com/api/customer/notify', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
  // ... rest of request
});`}
                          </CodeBlock>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>API Key Usage</Heading>
                          <Text mb={4}>Your API key is used for SDK initialization and identifying your account:</Text>
                          <VStack spacing={3} align="stretch">
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Find your API key in the dashboard under Settings</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Keep your API key secure - treat it like a password</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Regenerate your API key if it's compromised</Text>
                            </HStack>
                          </VStack>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>Security Best Practices</Heading>
                          <VStack spacing={3} align="stretch">
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text><strong>Use HTTPS in production</strong> - Required for service workers</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text><strong>Store tokens securely</strong> - Use httpOnly cookies or secure storage</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text><strong>Implement token refresh</strong> - Handle token expiration gracefully</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text><strong>Validate webhook signatures</strong> - Verify webhook authenticity</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text><strong>Rate limit your requests</strong> - Avoid hitting API limits</Text>
                            </HStack>
                          </VStack>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              )}

              {/* Webhooks Section */}
              {activeSection === 'webhooks' && (
                <VStack align="stretch" spacing={6}>
                  <Card bg={cardBg} borderRadius="xl">
                    <CardHeader>
                      <Heading size="lg">
                        <Icon as={FiSend} mr={3} color="blue.500" />
                        Webhooks (Coming Soon)
                      </Heading>
                    </CardHeader>
                    <CardBody>
                      <Alert status="info" borderRadius="md" mb={6}>
                        <Alert />
                        <Text>
                          Webhook functionality is currently in development. Subscribe to updates to be notified when this feature is available.
                        </Text>
                      </Alert>
                      
                      <VStack align="stretch" spacing={6}>
                        <Box>
                          <Heading size="md" mb={4}>Planned Webhook Events</Heading>
                          <VStack spacing={3} align="stretch">
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text><strong>notification.sent</strong> - Fired when a notification is successfully sent</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text><strong>notification.failed</strong> - Fired when a notification fails to send</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text><strong>notification.clicked</strong> - Fired when a user clicks on a notification</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text><strong>subscription.created</strong> - Fired when a new user subscribes</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text><strong>subscription.deleted</strong> - Fired when a user unsubscribes</Text>
                            </HStack>
                          </VStack>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>Webhook Payload Format</Heading>
                          <CodeBlock>
{`{
  "event": "notification.sent",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "notificationId": "uuid",
    "customerId": "uuid",
    "title": "Notification Title",
    "recipientCount": 150
  },
  "signature": "hmac-sha256-signature"
}`}
                          </CodeBlock>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              )}

              {/* Best Practices Section */}
              {activeSection === 'best-practices' && (
                <VStack align="stretch" spacing={6}>
                  <Card bg={cardBg} borderRadius="xl">
                    <CardHeader>
                      <Heading size="lg">
                        <Icon as={FiShield} mr={3} color="blue.500" />
                        Best Practices
                      </Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={6}>
                        <Box>
                          <Heading size="md" mb={4}>Notification Design</Heading>
                          <VStack spacing={3} align="stretch">
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Keep titles under 50 characters for better visibility</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Use action-oriented language in your body text</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Include relevant icons (192x192px minimum)</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Always provide a landing URL for click actions</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Use tags to replace outdated notifications</Text>
                            </HStack>
                          </VStack>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>Permission Requests</Heading>
                          <VStack spacing={3} align="stretch">
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Explain the value before requesting permission</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Use soft prompts before the browser prompt</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Respect user choices - don't repeatedly ask</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Provide easy unsubscribe options</Text>
                            </HStack>
                          </VStack>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>Timing & Frequency</Heading>
                          <VStack spacing={3} align="stretch">
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Respect user timezones - avoid late night notifications</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Limit frequency to maintain engagement (max 2-3 per day)</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Batch related notifications when possible</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Set appropriate TTL values for time-sensitive content</Text>
                            </HStack>
                          </VStack>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>Performance Tips</Heading>
                          <VStack spacing={3} align="stretch">
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Batch notifications when sending to multiple users</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Implement retry logic for failed sends</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Clean up expired subscriptions regularly</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Monitor delivery rates and adjust strategies</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiCheck} color="green.500" mr={2} />
                              <Text>Use notification analytics to optimize engagement</Text>
                            </HStack>
                          </VStack>
                        </Box>

                        <Box>
                          <Heading size="md" mb={4}>Troubleshooting Common Issues</Heading>
                          <VStack spacing={3} align="stretch">
                            <HStack>
                              <Text><strong>401 Unauthorized:</strong> Ensure you're using a valid JWT token in the Authorization header</Text>
                            </HStack>
                            <HStack>
                              <Text><strong>400 Missing VAPID keys:</strong> Generate VAPID keys using the dashboard or API endpoint</Text>
                            </HStack>
                            <HStack>
                              <Text><strong>No notifications received:</strong> Check browser permissions, service worker registration, and subscription status</Text>
                            </HStack>
                            <HStack>
                              <Text><strong>Service worker not found:</strong> Ensure pn-sw.js is at your site root and accessible</Text>
                            </HStack>
                            <HStack>
                              <Text><strong>CORS errors:</strong> Configure proper CORS headers on your server</Text>
                            </HStack>
                          </VStack>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} borderRadius="xl" borderWidth={2} borderColor="blue.500">
                    <CardBody>
                      <Flex align="center" justify="space-between">
                        <Box>
                          <Heading size="md" mb={2}>Need Help?</Heading>
                          <Text>Our support team is here to help you integrate and optimize your push notifications.</Text>
                        </Box>
                        <Button colorScheme="blue" size="lg" rightIcon={<FiExternalLink />}>
                          Contact Support
                        </Button>
                      </Flex>
                    </CardBody>
                  </Card>
                </VStack>
              )}
            </VStack>
          </GridItem>
        </Grid>
      </Container>
    </Layout>
  )
}