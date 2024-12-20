import NextLink from 'next/link'
import {
  Container,
  Box,
  Button,
  useColorModeValue,
  Input,
  Text,
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
import { getMessaging, getToken } from 'firebase/messaging'
import  { Toaster } from 'react-hot-toast'
import useFcmToken from './useFcmToken'


const Home = () => {
  const [name, setName] = useState('')
  const finalRef = useRef(null)
  const [alert, setAlert] = useState(false)
  const bgValue = useColorModeValue('whiteAlpha.900', 'whiteAlpha.200')
  const [user, setUser] = useState(null)
  const [notification, setNotification] = useState({
    title: '',
    body: ''
  })
  const [showLoginModal, setShowLoginModal] = useState(true)
  const [showNotifModal, setShowNotifModal] = useState(false)
  const [buttonNotif, setButtonNotif] = useState(false)

  const { token } = useFcmToken();
 
  
  
  const handleNotification = async (message, title = "🌈💥 Agung & Ayu 💫 🌸") => {
    const response = await fetch('/api/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        title: title,
        message: message,
        link: "/works",
      }),
    });

    const data = await response.json();
    console.log(data)
    // toast(
    //   <>
    //     <strong>{data.message.title}</strong>
    //     <br />
    //     {data.message.body}
    //   </>,
    //   {
    //     icon: '🔔',
    //   }
    // );
  };

  
  const subscribeToTopic = async () => {
    const messaging = getMessaging();
    try {
      const token = await getToken(messaging, { vapidKey: process.env.VAPID_KEY });
      if (token) {
        await fetch("/api/topic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, topic: "general" }),
        });
      }
    } catch (error) {
      console.error("Failed to subscribe to topic:", error);
    }
  };
  

  useEffect(() => {
    const userFromStorage = localStorage.getItem('user')
    subscribeToTopic();
    setUser(userFromStorage)
    if (userFromStorage) {
      setShowLoginModal(false)
    }
  }, [user])

  const handleEnter = () => {
    if (name === 'nimasayu') {
      setShowLoginModal(false)
      localStorage.setItem('user', 'KCLqkpnmxvvpay00453g')
    } else if (name === 'youknowme') {
      setShowLoginModal(false)
      localStorage.setItem('user', 'd9B8lkubjDVyIhCFVOie')
      setButtonNotif(true)
    } else {
      setAlert(true)
    }
  }


  return (
    <Layout>
      <Toaster position='top-right' />
      <Container>
        <VoxelDog />
        <Modal finalFocusRef={finalRef} isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Input your name:</ModalHeader>
            <ModalBody>
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
              {alert && (
                <Alert status="error" mb={4}>
                  There was an error processing your request
                </Alert>
              )}
              <Button
                onClick={handleEnter}
                colorScheme="teal"
                width="100%"
              >
                Enter
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>

        <Modal finalFocusRef={finalRef} isOpen={showNotifModal} onClose={() => setShowNotifModal(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Input notification</ModalHeader>
            <ModalBody>
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
                  placeholder="Enter Title"
                  onChange={e => setNotification(prev => ({...prev, title: e.target.value}))}
                  mb={2}
                />
                <Input
                  placeholder="Enter Body"
                  onChange={e => setNotification(prev => ({...prev, body: e.target.value}))}
                />
              </Box>
              <Button
                onClick={() => {
                  handleNotification(notification.body, `🌈💥${notification.title} 💫 🌸`)
                  setShowNotifModal(false)
                }}
                colorScheme="teal"
                width="100%"
              >
                Send Notification
              </Button>
              
            </ModalBody>
          </ModalContent>
        </Modal>

        <div style={{display: 'flex', flexDirection: 'column'}}>
          <Button
            as={NextLink}
            href="/profile"
            scroll={false}
            style={{margin: '10px 100px'}}
            bg={bgValue}
            css={{ backdropFilter: 'blur(2px)' }}
          >
            Profile
          </Button>
          <Button
            as={NextLink}
            href="/works"
            scroll={false}
            style={{margin: '10px 100px'}}
            bg={bgValue}
            css={{ backdropFilter: 'blur(2px)' }}
          >
            Mading
          </Button>
          <Button
            as={NextLink}
            href="/posts"
            scroll={false}
            style={{margin: '10px 100px'}}
            bg={bgValue}
            css={{ backdropFilter: 'blur(2px)' }}
          >
            Nabung
          </Button>
          {user === "d9B8lkubjDVyIhCFVOie" || buttonNotif ? (
            <Button 
              style={{margin: '10px 100px'}} 
              onClick={() => setShowNotifModal(true)}
            >
              Send Notif
            </Button>
          ) : null}
          <Button
            as={NextLink}
            href="/wallpapers"
            scroll={false}
            style={{margin: '10px 100px'}}
            bg={bgValue}
            css={{ backdropFilter: 'blur(2px)' }}
          >
            Game
          </Button>
        </div>
        <Box as="footer" role="contentinfo" py="6" textAlign="center">
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