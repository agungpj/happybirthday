import { forwardRef } from 'react'
import Logo from './logo'
import NextLink from 'next/link'
import {
  Container,
  Box,
  Link,
  Stack,
  Heading,
  Flex,
  Menu,
  MenuItem,
  MenuList,
  MenuButton,
  IconButton,
  useColorModeValue
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'

const LinkItem = ({ href, path, target, children, ...props }) => {
  const active = path === href
  const inactiveColor = useColorModeValue('gray.800', 'whiteAlpha.900')
  return (
    <Link
      as={NextLink}
      href={href}
      scroll={false}
      p={2}
      bg={active ? 'grassTealAlpha.500' : undefined}
      color={active ? '#ffffff' : inactiveColor}
      target={target}
      fontWeight={active ? 'bold' : 'normal'}
      boxShadow={active ? '0 2px 4px #000000Alpha.200' : undefined}
      {...props}
    >
      {children}
    </Link>
  )
}



const Navbar = props => {
  const { path } = props

  return (
    <Box
      position="fixed"
      as="nav"
      w="100%"
      bg={useColorModeValue('#ffffff40', '#20202380')}
      css={{ backdropFilter: 'blur(10px)' }}
      zIndex={2}
      {...props}
    >
      <Container
        display="flex"
        p={2}
        maxW="container.md"
        wrap="wrap"
        align="center"
        justify="space-between"
      >
        <Flex align="center" mr={5}>
          <Heading as="h1" size="lg" letterSpacing={'tighter'}>
            <Logo />
          </Heading>
        </Flex>

        <Stack
          direction={{ base: 'column', md: 'row' }}
          display={{ base: 'none', md: 'flex' }}
          width={{ base: 'full', md: 'auto' }}
          alignItems="center"
          flexGrow={1}
          mt={{ base: 4, md: 0 }}
        >
           <LinkItem href="/profile" path={path}>
            Profile
          </LinkItem>
          <LinkItem href="/works" path={path}>
            Mading
          </LinkItem>
          <LinkItem href="/posts" path={path}>
            Nabung
          </LinkItem>
          {/* <LinkItem href="/profile" path={path}>
            Games
          </LinkItem> */}
          <LinkItem href="/wallpapers" path={path}>
            Game
          </LinkItem>
        </Stack>

        <Box flex={1} align="right">
          {/* <ThemeToggleButton /> */}

          <Box ml={2} display={{ base: 'inline-block', md: 'none' }}>
            <Menu isLazy id="navbar-menu">
              <MenuButton
                as={IconButton}
                icon={<HamburgerIcon />}
                variant="outline"
                aria-label="Options"
              />
              <MenuList>
              <MenuItem href="/profile" as={Link}>
                Profile
              </MenuItem>
              <MenuItem href="/works" as={Link}>
                Mading
              </MenuItem>
              <MenuItem href="/posts" as={Link}>
                Nabung
              </MenuItem>
              {/* <MenuItem href="/profile" as={Link}>
                Games
              </MenuItem> */}
              <MenuItem href="/wallpapers" as={Link}>
                Game
              </MenuItem>
              <MenuItem>
              🐈‍⬛
              </MenuItem>
              </MenuList>
            </Menu>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default Navbar
