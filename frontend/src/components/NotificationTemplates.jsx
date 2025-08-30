import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Input,
  Textarea,
  Switch,
  Badge,
  IconButton,
  useDisclosure,
  Flex,
  Tag,
  SimpleGrid,
  Wrap,
  WrapItem,
  Icon
} from '@chakra-ui/react'
import { Alert } from '@chakra-ui/alert'
import { Card, CardBody, CardHeader } from '@chakra-ui/card'
import { useToast } from '@chakra-ui/toast'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/tabs'
import {
  FormControl,
  FormLabel,
  FormErrorMessage
} from '@chakra-ui/form-control'
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiCopy, 
  FiSend, 
  FiMoreVertical, 
  FiSearch,
  FiTag,
  FiClock,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiFilter
} from 'react-icons/fi'

// CSS for spinner animation and modals
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    .menu-container {
      position: relative;
      display: inline-block;
    }
    .menu-list {
      position: absolute;
      right: 0;
      top: 100%;
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 100;
      min-width: 160px;
    }
    .menu-item {
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2D3748;
      font-size: 14px;
    }
    .menu-item:hover {
      background: #F7FAFC;
    }
  `
  document.head.appendChild(style)
}

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const VariableTag = ({ variable, onRemove }) => (
  <Tag size="sm" colorScheme="blue" borderRadius="full">
    {variable}
    <Box ml={1} cursor="pointer" onClick={() => onRemove(variable)}>×</Box>
  </Tag>
)

const TemplateCard = ({ template, onEdit, onDelete, onDuplicate, onUse, onView }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  return (
    <Card 
      bg={cardBg} 
      borderRadius="xl" 
      borderWidth={1} 
      borderColor={template.isActive ? borderColor : 'gray.400'}
      opacity={template.isActive ? 1 : 0.7}
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
    >
      <CardBody>
        <Flex justify="space-between" align="start" mb={3}>
          <Box flex={1}>
            <HStack mb={2}>
              <Heading size="sm" noOfLines={1}>{template.name}</Heading>
              {!template.isActive && <Badge colorScheme="gray" size="sm">Inactive</Badge>}
            </HStack>
            
            {template.description && (
              <Text fontSize="sm" color="gray.600" noOfLines={2} mb={2}>
                {template.description}
              </Text>
            )}
            
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" fontWeight="medium" color="gray.500">
                Title: <Text as="span" color="gray.700">{template.title}</Text>
              </Text>
              <Text fontSize="xs" color="gray.600" noOfLines={2}>
                {template.body}
              </Text>
            </VStack>
            
            <HStack mt={3} spacing={2} flexWrap="wrap">
              <Badge colorScheme="purple" size="sm">{template.category}</Badge>
              {template.variables && template.variables.length > 0 && (
                <Badge colorScheme="blue" size="sm">{template.variables.length} variables</Badge>
              )}
              <Badge colorScheme="gray" size="sm">Used {template.usageCount || 0} times</Badge>
            </HStack>
          </Box>
          
          <div className="menu-container">
            <IconButton
              icon={<Icon as={FiMoreVertical} />}
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                const menu = e.target.closest('.menu-container').querySelector('.menu-list')
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block'
              }}
            />
            <div className="menu-list" style={{display: 'none'}}>
              <div className="menu-item" onClick={() => onView(template)}>
                <Icon as={FiEye} /> View Details
              </div>
              <div className="menu-item" onClick={() => onUse(template)}>
                <Icon as={FiSend} /> Use Template
              </div>
              <div className="menu-item" onClick={() => onEdit(template)}>
                <Icon as={FiEdit} /> Edit
              </div>
              <div className="menu-item" onClick={() => onDuplicate(template)}>
                <Icon as={FiCopy} /> Duplicate
              </div>
              <div style={{borderTop: '1px solid #E2E8F0', margin: '4px 0'}}></div>
              <div className="menu-item" style={{color: '#E53E3E'}} onClick={() => onDelete(template)}>
                <Icon as={FiTrash2} /> Delete
              </div>
            </div>
          </div>
        </Flex>
      </CardBody>
    </Card>
  )
}

const TemplatePreview = ({ template, variables, onVariableChange }) => {
  const processTemplate = (text, vars) => {
    let processed = text;
    if (template.variables) {
      template.variables.forEach(varName => {
        const value = vars[varName] || `{{${varName}}}`;
        processed = processed.replace(new RegExp(`{{${varName}}}`, 'g'), value);
      });
    }
    return processed;
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2}>Preview</Text>
        <Box p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
          <HStack spacing={3} align="start">
            <Box w={10} h={10} bg="blue.500" borderRadius="md" flexShrink={0} />
            <VStack align="start" spacing={1} flex={1}>
              <Text fontWeight="bold" fontSize="sm">
                {processTemplate(template.title, variables)}
              </Text>
              <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">
                {processTemplate(template.body, variables)}
              </Text>
              {template.url && (
                <Text fontSize="xs" color="blue.500">
                  {processTemplate(template.url, variables)}
                </Text>
              )}
            </VStack>
          </HStack>
        </Box>
      </Box>

      {template.variables && template.variables.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>Variables</Text>
          <VStack spacing={2} align="stretch">
            {template.variables.map(varName => (
              <FormControl key={varName}>
                <FormLabel fontSize="sm">{varName}</FormLabel>
                <Input
                  size="sm"
                  value={variables[varName] || ''}
                  onChange={(e) => onVariableChange(varName, e.target.value)}
                  placeholder={`Enter ${varName}`}
                />
              </FormControl>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  )
}

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [viewingTemplate, setViewingTemplate] = useState(null)
  const [usingTemplate, setUsingTemplate] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const { isOpen: isUseOpen, onOpen: onUseOpen, onClose: onUseClose } = useDisclosure()
  
  const toast = useToast()
  const headers = useAuthHeaders()
  const cardBg = useColorModeValue('white', 'gray.800')

  const [form, setForm] = useState({
    name: '',
    description: '',
    title: '',
    body: '',
    url: '',
    icon: '',
    badge: '',
    image: '',
    tag: '',
    category: 'general',
    variables: [],
    isActive: true
  })

  const [useForm, setUseForm] = useState({
    variables: {},
    scheduledFor: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  const [newVariable, setNewVariable] = useState('')
  const [errors, setErrors] = useState({})

  const getApiUrl = (endpoint) => 'http://localhost:4000' + endpoint;

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      if (searchTerm) params.append('search', searchTerm)
      if (!showInactive) params.append('active', 'true')

      const response = await fetch(getApiUrl(`/api/templates/list?${params}`), { headers })
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const data = await response.json()
      setTemplates(data.templates)
      setCategories(data.categories)
    } catch (error) {
      console.error('Failed to fetch templates:', error)
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory, showInactive])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchTerm !== '') {
        fetchTemplates()
      }
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm])

  const validateForm = () => {
    const newErrors = {}
    
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.title.trim()) newErrors.title = 'Title is required'
    if (!form.body.trim()) newErrors.body = 'Body is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      title: '',
      body: '',
      url: '',
      icon: '',
      badge: '',
      image: '',
      tag: '',
      category: 'general',
      variables: [],
      isActive: true
    })
    setEditingTemplate(null)
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const url = editingTemplate 
        ? getApiUrl(`/api/templates/${editingTemplate._id}`)
        : getApiUrl('/api/templates/create')
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save template')
      }

      toast({
        title: 'Success',
        description: editingTemplate 
          ? 'Template updated successfully' 
          : 'Template created successfully',
        status: 'success',
        duration: 3000,
      })

      resetForm()
      onFormClose()
      fetchTemplates()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setForm({
      name: template.name,
      description: template.description || '',
      title: template.title,
      body: template.body,
      url: template.url || '',
      icon: template.icon || '',
      badge: template.badge || '',
      image: template.image || '',
      tag: template.tag || '',
      category: template.category || 'general',
      variables: template.variables || [],
      isActive: template.isActive !== false
    })
    onFormOpen()
  }

  const handleDelete = async (template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return

    try {
      const response = await fetch(getApiUrl(`/api/templates/${template._id}`), {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete template')
      }

      toast({
        title: 'Success',
        description: 'Template deleted successfully',
        status: 'success',
        duration: 3000,
      })

      fetchTemplates()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleDuplicate = async (template) => {
    try {
      const response = await fetch(getApiUrl(`/api/templates/${template._id}/duplicate`), {
        method: 'POST',
        headers
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to duplicate template')
      }

      toast({
        title: 'Success',
        description: 'Template duplicated successfully',
        status: 'success',
        duration: 3000,
      })

      fetchTemplates()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }
  }

  const handleUse = (template) => {
    setUsingTemplate(template)
    setUseForm({
      variables: {},
      scheduledFor: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    onUseOpen()
  }

  const handleSendTemplate = async (scheduled = false) => {
    try {
      setSubmitting(true)
      
      const payload = {
        variables: useForm.variables
      }
      
      if (scheduled && useForm.scheduledFor) {
        payload.scheduledFor = new Date(useForm.scheduledFor).toISOString()
        payload.timezone = useForm.timezone
      }

      const response = await fetch(getApiUrl(`/api/templates/${usingTemplate._id}/send`), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send notification')
      }

      const data = await response.json()
      
      toast({
        title: 'Success',
        description: scheduled 
          ? 'Notification scheduled successfully using template' 
          : `Notification sent successfully! Sent: ${data.sent}, Failed: ${data.failed}`,
        status: 'success',
        duration: 5000,
      })

      onUseClose()
      fetchTemplates() // Refresh to update usage counts
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const addVariable = () => {
    if (newVariable.trim() && !form.variables.includes(newVariable.trim())) {
      setForm(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable.trim()]
      }))
      setNewVariable('')
    }
  }

  const removeVariable = (varToRemove) => {
    setForm(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== varToRemove)
    }))
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <div style={{width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTop: '3px solid #3182CE', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
      </Flex>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg">Notification Templates</Heading>
          <Text color="gray.600">Create reusable notification templates with variables</Text>
        </Box>
        <HStack spacing={3}>
          <Button leftIcon={<Icon as={FiRefreshCw} />} variant="ghost" onClick={fetchTemplates}>
            Refresh
          </Button>
          <Button leftIcon={<Icon as={FiPlus} />} colorScheme="blue" onClick={() => { resetForm(); onFormOpen(); }}>
            Create Template
          </Button>
        </HStack>
      </Flex>

      {/* Filters */}
      <Card bg={cardBg} borderRadius="xl">
        <CardBody>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4} alignItems="end">
            <div>
              <label style={{fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block'}}>Search</label>
              <div style={{position: 'relative'}}>
                <Icon as={FiSearch} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0'}} />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{paddingLeft: '40px'}}
                />
              </div>
            </div>
            
            <div>
              <label style={{fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block'}}>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: 'white', width: '100%'}}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block'}}>Status</label>
              <HStack>
                <Switch
                  isChecked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
                <Text fontSize="sm">Show Inactive</Text>
              </HStack>
            </div>
            
            <Button leftIcon={<Icon as={FiFilter} />} variant="outline" onClick={() => {
              setSearchTerm('')
              setSelectedCategory('')
              setShowInactive(false)
            }}>
              Clear Filters
            </Button>
          </Grid>
        </CardBody>
      </Card>

      {/* Templates Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {templates.map((template) => (
          <TemplateCard
            key={template._id}
            template={template}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onUse={handleUse}
            onView={(template) => {
              setViewingTemplate(template)
              onViewOpen()
            }}
          />
        ))}
      </SimpleGrid>

      {templates.length === 0 && (
        <Alert status="info" borderRadius="md">
          {searchTerm || selectedCategory 
            ? 'No templates found matching your criteria.' 
            : 'No templates found. Create your first template to get started!'
          }
        </Alert>
      )}

      {/* Create/Edit Template Modal */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={onFormClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
          <Heading size="lg" mb={4}>
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </Heading>
          <form onSubmit={handleSubmit}>
            <div>
              <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
                <VStack spacing={4} align="stretch">
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <FormControl isInvalid={!!errors.name}>
                      <FormLabel>Template Name</FormLabel>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="My Template"
                      />
                      <FormErrorMessage>{errors.name}</FormErrorMessage>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Category</FormLabel>
                      <Input
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        placeholder="general"
                      />
                    </FormControl>
                  </Grid>

                  <FormControl>
                    <FormLabel>Description (Optional)</FormLabel>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Template description..."
                      rows={2}
                    />
                  </FormControl>

                  <FormControl isInvalid={!!errors.title}>
                    <FormLabel>Notification Title</FormLabel>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Hello {{userName}}!"
                    />
                    <FormErrorMessage>{errors.title}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.body}>
                    <FormLabel>Notification Body</FormLabel>
                    <Textarea
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      placeholder="Welcome {{userName}}, check out {{productName}}!"
                      rows={3}
                    />
                    <FormErrorMessage>{errors.body}</FormErrorMessage>
                  </FormControl>

                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <FormControl>
                      <FormLabel>Landing URL</FormLabel>
                      <Input
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                        placeholder="https://example.com/{{productId}}"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Tag</FormLabel>
                      <Input
                        value={form.tag}
                        onChange={(e) => setForm({ ...form, tag: e.target.value })}
                        placeholder="promotion"
                      />
                    </FormControl>
                  </Grid>

                  <FormControl>
                    <FormLabel>Variables</FormLabel>
                    <HStack>
                      <Input
                        value={newVariable}
                        onChange={(e) => setNewVariable(e.target.value)}
                        placeholder="userName, productName, etc."
                        onKeyPress={(e) => e.key === 'Enter' && addVariable()}
                      />
                      <Button onClick={addVariable} size="sm">Add</Button>
                    </HStack>
                    <Wrap mt={2}>
                      {form.variables.map((variable) => (
                        <WrapItem key={variable}>
                          <VariableTag variable={variable} onRemove={removeVariable} />
                        </WrapItem>
                      ))}
                    </Wrap>
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="is-active" mb="0">
                      Active Template
                    </FormLabel>
                    <Switch
                      id="is-active"
                      isChecked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                  </FormControl>
                </VStack>

                <VStack spacing={4} align="stretch">
                  <TemplatePreview 
                    template={form} 
                    variables={{}}
                    onVariableChange={() => {}}
                  />
                </VStack>
              </Grid>
            </div>

            <HStack justify="flex-end" mt={6}>
              <Button variant="ghost" mr={3} onClick={onFormClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                colorScheme="blue" 
                isLoading={submitting}
                loadingText={editingTemplate ? "Updating..." : "Creating..."}
              >
                {editingTemplate ? 'Update' : 'Create'}
              </Button>
            </HStack>
          </form>
          </div>
        </div>
      )}

      {/* Use Template Modal */}
      {isUseOpen && (
        <div className="modal-overlay" onClick={onUseClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
          <Heading size="lg" mb={4}>Use Template: {usingTemplate?.name}</Heading>
          <div>
            {usingTemplate && (
              <TemplatePreview
                template={usingTemplate}
                variables={useForm.variables}
                onVariableChange={(varName, value) =>
                  setUseForm(prev => ({
                    ...prev,
                    variables: { ...prev.variables, [varName]: value }
                  }))
                }
              />
            )}
            
            <Box mt={6}>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Schedule Options</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Schedule Time (Optional)</FormLabel>
                  <Input
                    type="datetime-local"
                    size="sm"
                    value={useForm.scheduledFor}
                    onChange={(e) => setUseForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Timezone</FormLabel>
                  <select
                    value={useForm.timezone}
                    onChange={(e) => setUseForm(prev => ({ ...prev, timezone: e.target.value }))}
                    style={{padding: '6px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: 'white', fontSize: '14px'}}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </FormControl>
              </Grid>
            </Box>
          </div>

          <HStack justify="flex-end" mt={6}>
            <Button variant="ghost" mr={3} onClick={onUseClose}>
              Cancel
            </Button>
            {useForm.scheduledFor ? (
              <Button 
                colorScheme="purple" 
                isLoading={submitting}
                loadingText="Scheduling..."
                onClick={() => handleSendTemplate(true)}
              >
                Schedule
              </Button>
            ) : (
              <Button 
                colorScheme="blue" 
                isLoading={submitting}
                loadingText="Sending..."
                onClick={() => handleSendTemplate(false)}
              >
                Send Now
              </Button>
            )}
          </HStack>
          </div>
        </div>
      )}

      {/* View Template Modal */}
      {isViewOpen && (
        <div className="modal-overlay" onClick={onViewClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
          <Heading size="lg" mb={4}>Template Details</Heading>
          <div>
            {viewingTemplate && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">Name</Text>
                  <Text>{viewingTemplate.name}</Text>
                </Box>
                
                {viewingTemplate.description && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.500">Description</Text>
                    <Text>{viewingTemplate.description}</Text>
                  </Box>
                )}
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">Category</Text>
                  <Badge colorScheme="purple">{viewingTemplate.category}</Badge>
                </Box>
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">Usage Count</Text>
                  <Text>{viewingTemplate.usageCount || 0} times</Text>
                </Box>
                
                {viewingTemplate.variables && viewingTemplate.variables.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.500">Variables</Text>
                    <Wrap>
                      {viewingTemplate.variables.map(variable => (
                        <WrapItem key={variable}>
                          <Tag size="sm" colorScheme="blue">{variable}</Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                )}
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">Preview</Text>
                  <Box p={4} bg="gray.50" borderRadius="lg">
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold">{viewingTemplate.title}</Text>
                      <Text fontSize="sm" whiteSpace="pre-wrap">{viewingTemplate.body}</Text>
                      {viewingTemplate.url && (
                        <Text fontSize="xs" color="blue.500">{viewingTemplate.url}</Text>
                      )}
                    </VStack>
                  </Box>
                </Box>
              </VStack>
            )}
          </div>
          <HStack justify="flex-end" mt={6}>
            <Button onClick={onViewClose}>Close</Button>
          </HStack>
          </div>
        </div>
      )}
    </VStack>
  )
}