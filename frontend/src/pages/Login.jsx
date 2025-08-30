import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Input } from '../components/ui'
import { Bell, Mail, Lock, Eye, EyeOff, ArrowRight, User, Shield } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!form.password || form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      // Store token and role
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      
      // Redirect based on role
      if (data.role === 'admin') {
        navigate('/admin-dashboard')
      } else {
        navigate('/app')
      }
    } catch (error) {
      setErrors({ general: error.message })
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

  const handleDemoLogin = () => {
    setForm({
      email: 'demo@example.com',
      password: 'demo123'
    })
    setErrors({})
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
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </nav>

      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Login Form */}
            <div>
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-flex p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                  <p className="text-gray-600">Sign in to your NotifyPro account</p>
                </div>

                {errors.general && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-800 text-sm">{errors.general}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    error={errors.email}
                    leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
                  />

                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      error={errors.password}
                      leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-2" />
                      <span className="text-gray-600">Remember me</span>
                    </label>
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                      Forgot password?
                    </a>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    loading={isLoading}
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Sign In
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <Shield className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-blue-900">Try Demo Account</h3>
                    </div>
                    <p className="text-blue-700 text-sm mb-3">
                      Use our demo account to explore all features:
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-mono text-blue-800">demo@example.com</div>
                        <div className="font-mono text-blue-800">demo123</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDemoLogin}
                        className="border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        Use Demo
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700">
                      Create one now
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Features */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome to NotifyPro
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  The most developer-friendly push notification service
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Smart Dashboard</h3>
                    <p className="text-gray-600 mt-1">
                      Monitor your campaigns, track analytics, and manage subscribers all in one place
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Instant Integration</h3>
                    <p className="text-gray-600 mt-1">
                      Get your API keys and start sending notifications in under 5 minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Enterprise Ready</h3>
                    <p className="text-gray-600 mt-1">
                      Built with security and scalability in mind from day one
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-3">Ready to get started?</h3>
                <p className="mb-4 opacity-90">
                  Join thousands of developers who trust NotifyPro for their push notifications.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center bg-white/20 hover:bg-white/30 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}