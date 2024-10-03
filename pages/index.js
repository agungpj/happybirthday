import NextLink from 'next/link'
import {
  Container,
  Box,
  Button,
  useColorModeValue,
  Input,
  Text,
  useDisclosure,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Alert,
} from '@chakra-ui/react'
import Layout from '../components/layouts/article'
import { useState, useEffect, useRef } from 'react'
import VoxelDog from '../components/voxel-dog'
import Cat from '../public/cat.svg'
import Image from 'next/image'

const Home = () => {
  const [name, setName] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const finalRef = useRef(null)
  const [alert, setAlert] = useState(false)
  const bgValue = useColorModeValue('whiteAlpha.900', 'whiteAlpha.200')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getName = localStorage.getItem('user') || null;
    setUser(getName)
    if (!user) {
      onOpen()
    }
    getName === 'KCLqkpnmxvvpay00453g' || getName === 'd9B8lkubjDVyIhCFVOie' ? onOpen() : onClose()
  }, [user, onOpen, onClose]) // Tambahkan onOpen dan onClose di sini

  const handleEnter = () => {
    if(name == 'nimasayu') {
      onOpen()
      localStorage.setItem('user', 'KCLqkpnmxvvpay00453g');
    } else if (name == 'youknowme') {
      onOpen()
      localStorage.setItem('user', 'd9B8lkubjDVyIhCFVOie');
    } else {
      setAlert(true)
    }
  }

  return (
    <Layout>
      <Container>
        <VoxelDog  />
        <Modal finalFocusRef={finalRef} isOpen={!isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Input your name : </ModalHeader>
            <ModalBody></ModalBody>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                borderRadius="lg"
                mb={6}
                p={3}
                width={400}
                textAlign="center"
                bg={bgValue}
                css={{ backdropFilter: 'blur(10px)' }}
              >
                <Input
                  placeholder="Enter name"
                  onChange={e => setName(e.target.value)}
                />
              </Box>
            </div>
           {alert ? ( <div style={{padding: '0 10px 20px 10px'}}>
              <Alert status="error">
                There was an error processing your request
              </Alert>
            </div>) : <></>}
            
            <Button
              style={{ margin: '0 100px' }}
              onClick={handleEnter}
              colorScheme="teal"
            >
              Enter
            </Button>
            <br></br>
           
          </ModalContent>
        </Modal>
        <div style={{ position: 'relative' }}>
  <Image src={Cat} alt="Cat Icon" width={300} height={300} style={{ position: 'absolute', bottom: 20, top: -150, left: 95, zIndex: 0 }} />
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <Button
      as={NextLink}
      href="/profile"
      scroll={false}
      style={{ margin: '10px 100px' }}
      bg={bgValue}
      css={{ backdropFilter: 'blur(2px)' }}
    >
      Profile
    </Button>
    <Button
      as={NextLink}
      href="/works"
      scroll={false}
      style={{ margin: '10px 100px' }}
      bg={bgValue}
      css={{ backdropFilter: 'blur(2px)' }}
    >
      Mading
    </Button>
    <Button
      as={NextLink}
      href="/posts"
      scroll={false}
      style={{ margin: '10px 100px' }}
      bg={bgValue}
      css={{ backdropFilter: 'blur(2px)' }}
    >
      Nabung
    </Button>
    <Button
      as={NextLink}
      href="/wallpapers"
      scroll={false}
      style={{ margin: '10px 100px' }}
      bg={bgValue}
      css={{ backdropFilter: 'blur(2px)' }}
    >
      Game
    </Button>
  </div>
</div>
        <Box as="footer" role="contentinfo" py="6" textAlign="center">
          <h1>
          🐈‍⬛
          </h1>
          <Text fontSize="sm" color="gray.600">
            &copy; 2023 Agung Prasetya. All rights reserved.
          </Text>
        </Box>
      </Container>
    
    </Layout>
  )
}

export default Home
export { getServerSideProps } from '../components/chakra'
