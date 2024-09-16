import NextLink from 'next/link'
import {
  Link,
  Container,
  Heading,
  Box,
  SimpleGrid,
  Button,
  List,
  ListItem,
  Tab,
  TabList,
  Tabs,
  TabPanel,
  TabPanels,
  useColorModeValue,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  ButtonGroup,
  Text,
  Image,
  useDisclosure,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import Layout from '../components/layouts/article'
import { useState, useEffect, useRef } from 'react'
import { db, storage } from '../firebase' // Ensure storage is imported
import VoxelDog from '../components/voxel-dog'
import styled, { keyframes } from 'styled-components';
const shine = keyframes`
  0% {
    background-position: 0;
  }
  60% {
    background-position: 180px;
  }
  100% {
    background-position: 180px;
  }
`;

const ButtonShine = styled.a`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 121px 48px;
  color: #fff;
  background: linear-gradient(to right, #E4D6F5 0, #C51077 10%, #E4D6F5 20%);
  background-position: 0;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${shine} 3s infinite linear;
  animation-fill-mode: forwards;
  -webkit-text-size-adjust: none;
  font-weight: 600;
  font-size: 20px;
  text-decoration: none;
  white-space: nowrap;
  font-family: "Poppins", sans-serif;
`;

const Home = () => {
  const [name, setName] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const finalRef = useRef(null)
  const [alert, setAlert] = useState(false)
  const bgValue = useColorModeValue('whiteAlpha.900', 'whiteAlpha.200')
  const [rotate, setRotate] = useState(0)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getName = localStorage.getItem('user') || null;
    setUser(getName)
    if(!user) {
      onOpen()
    }
    getName == 'KCLqkpnmxvvpay00453g' || getName == 'd9B8lkubjDVyIhCFVOie' ? onOpen() : onClose()
  }, [user])

  const handleEnter = () => {
    

    if(name == 'nimasayu') {
      // if() 
      // setRotate(9)
      onOpen()
      localStorage.setItem('user', 'KCLqkpnmxvvpay00453g');
    } else if (name == 'youknowme') {
      setRotate(9)
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
                  // value={noteTitle}
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
