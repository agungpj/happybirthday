import { 
  Container, Heading, SimpleGrid, CardHeader, Flex, Avatar, Box, 
  IconButton, CardFooter, Card, Text, CardBody, Image, Button, 
  useColorModeValue, Input, Modal, ModalContent, ModalHeader, 
  ModalBody, ModalFooter, useDisclosure, ModalCloseButton, ModalOverlay,
  Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import Layout from '../components/layouts/article';
import Section from '../components/section';
import { AttachmentIcon, ChatIcon } from '@chakra-ui/icons';
import { BsThreeDotsVertical } from 'react-icons/bs'; 
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useEffect, useState, useRef } from 'react';
import { db, storage } from '../firebase';

const Works = () => {
  const bgValue = useColorModeValue('whiteAlpha.500', 'whiteAlpha.200');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [notes, setNotes] = useState([]);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const OverlayOne = () => (
    <ModalOverlay
      bg='blackAlpha.300'
      backdropFilter='blur(10px)'
    />
  );

  useEffect(() => {
    fetchNotes().catch(console.error);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
    }
  };

  const handleSubmit = () => {
    if (image) {
      uploadImage(image);
    } else {
      openModal('Upload Failed', 'Please select an image to upload.');
    }
  };

  const uploadImage = async (file) => {
    if (!file) return;
    const filename = `${Date.now()}-${file.name}`;
    const storageRef = storage.ref().child(`images/${filename}`);
    const uploadTask = storageRef.put(file);

    setDescription('');

    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      error => {
        console.error('Upload failed:', error);
      },
      async () => {
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
        createChat(downloadURL);
      }
    );
  };

  const createChat = async (photoUrl) => {
    try {
      await db.collection('mading').add({
        chatName: description,
        photoUrl
      });
      setSuccess(true);
      openModal('Success Upload!', 'Mading telah ditambahkan');
      setDescription('');
      setImage(null);
      setImagePreview(null);  // Clear the image preview
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
      fetchNotes();
    } catch (error) {
      console.error('Error adding document:', error);
      openModal('Error', 'Failed to add document. Please try again.');
    }
  };

  const handleDelete = async (id, photoUrl) => {
    try {
      if (photoUrl) {
        const path = getImagePathFromUrl(photoUrl);
        const storageRef = storage.ref();
        const imageRef = storageRef.child(path);
        await imageRef.delete();
      }
      
      await db.collection("mading").doc(id).delete();
      fetchNotes();  // Refresh notes after deletion
    } catch (error) {
      alert(error.message);
    }
  };

  const getImagePathFromUrl = (url) => {
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/agung2-apps.appspot.com/o/';
    const path = url.replace(baseUrl, '').split('?')[0];
    return decodeURIComponent(path);
  };

  const fetchNotes = async () => {
    try {
      const snapshot = await db.collection('mading').get();
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
      setNotes(notesData);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };

  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const openModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    onOpen();
  };

  return (
    <Layout title="Works">
      <Modal isCentered isOpen={isOpen} onClose={onClose}>
        <OverlayOne />
        <ModalContent>
          <ModalHeader>{modalTitle}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{modalMessage}</Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Container>
        <Heading as="h3" fontSize={20} mb={4}>
          Works
        </Heading>

        <SimpleGrid columns={[1, 1, 2]} gap={6}>
          <Section>
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
                <div style={{ display: 'flex' }}>
                  <Input
                    placeholder="Enter name"
                    value={description}  // Bind the input to the state
                    onChange={e => setDescription(e.target.value)}
                  /> 
                  <IconButton
                    variant='ghost'
                    colorScheme='gray'
                    aria-label='See menu'
                    ml={3}
                    icon={<AttachmentIcon />}
                    onClick={handleButtonClick}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
                {imagePreview && (
                  <Flex justifyContent="center" alignItems="center" mt={4}>
                    <Image
                      src={imagePreview}
                      alt="Image Preview"
                      boxSize="200px"
                      objectFit="cover"
                      borderRadius="lg"
                      onClick={handleImageClick}
                    />
                  </Flex>
                )}
                <Button mt={3} onClick={handleSubmit}>
                  Upload
                </Button>
              </Box>
            </div>
            {notes.map(({ id, data: { chatName, photoUrl } }) => (
              <Card maxW='md' key={id} pb={10} mb={10}>
                <CardHeader>
                  <Flex alignItems='center' justifyContent='space-between'>
                    <Flex flex='1' gap='4' alignItems='center' flexWrap='wrap'>
                      <Avatar name='Segun Adebayo' src='https://bit.ly/sage-adebayo' />
                      <Box>
                        <Text>Creator, Chakra UI</Text>
                      </Box>
                    </Flex>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        variant='ghost'
                        colorScheme='gray'
                        aria-label='See menu'
                        icon={<BsThreeDotsVertical />}
                      />
                      <MenuList>
                        <MenuItem onClick={() => handleDelete(id, photoUrl)}>Delete Post</MenuItem>
                      </MenuList>
                    </Menu>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <Text>
                    {chatName}
                  </Text>
                </CardBody>
                <Image
                  objectFit='cover'
                  src={photoUrl}
                  alt='Chakra UI'
                />
                <CardFooter
                  justify='space-between'
                  flexWrap='wrap'
                  sx={{
                    '& > button': {
                      minW: '136px',
                    },
                  }}
                >
                  <Button flex='1' variant='ghost' leftIcon={<ChatIcon />}>
                    Comment
                  </Button>
                </CardFooter>
              </Card>  
            ))}
          </Section>
        </SimpleGrid>
      </Container>
    </Layout>
  );
};

export default Works;
export { getServerSideProps } from '../components/chakra';
