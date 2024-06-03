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

const Home = () => {
  const bgValue = useColorModeValue('whiteAlpha.500', 'whiteAlpha.200')
  const [name, setName] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const finalRef = useRef(null)
  const [alert, setAlert] = useState(false)
  const [rotate, setRotate] = useState(0)


  const handleEnter = () => {
    if(name == 'test') {
      // if() 
      setRotate(9)
      onOpen()
      localStorage.setItem('user', 'test');
    } else {
      setAlert(true)
    }
  }

  return (
    <Layout>
      <Container>
        <VoxelDog rotate={rotate} />
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

        

        <Box
          borderRadius="lg"
          mb={6}
          p={3}
          textAlign="center"
          bg={bgValue}
          css={{ backdropFilter: 'blur(10px)' }}
        >
          Hello, Welcome!!
        </Box>
        <div style={{display: 'flex', flexDirection: 'column'}}>
        
        <Button
            as={NextLink}
            href="/works"
            scroll={false}
            style={{margin: '10px 100px'}}
            colorScheme="teal"
          >
           Mading
          </Button>
        <Button colorScheme='teal' style={{margin: '10px 100px'}}>Chat</Button>
        <Button colorScheme='teal' style={{margin: '10px 100px'}}>Gallery</Button>
     
        </div>
       
      </Container>
    
    </Layout>
  )
}

export default Home
export { getServerSideProps } from '../components/chakra'
