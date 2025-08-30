import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Card, CardBody, Input, Alert } from '../components/ui'
import { Bell, User, Mail, Lock, Briefcase, Globe, Zap, Shield } from 'lucide-react'
import Layout from '../components/Layout.jsx'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

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
    
    if (!validateForm()) return
    
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
      
      // Redirect to dashboard
      navigate('/app')
    } catch (error) {
      alert(error.message)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NotifyPro</h1>
                <p className="text-xs text-gray-500 -mt-1">Push Notifications</p>
              </div>
            </Link>
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </nav>

      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Registration Form */}
            <div>
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-flex p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
                    <Bell className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
                  <p className="text-gray-600">Start sending push notifications in minutes</p>
                </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Your Name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      error={errors.name}
                    />

                    <Input
                      label="Company Name"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      placeholder="Acme Inc."
                      error={errors.companyName}
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      error={errors.email}
                    />

                    <Input
                      label="Password"
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      error={errors.password}
                    />

                    <Input
                      label="Confirm Password"
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      error={errors.confirmPassword}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      loading={isLoading}
                    >
                      Create Account
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

            {/* Right Side - Features */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Why Choose NotifyPro?
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  Join thousands of businesses worldwide using our push notification service
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800">Free Plan Included</h3>
                </div>
                <p className="text-green-700">Start with 1,000 free subscribers. No credit card required.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Global Reach</h3>
                    <p className="text-gray-600 mt-1">
                      Reliable delivery across all major browsers and devices worldwide
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Lightning Fast Setup</h3>
                    <p className="text-gray-600 mt-1">
                      VAPID keys generated automatically. Start sending notifications in under 5 minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Enterprise Security</h3>
                    <p className="text-gray-600 mt-1">
                      VAPID authentication, HTTPS encryption, and SOC 2 compliance
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}