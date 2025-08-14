import { useState } from 'react'
import { Box, Button, Container, Heading, Input, Text } from '@chakra-ui/react'
import Layout from '../components/Layout.jsx'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit() {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) throw new Error((await res.json()).error || res.statusText)
      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      navigate('/app')
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
    <Container maxW="md" py={12}>
      <Box bg="white" borderRadius="xl" p={8} boxShadow="md" border="1px solid #e2e8f0">
        <Heading size="lg" mb={6}>Sign In</Heading>
        <Box mb={4}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Email</label>
          <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
        </Box>
        <Box mb={6}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Password</label>
          <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" />
        </Box>
        <Button colorScheme="blue" onClick={submit} isLoading={loading}>Sign In</Button>
        <Text mt={4} color="gray.600">Default admin: admin@example.com / ChangeMe!234</Text>
      </Box>
    </Container>
    </Layout>
  )
}

