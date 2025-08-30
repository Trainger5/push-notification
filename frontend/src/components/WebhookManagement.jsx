import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Input,
  Textarea,
  CheckboxGroup,
  Checkbox,
  Switch,
  useDisclosure,
  Icon,
  IconButton,
  Code
} from '@chakra-ui/react';
import { Card, CardBody, CardHeader } from '@chakra-ui/card';
import { useToast } from '@chakra-ui/toast';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/modal';
import { Spinner } from '@chakra-ui/spinner';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/menu';
import { Alert, AlertDescription } from '@chakra-ui/alert';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/table';
import {
  FormControl,
  FormLabel
} from '@chakra-ui/form-control';
import {
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/stat';
import { 
  FiCode, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiPlay, 
  FiMoreVertical, 
  FiCheck, 
  FiX, 
  FiClock,
  FiActivity,
  FiEye
} from 'react-icons/fi';

const WebhookManagement = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeliveriesOpen, onOpen: onDeliveriesOpen, onClose: onDeliveriesClose } = useDisclosure();
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [],
    description: '',
    secret: ''
  });
  
  const toast = useToast();

  const availableEvents = [
    { value: 'notification.sent', label: 'Notification Sent', description: 'Triggered when a notification is successfully sent' },
    { value: 'subscription.created', label: 'Subscription Created', description: 'Triggered when a new user subscribes' },
    { value: 'subscription.deleted', label: 'Subscription Deleted', description: 'Triggered when a user unsubscribes' },
    { value: 'notification.scheduled', label: 'Notification Scheduled', description: 'Triggered when a notification is scheduled' },
    { value: 'segment.created', label: 'Segment Created', description: 'Triggered when a new segment is created' },
    { value: 'template.used', label: 'Template Used', description: 'Triggered when a template is used for sending' }
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const getApiUrl = (endpoint) => 'http://localhost:4000' + endpoint;

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/webhooks/list'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setWebhooks(data.webhooks);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async (webhookId) => {
    setDeliveriesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${webhookId}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setDeliveries(data.deliveries);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/webhooks/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message,
          status: 'success',
          duration: 3000
        });
        fetchWebhooks();
        resetForm();
        onCreateClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleUpdateWebhook = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${selectedWebhook._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message,
          status: 'success',
          duration: 3000
        });
        fetchWebhooks();
        resetForm();
        onEditClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
    if (!window.confirm('Are you sure you want to delete this webhook?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message,
          status: 'success',
          duration: 3000
        });
        fetchWebhooks();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleTestWebhook = async (webhookId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: data.success ? 'Success' : 'Failed',
          description: data.message,
          status: data.success ? 'success' : 'error',
          duration: 3000
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      events: [],
      description: '',
      secret: ''
    });
    setSelectedWebhook(null);
  };

  const openEditModal = (webhook) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      description: webhook.description || '',
      secret: '' // Don't populate secret for security
    });
    onEditOpen();
  };

  const openDeliveriesModal = (webhook) => {
    setSelectedWebhook(webhook);
    fetchDeliveries(webhook._id);
    onDeliveriesOpen();
  };

  const generateSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setFormData(prev => ({ ...prev, secret }));
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold">Webhook Management</Text>
          <Text color="gray.600">Configure webhook endpoints to receive real-time events</Text>
        </Box>
        <Button leftIcon={<Icon as={FiPlus} />} colorScheme="blue" onClick={onCreateOpen}>
          Create Webhook
        </Button>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="lg" />
        </Flex>
      ) : (
        <VStack spacing={4} align="stretch">
          {webhooks.map((webhook) => (
            <Card key={webhook._id}>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Icon as={FiCode} color="blue.500" />
                    <Text fontWeight="bold">{webhook.name}</Text>
                    <Badge colorScheme={webhook.isActive ? 'green' : 'gray'}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {webhook.events.length} events
                    </Badge>
                  </HStack>
                  <Menu>
                    <MenuButton as={IconButton} icon={<Icon as={FiMoreVertical} />} variant="ghost" size="sm" />
                    <MenuList>
                      <MenuItem icon={<Icon as={FiPlay} />} onClick={() => handleTestWebhook(webhook._id)}>
                        Test Webhook
                      </MenuItem>
                      <MenuItem icon={<Icon as={FiActivity} />} onClick={() => openDeliveriesModal(webhook)}>
                        View Deliveries
                      </MenuItem>
                      <MenuItem icon={<Icon as={FiEdit} />} onClick={() => openEditModal(webhook)}>
                        Edit Webhook
                      </MenuItem>
                      <MenuItem icon={<Icon as={FiTrash2} />} onClick={() => handleDeleteWebhook(webhook._id)}>
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>Endpoint URL</Text>
                    <Code p={2} borderRadius="md" fontSize="sm">{webhook.url}</Code>
                  </Box>
                  {webhook.description && (
                    <Box>
                      <Text fontSize="sm" color="gray.600">{webhook.description}</Text>
                    </Box>
                  )}
                  <HStack spacing={6}>
                    <Stat size="sm">
                      <StatLabel>Delivered</StatLabel>
                      <StatNumber color="green.500">{webhook.deliveredCount}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Failed</StatLabel>
                      <StatNumber color="red.500">{webhook.failedCount}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Last Delivery</StatLabel>
                      <StatNumber fontSize="sm">
                        {webhook.lastDelivery ? new Date(webhook.lastDelivery).toLocaleDateString() : 'Never'}
                      </StatNumber>
                      {webhook.lastStatus && (
                        <StatHelpText>
                          <Badge colorScheme={webhook.lastStatus === 'success' ? 'green' : 'red'}>
                            {webhook.lastStatus}
                          </Badge>
                        </StatHelpText>
                      )}
                    </Stat>
                  </HStack>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>Events</Text>
                    <HStack wrap="wrap">
                      {webhook.events.map(event => (
                        <Badge key={event} variant="outline" size="sm">
                          {event}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          ))}
          {webhooks.length === 0 && (
            <Card>
              <CardBody textAlign="center" py={12}>
                <Icon as={FiCode} boxSize="48px" color="gray.400" mb={4} />
                <Text fontSize="lg" fontWeight="bold" mb={2}>No webhooks configured</Text>
                <Text color="gray.600" mb={4}>Create your first webhook to receive real-time events</Text>
                <Button leftIcon={<Icon as={FiPlus} />} colorScheme="blue" onClick={onCreateOpen}>
                  Create Your First Webhook
                </Button>
              </CardBody>
            </Card>
          )}
        </VStack>
      )}

      {/* Create Webhook Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Webhook</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Webhook Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Notification Analytics"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Endpoint URL</FormLabel>
                <Input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://your-app.com/webhooks/notifications"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this webhook is for..."
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Events to Subscribe</FormLabel>
                <CheckboxGroup
                  value={formData.events}
                  onChange={(value) => setFormData(prev => ({ ...prev, events: value }))}
                >
                  <VStack align="stretch" spacing={2}>
                    {availableEvents.map(event => (
                      <Box key={event.value} p={3} border="1px" borderColor="gray.200" borderRadius="md">
                        <Checkbox value={event.value}>
                          <VStack align="start" spacing={1} ml={2}>
                            <Text fontWeight="medium">{event.label}</Text>
                            <Text fontSize="sm" color="gray.600">{event.description}</Text>
                          </VStack>
                        </Checkbox>
                      </Box>
                    ))}
                  </VStack>
                </CheckboxGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Secret Key (Optional)</FormLabel>
                <HStack>
                  <Input
                    value={formData.secret}
                    onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                    placeholder="Leave empty to auto-generate"
                    type="password"
                  />
                  <Button onClick={generateSecret} size="sm">
                    Generate
                  </Button>
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Used to verify webhook authenticity via HMAC signature
                </Text>
              </FormControl>

              <HStack spacing={3} w="100%" justify="flex-end" pt={4}>
                <Button onClick={onCreateClose}>Cancel</Button>
                <Button colorScheme="blue" onClick={handleCreateWebhook}>
                  Create Webhook
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Webhook Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Webhook</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Webhook Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Notification Analytics"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Endpoint URL</FormLabel>
                <Input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://your-app.com/webhooks/notifications"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this webhook is for..."
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Events to Subscribe</FormLabel>
                <CheckboxGroup
                  value={formData.events}
                  onChange={(value) => setFormData(prev => ({ ...prev, events: value }))}
                >
                  <VStack align="stretch" spacing={2}>
                    {availableEvents.map(event => (
                      <Box key={event.value} p={3} border="1px" borderColor="gray.200" borderRadius="md">
                        <Checkbox value={event.value}>
                          <VStack align="start" spacing={1} ml={2}>
                            <Text fontWeight="medium">{event.label}</Text>
                            <Text fontSize="sm" color="gray.600">{event.description}</Text>
                          </VStack>
                        </Checkbox>
                      </Box>
                    ))}
                  </VStack>
                </CheckboxGroup>
              </FormControl>

              <HStack spacing={3} w="100%" justify="flex-end" pt={4}>
                <Button onClick={onEditClose}>Cancel</Button>
                <Button colorScheme="blue" onClick={handleUpdateWebhook}>
                  Update Webhook
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Deliveries Modal */}
      <Modal isOpen={isDeliveriesOpen} onClose={onDeliveriesClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Webhook Deliveries: {selectedWebhook?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {deliveriesLoading ? (
              <Flex justify="center" align="center" height="200px">
                <Spinner size="lg" />
              </Flex>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Event</Th>
                    <Th>Status</Th>
                    <Th>Response</Th>
                    <Th>Delivered At</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {deliveries.map((delivery) => (
                    <Tr key={delivery._id}>
                      <Td>
                        <Badge variant="outline">{delivery.event}</Badge>
                      </Td>
                      <Td>
                        <HStack>
                          <Icon 
                            as={delivery.success ? FiCheck : FiX} 
                            color={delivery.success ? 'green.500' : 'red.500'} 
                          />
                          <Text>{delivery.status}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" noOfLines={2}>
                          {delivery.response.substring(0, 100)}
                          {delivery.response.length > 100 ? '...' : ''}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(delivery.deliveredAt).toLocaleString()}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
            {deliveries.length === 0 && !deliveriesLoading && (
              <Text textAlign="center" py={8} color="gray.500">
                No deliveries found for this webhook
              </Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WebhookManagement;