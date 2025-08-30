import { useState } from 'react'
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  useDisclosure,
  Avatar,
  Badge,
  useBreakpointValue,
  Icon
} from '@chakra-ui/react'
import { Tooltip } from '@chakra-ui/tooltip'
import { useColorModeValue } from '@chakra-ui/color-mode'
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/menu'
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton
} from '@chakra-ui/modal'
import {
  FiHome,
  FiSend,
  FiFileText,
  FiUsers,
  FiClock,
  FiSettings,
  FiBarChart,
  FiLink,
  FiFilter,
  FiMenu,
  FiUser,
  FiLogOut,
  FiHelpCircle,
  FiBell,
  FiTrendingUp,
  FiEye,
  FiMousePointer,
  FiTarget,
  FiActivity
} from 'react-icons/fi'
import { useNavigate, useLocation } from 'react-router-dom'

const NavItem = ({ icon, children, isActive = false, onClick, badge, ...rest }) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900')
  const activeColor = useColorModeValue('blue.600', 'blue.200')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')
  
  return (
    <Flex
      align="center"
      p="3"
      mx="2"
      borderRadius="lg"
      role="group"
      cursor="pointer"
      bg={isActive ? activeBg : 'transparent'}
      color={isActive ? activeColor : 'inherit'}
      _hover={{
        bg: hoverBg,
        color: activeColor,
      }}
      onClick={onClick}
      {...rest}
    >
      {icon && (
        <Box
          mr="3"
          fontSize="16"
          _groupHover={{
            color: activeColor,
          }}
        >
          {icon}
        </Box>
      )}
      <Text fontWeight="medium" flex="1">{children}</Text>
      {badge && (
        <Badge colorScheme="blue" borderRadius="full" px="2" fontSize="xs">
          {badge}
        </Badge>
      )}
    </Flex>
  )
}

const SidebarContent = ({ onClose, currentTab, setCurrentTab, stats = {}, ...rest }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const bg = useColorModeValue('white', 'gray.900')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')
  const gradientBg = useColorModeValue(
    'linear(to-b, blue.50, white)', 
    'linear(to-b, gray.900, gray.800)'
  )
  
  const navigate = useNavigate()

  function logout() {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
    } catch (_) {}
    navigate('/', { replace: true })
  }

  const navSections = [
    {
      title: 'Dashboard',
      items: [
        { key: 'overview', label: 'Overview', icon: <FiHome /> },
        { key: 'analytics', label: 'Analytics', icon: <FiBarChart /> },
      ]
    },
    {
      title: 'Messaging',
      items: [
        { key: 'send', label: 'Send Notifications', icon: <FiSend /> },
        { key: 'campaigns', label: 'Campaigns', icon: <FiActivity /> },
        { key: 'templates', label: 'Templates', icon: <FiFileText /> },
        { key: 'scheduler', label: 'Scheduler', icon: <FiClock /> },
      ]
    },
    {
      title: 'Audience',
      items: [
        { key: 'subscribers', label: 'Subscribers', icon: <FiUsers />, badge: stats.subscribers },
        { key: 'segments', label: 'Segments', icon: <FiFilter /> },
      ]
    },
    {
      title: 'Tools',
      items: [
        { key: 'abtesting', label: 'A/B Testing', icon: <FiTarget /> },
        { key: 'webhooks', label: 'Webhooks', icon: <FiLink /> },
        { key: 'documentation', label: 'Documentation', icon: <FiHelpCircle /> },
        { key: 'settings', label: 'Settings', icon: <FiSettings /> },
      ]
    }
  ]

  return (
    <Box
      bgGradient={gradientBg}
      borderRight="1px"
      borderRightColor={borderColor}
      w={{ base: 'full', md: '300px' }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <VStack spacing="0" align="stretch" h="full">
        {/* Header */}
        <Flex h="20" alignItems="center" mx="6" borderBottom="1px" borderColor={borderColor}>
          <HStack spacing={3}>
            <Box p={2} bg="blue.500" borderRadius="lg">
              <Icon as={FiBell} color="white" boxSize={5} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                NotifyPro
              </Text>
              <Text fontSize="xs" color="gray.500" fontWeight="medium">
                Push Notification Platform
              </Text>
            </VStack>
          </HStack>
        </Flex>

        {/* Navigation Sections */}
        <Box flex="1" py="4" overflowY="auto" maxH="calc(100vh - 200px)">
          {navSections.map((section, sectionIndex) => (
            <Box key={section.title} mb="6">
              <Text 
                fontSize="xs" 
                fontWeight="bold" 
                color="gray.500" 
                textTransform="uppercase" 
                letterSpacing="wider"
                mx="6" 
                mb="3"
              >
                {section.title}
              </Text>
              <VStack spacing="1" px="2">
                {section.items.map((item) => (
                  <NavItem
                    key={item.key}
                    icon={item.icon}
                    isActive={currentTab === item.key}
                    onClick={() => setCurrentTab(item.key)}
                    badge={item.badge}
                  >
                    {item.label}
                  </NavItem>
                ))}
              </VStack>
            </Box>
          ))}
        </Box>

        {/* Footer */}
        <Box p="4" borderTop="1px" borderColor={borderColor}>
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              w="full"
              justifyContent="flex-start"
              leftIcon={<FiUser />}
              _hover={{ bg: hoverBg }}
            >
              <Box textAlign="left">
                <Text fontSize="sm" fontWeight="medium">Account</Text>
                <Text fontSize="xs" color="gray.500">Manage settings</Text>
              </Box>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />}>Profile</MenuItem>
              <MenuItem icon={<FiHelpCircle />}>Help & Support</MenuItem>
              <Box as="hr" border="none" borderTop="1px solid #E2E8F0" my={1} />
              <MenuItem icon={<FiLogOut />} onClick={logout}>
                Sign out
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </VStack>
    </Box>
  )
}

const MobileNav = ({ onOpen, user, ...rest }) => {
  const bg = useColorModeValue('white', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')

  return (
    <Flex
      ml={{ base: 0, md: '300px' }}
      px={{ base: 4, md: 8 }}
      height="20"
      alignItems="center"
      bg={bg}
      borderBottomWidth="1px"
      borderBottomColor={borderColor}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      boxShadow="sm"
      {...rest}
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="ghost"
        colorScheme="blue"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <HStack spacing={3} display={{ base: 'flex', md: 'none' }}>
        <Box p={1.5} bg="blue.500" borderRadius="md">
          <Icon as={FiBell} color="white" boxSize={4} />
        </Box>
        <Text fontSize="lg" fontWeight="bold" color="blue.600">
          NotifyPro
        </Text>
      </HStack>

      <HStack spacing={{ base: '2', md: '4' }}>
        <Tooltip label="Notifications">
          <IconButton
            size="md"
            variant="ghost"
            colorScheme="blue"
            aria-label="notifications"
            icon={<FiBell />}
            position="relative"
          />
        </Tooltip>
        
        <Flex alignItems="center">
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              rightIcon={<FiUser />}
              _hover={{ bg: hoverBg }}
            >
              <VStack spacing="0" align="start" display={{ base: 'none', md: 'flex' }}>
                <Text fontSize="sm" fontWeight="medium">
                  {user?.customer?.name || 'User'}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {user?.customer?.email}
                </Text>
              </VStack>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />}>Profile</MenuItem>
              <MenuItem icon={<FiSettings />}>Settings</MenuItem>
              <MenuItem icon={<FiHelpCircle />}>Help & Support</MenuItem>
              <Box as="hr" border="none" borderTop="1px solid #E2E8F0" my={1} />
              <MenuItem icon={<FiLogOut />}>Sign out</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  )
}

export default function DashboardLayout({ children, currentTab, setCurrentTab, user, stats }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const bg = useColorModeValue('gray.50', 'gray.900')

  return (
    <Box minH="100vh" bg={bg}>
      <SidebarContent
        onClose={onClose}
        display={{ base: 'none', md: 'block' }}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        stats={stats}
      />
      
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent 
            onClose={onClose}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            stats={stats}
          />
        </DrawerContent>
      </Drawer>
      
      <MobileNav onOpen={onOpen} user={user} />
      
      <Box ml={{ base: 0, md: '300px' }} p={{ base: 4, md: 8 }} pt={{ base: 6, md: 8 }}>
        {children}
      </Box>
    </Box>
  )
}