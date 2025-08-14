import { Box, Button, Container, Grid, GridItem, Heading, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import Layout from '../components/Layout.jsx'

export default function Home() {
  return (
    <Layout>
      <Container maxW="6xl" py={12}>
        <Box bg="white" borderRadius="2xl" p={{ base: 8, md: 14 }} textAlign="center" boxShadow="xl">
          <Heading as="h1" size="xl" mb={4}>Add Push Notifications in minutes</Heading>
          <Text color="gray.600" mb={8}>Auto-generated VAPID, customer API keys, and a modern dashboard to manage subscribers and send notifications.</Text>
          <Button as={RouterLink} to="/docs" colorScheme="blue" mr={3}>Get Started</Button>
          <Button as={RouterLink} to="/login" variant="outline">Sign In</Button>
        </Box>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6} mt={10}>
          <GridItem><Card title="Create Customer" desc="Admin generates a customer account and API key." /></GridItem>
          <GridItem><Card title="Add SDK" desc="Paste a small script and stub service worker on your site." /></GridItem>
          <GridItem><Card title="Send" desc="Use the dashboard to broadcast notifications to your subscribers." /></GridItem>
        </Grid>
      </Container>
    </Layout>
  )
}

function Card({ title, desc }) {
  return (
    <Box bg="white" borderRadius="xl" p={6} boxShadow="md" border="1px solid #e2e8f0">
      <Heading as="h3" size="md" mb={2}>{title}</Heading>
      <Text color="gray.600">{desc}</Text>
    </Box>
  )
}

