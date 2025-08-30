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
  useDisclosure,
  Icon,
  IconButton
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
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/tabs'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/table'
import {
  FormControl,
  FormLabel
} from '@chakra-ui/form-control'
import {
  Stat,
  StatLabel,
  StatNumber
} from '@chakra-ui/stat'
import {
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb
} from '@chakra-ui/slider'
import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/number-input'
import { FiUsers, FiPlus, FiEdit, FiTrash2, FiTarget, FiFilter, FiMail, FiEye, FiMoreVertical } from 'react-icons/fi';

const UserSegments = () => {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSegment, setselectedSegment] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3182CE',
    criteria: {
      countries: [],
      cities: [],
      browsers: [],
      os: [],
      devices: [],
      tags: [],
      engagementScore: { min: 0, max: 100 },
      dateRange: { start: '', end: '' }
    }
  });
  
  const toast = useToast();

  useEffect(() => {
    fetchSegments();
  }, []);

  const getApiUrl = (endpoint) => 'http://localhost:4000' + endpoint;

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/segments/list'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSegments(data.segments);
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

  const fetchSegmentSubscribers = async (segmentId) => {
    setSubscribersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/segments/${segmentId}/subscribers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSubscribers(data.subscribers);
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
      setSubscribersLoading(false);
    }
  };

  const handleCreateSegment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/segments/create'), {
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
        fetchSegments();
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

  const handleUpdateSegment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/segments/${selectedSegment._id}`, {
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
        fetchSegments();
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

  const handleDeleteSegment = async (segmentId) => {
    if (!window.confirm('Are you sure you want to delete this segment?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/segments/${segmentId}`, {
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
        fetchSegments();
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
      description: '',
      color: '#3182CE',
      criteria: {
        countries: [],
        cities: [],
        browsers: [],
        os: [],
        devices: [],
        tags: [],
        engagementScore: { min: 0, max: 100 },
        dateRange: { start: '', end: '' }
      }
    });
    setselectedSegment(null);
  };

  const openEditModal = (segment) => {
    setselectedSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description || '',
      color: segment.color,
      criteria: segment.criteria
    });
    onEditOpen();
  };

  const openViewModal = (segment) => {
    setselectedSegment(segment);
    fetchSegmentSubscribers(segment._id);
    onViewOpen();
  };

  const updateCriteria = (field, value) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [field]: value
      }
    }));
  };

  const countryOptions = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'IN', 'BR', 'MX'];
  const browserOptions = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  const osOptions = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
  const deviceOptions = ['Desktop', 'Mobile', 'Tablet'];

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold">User Segments</Text>
          <Text color="gray.600">Create and manage targeted user segments</Text>
        </Box>
        <Button leftIcon={<Icon as={FiPlus} />} colorScheme="blue" onClick={onCreateOpen}>
          Create Segment
        </Button>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="lg" />
        </Flex>
      ) : (
        <VStack spacing={4} align="stretch">
          {segments.map((segment) => (
            <Card key={segment._id}>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Box
                      w={4}
                      h={4}
                      bg={segment.color}
                      borderRadius="full"
                    />
                    <Text fontWeight="bold">{segment.name}</Text>
                    <Badge colorScheme={segment.isActive ? 'green' : 'gray'}>
                      {segment.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </HStack>
                  <Menu>
                    <MenuButton as={IconButton} icon={<Icon as={FiMoreVertical} />} variant="ghost" size="sm" />
                    <MenuList>
                      <MenuItem icon={<Icon as={FiEye} />} onClick={() => openViewModal(segment)}>
                        View Subscribers
                      </MenuItem>
                      <MenuItem icon={<Icon as={FiEdit} />} onClick={() => openEditModal(segment)}>
                        Edit Segment
                      </MenuItem>
                      <MenuItem icon={<Icon as={FiMail} />}>
                        Send Notification
                      </MenuItem>
                      <MenuItem icon={<Icon as={FiTrash2} />} onClick={() => handleDeleteSegment(segment._id)}>
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <HStack spacing={6}>
                  <Stat>
                    <StatLabel>Subscribers</StatLabel>
                    <StatNumber>{segment.subscriberCount}</StatNumber>
                  </Stat>
                  <Box>
                    <Text fontSize="sm" color="gray.600">{segment.description}</Text>
                    <Text fontSize="xs" color="gray.500">
                      Created {new Date(segment.createdAt).toLocaleDateString()}
                    </Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
          ))}
          {segments.length === 0 && (
            <Card>
              <CardBody textAlign="center" py={12}>
                <Icon as={FiTarget} boxSize="48px" color="gray.400" mb={4} />
                <Text fontSize="lg" fontWeight="bold" mb={2}>No segments created yet</Text>
                <Text color="gray.600" mb={4}>Create your first segment to start targeting specific users</Text>
                <Button leftIcon={<Icon as={FiPlus} />} colorScheme="blue" onClick={onCreateOpen}>
                  Create Your First Segment
                </Button>
              </CardBody>
            </Card>
          )}
        </VStack>
      )}

      {/* Create Segment Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Segment</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Segment Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Mobile Users from US"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this segment..."
                />
              </FormControl>

              <FormControl>
                <FormLabel>Color</FormLabel>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  w={100}
                />
              </FormControl>

              <Box w="100%">
                <Text fontWeight="bold" mb={4}>Targeting Criteria</Text>
                
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Countries</FormLabel>
                    <CheckboxGroup
                      value={formData.criteria.countries}
                      onChange={(value) => updateCriteria('countries', value)}
                    >
                      <HStack wrap="wrap">
                        {countryOptions.map(country => (
                          <Checkbox key={country} value={country}>{country}</Checkbox>
                        ))}
                      </HStack>
                    </CheckboxGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Browsers</FormLabel>
                    <CheckboxGroup
                      value={formData.criteria.browsers}
                      onChange={(value) => updateCriteria('browsers', value)}
                    >
                      <HStack wrap="wrap">
                        {browserOptions.map(browser => (
                          <Checkbox key={browser} value={browser}>{browser}</Checkbox>
                        ))}
                      </HStack>
                    </CheckboxGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Operating Systems</FormLabel>
                    <CheckboxGroup
                      value={formData.criteria.os}
                      onChange={(value) => updateCriteria('os', value)}
                    >
                      <HStack wrap="wrap">
                        {osOptions.map(os => (
                          <Checkbox key={os} value={os}>{os}</Checkbox>
                        ))}
                      </HStack>
                    </CheckboxGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Devices</FormLabel>
                    <CheckboxGroup
                      value={formData.criteria.devices}
                      onChange={(value) => updateCriteria('devices', value)}
                    >
                      <HStack wrap="wrap">
                        {deviceOptions.map(device => (
                          <Checkbox key={device} value={device}>{device}</Checkbox>
                        ))}
                      </HStack>
                    </CheckboxGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Engagement Score Range</FormLabel>
                    <RangeSlider
                      min={0}
                      max={100}
                      value={[formData.criteria.engagementScore.min, formData.criteria.engagementScore.max]}
                      onChange={(value) => updateCriteria('engagementScore', { min: value[0], max: value[1] })}
                    >
                      <RangeSliderTrack>
                        <RangeSliderFilledTrack />
                      </RangeSliderTrack>
                      <RangeSliderThumb index={0} />
                      <RangeSliderThumb index={1} />
                    </RangeSlider>
                    <HStack justify="space-between" mt={2}>
                      <Text fontSize="sm">{formData.criteria.engagementScore.min}</Text>
                      <Text fontSize="sm">{formData.criteria.engagementScore.max}</Text>
                    </HStack>
                  </FormControl>
                </VStack>
              </Box>

              <HStack spacing={3} w="100%" justify="flex-end" pt={4}>
                <Button onClick={onCreateClose}>Cancel</Button>
                <Button colorScheme="blue" onClick={handleCreateSegment}>
                  Create Segment
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Segment Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Segment</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Segment Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Mobile Users from US"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this segment..."
                />
              </FormControl>

              <FormControl>
                <FormLabel>Color</FormLabel>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  w={100}
                />
              </FormControl>

              <HStack spacing={3} w="100%" justify="flex-end" pt={4}>
                <Button onClick={onEditClose}>Cancel</Button>
                <Button colorScheme="blue" onClick={handleUpdateSegment}>
                  Update Segment
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* View Subscribers Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Segment Subscribers: {selectedSegment?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {subscribersLoading ? (
              <Flex justify="center" align="center" height="200px">
                <Spinner size="lg" />
              </Flex>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Country</Th>
                    <Th>City</Th>
                    <Th>Browser</Th>
                    <Th>OS</Th>
                    <Th>Device</Th>
                    <Th>Engagement</Th>
                    <Th>Last Active</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {subscribers.map((subscriber) => (
                    <Tr key={subscriber.id}>
                      <Td>{subscriber.country || 'Unknown'}</Td>
                      <Td>{subscriber.city || 'Unknown'}</Td>
                      <Td>{subscriber.browser}</Td>
                      <Td>{subscriber.os}</Td>
                      <Td>{subscriber.device}</Td>
                      <Td>{subscriber.engagementScore}</Td>
                      <Td>{new Date(subscriber.lastActive).toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
            {subscribers.length === 0 && !subscribersLoading && (
              <Text textAlign="center" py={8} color="gray.500">
                No subscribers found in this segment
              </Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UserSegments;