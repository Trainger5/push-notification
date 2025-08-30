import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Bell, 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  Globe,
  Check,
  Star,
  ArrowRight,
  Play,
  Menu,
  X,
  MessageSquare,
  Target,
  Smartphone,
  Monitor,
  Activity,
  Rocket,
  Code,
  Heart,
  Send,
  User,
  Mail,
  Key
} from 'lucide-react'
import { Button, Badge } from '../components/ui'

const ModernLanding = () => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "TechStartup",
      role: "CTO",
      content: "NotifyPro increased our user engagement by 300%. The setup was incredibly easy and the analytics are fantastic.",
      rating: 5,
      avatar: <User className="w-8 h-8 text-blue-600" />
    },
    {
      name: "Mike Chen",
      company: "E-commerce Plus",
      role: "Marketing Director",
      content: "The campaign builder and A/B testing features helped us optimize our conversion rates significantly.",
      rating: 5,
      avatar: <Monitor className="w-8 h-8 text-purple-600" />
    },
    {
      name: "Emma Rodriguez",
      company: "NewsApp",
      role: "Product Manager",
      content: "Real-time notifications with perfect delivery rates. Our users love the timely updates.",
      rating: 5,
      avatar: <Rocket className="w-8 h-8 text-green-600" />
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    window.location.reload()
  }

  const goToDashboard = () => {
    if (role === 'admin') {
      navigate('/admin-dashboard')
    } else {
      navigate('/app')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NotifyPro</h1>
                <p className="text-xs text-gray-500 -mt-1">Push Notifications</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Pricing</a>
              <Link to="/docs" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Docs</Link>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {token ? (
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="secondary" 
                    onClick={goToDashboard}
                    className="flex items-center space-x-2"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Button>
                  <Button variant="outline" onClick={logout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                  >
                    Sign In
                  </button>
                  <Button 
                    variant="primary"
                    onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Get Started Free
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-blue-600"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-blue-600">Features</a>
                <a href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-blue-600">Pricing</a>
                <Link to="/docs" className="block px-3 py-2 text-gray-600 hover:text-blue-600">Docs</Link>
                <a href="#contact" className="block px-3 py-2 text-gray-600 hover:text-blue-600">Contact</a>
                {token ? (
                  <div className="pt-2 border-t border-gray-200">
                    <button onClick={goToDashboard} className="block w-full text-left px-3 py-2 text-blue-600 font-medium">
                      Dashboard
                    </button>
                    <button onClick={logout} className="block w-full text-left px-3 py-2 text-gray-600">
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-gray-200">
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false)
                        document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="block w-full text-left px-3 py-2 text-blue-600 font-medium"
                    >
                      Get Started Free
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200 mb-6">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Trusted by 10,000+ developers</span>
              <Badge variant="success" className="text-xs">New</Badge>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              <span className="block">Push Notifications</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Engage your users with powerful, real-time push notifications. 
              Easy integration, advanced targeting, and detailed analytics.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 w-full sm:w-auto"
                onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Rocket className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-4 w-full sm:w-auto"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-gray-900">99.9%</div>
                <div className="text-gray-600">Delivery Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">&lt;100ms</div>
                <div className="text-gray-600">Response Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">10M+</div>
                <div className="text-gray-600">Notifications Sent</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">24/7</div>
                <div className="text-gray-600">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Engage Users
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you create, send, and optimize push notifications that drive results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: Zap,
                title: "Lightning Fast Setup",
                description: "Get started in minutes with our simple SDK. No complex configuration required.",
                color: "text-yellow-500"
              },
              {
                icon: Target,
                title: "Advanced Targeting",
                description: "Segment users by behavior, location, device, and custom properties for precise targeting.",
                color: "text-red-500"
              },
              {
                icon: BarChart3,
                title: "Real-time Analytics",
                description: "Track delivery rates, click rates, and conversions with detailed analytics dashboard.",
                color: "text-blue-500"
              },
              {
                icon: MessageSquare,
                title: "Rich Notifications",
                description: "Send notifications with images, actions, and custom data for enhanced engagement.",
                color: "text-green-500"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "VAPID authentication, HTTPS encryption, and SOC 2 compliance for maximum security.",
                color: "text-purple-500"
              },
              {
                icon: Globe,
                title: "Global Delivery",
                description: "Reliable delivery across all major browsers and devices worldwide.",
                color: "text-indigo-500"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:bg-gray-100 transition-colors group">
                <div className={`inline-flex p-3 rounded-xl bg-white shadow-sm mb-4 group-hover:shadow-md transition-shadow`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browser Support */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-8">
            Works Across All Major Browsers
          </h3>
          <div className="flex justify-center items-center space-x-12 opacity-70">
            <Monitor className="w-12 h-12" />
            <Globe className="w-12 h-12" />
            <Smartphone className="w-12 h-12" />
            <Activity className="w-12 h-12" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Loved by Thousands of Developers
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying about NotifyPro
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 sm:p-12">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-xl sm:text-2xl text-gray-700 italic mb-6">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                </div>
                <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</div>
                <div className="text-gray-600">{testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}</div>
              </div>
            </div>
            
            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                description: "Perfect for getting started",
                features: [
                  "1,000 notifications/month",
                  "Basic analytics",
                  "Email support",
                  "All browser support"
                ],
                cta: "Start Free",
                popular: false
              },
              {
                name: "Pro",
                price: "$29",
                period: "per month",
                description: "For growing businesses",
                features: [
                  "50,000 notifications/month",
                  "Advanced analytics",
                  "A/B testing",
                  "Segmentation",
                  "Priority support",
                  "Custom branding"
                ],
                cta: "Start Free Trial",
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "pricing",
                description: "For large organizations",
                features: [
                  "Unlimited notifications",
                  "Advanced targeting",
                  "Custom integrations",
                  "Dedicated support",
                  "SLA guarantees",
                  "On-premise option"
                ],
                cta: "Contact Sales",
                popular: false
              }
            ].map((plan, index) => (
              <div 
                key={index} 
                className={`relative bg-white rounded-2xl p-8 shadow-sm ${
                  plan.popular ? 'ring-2 ring-blue-600 shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                      : ''
                  }`}
                  variant={plan.popular ? 'primary' : 'outline'}
                  onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section id="login-section" className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 sm:p-12 shadow-2xl">
            <div className="mb-8">
              <div className="inline-flex p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-600">
                Join thousands of developers using NotifyPro to engage their users.
              </p>
            </div>

            {!token ? (
              <div className="bg-gray-50 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Demo Access</h3>
                <p className="text-gray-600 mb-6">
                  Try our demo with sample data to see all features in action:
                </p>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 text-left">
                    <div className="font-medium text-gray-900">Demo Customer Account</div>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-mono">demo@example.com</span>
                      </div>
                      <div className="flex items-center">
                        <Key className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-mono">demo123</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => navigate('/app')}
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Try Demo Dashboard
                  </Button>
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Want to create your own account? <Link to="/register" className="text-blue-600 hover:underline">Sign up here</Link>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Welcome back!</h3>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={goToDashboard}
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">NotifyPro</h3>
                  <p className="text-gray-400 text-sm">Push Notifications Made Simple</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The most developer-friendly push notification service. 
                Get started in minutes and scale to millions of users.
              </p>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="text-gray-400">Made with love for developers</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NotifyPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ModernLanding