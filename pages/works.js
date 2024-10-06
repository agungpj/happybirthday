import {
  Container,
  Heading,
  CardHeader,
  Flex,
  Avatar,
  Box,
  IconButton,
  CardFooter,
  Card,
  Text,
  CardBody,
  Image,
  Button,
  useColorModeValue,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  ModalCloseButton,
  ModalOverlay,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Textarea
} from '@chakra-ui/react'
import Layout from '../components/layouts/article'
import Section from '../components/section'
import { AttachmentIcon } from '@chakra-ui/icons'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { useEffect, useState, useRef } from 'react'
import { db, storage } from '../firebase'
import { collection, addDoc, getDocs, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import VoxelDog from '../components/voxel-dog'

const Works = () => {
  const bgValue = useColorModeValue('whiteAlpha.500', 'whiteAlpha.200')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [notes, setNotes] = useState([])
  const [description, setDescription] = useState('')
  const [images, setImages] = useState([])
  const [success, setSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [imagePreviews, setImagePreviews] = useState([])
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const [newComments, setNewComments] = useState({})
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(null)

  const downloadRef = useRef(null)
  const OverlayOne = () => (
    <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
  )

  useEffect(() => {
    const getName = localStorage.getItem('user') || null;
    if (!getName) {
      window.location.href = '/';
    } else {
      setUser(getName);
      fetchNotes().catch(console.error);
    }
  }, [fetchNotes, user])

  const handleFileChange = event => {
    const files = Array.from(event.target.files)
    if (files.length) {
      setImages(files)
      const previews = files.map(file => URL.createObjectURL(file))
      setImagePreviews(previews)
    }
  }

  const handleSubmit = () => {
    if (images.length > 0) {
      uploadImages(images)
    } else {
      openModal('Upload Failed', 'Please select images to upload.')
    }
  }

  const uploadImages = async files => {
    if (files.length === 0) return

    const promises = files.map(file => uploadImage(file))
    try {
      const urls = await Promise.all(promises)
      createChat(urls)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const uploadImage = async file => {
    const filename = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `images/${filename}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      setUploadProgress(prevProgress => ({
        ...prevProgress,
        [file.name]: progress
      }));
      console.log(uploadProgress)
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  const createChat = async photoUrls => {
    try {
      await addDoc(collection(db, 'mading'), {
        maddingName: description,
        photoUrls,
        user: localStorage.getItem('user'),
        date: new Date()
      })
      setSuccess(true)
      console.log(success)
      openModal('Success Upload!', 'Mading telah ditambahkan')
      setDescription('')
      setImages([])
      setImagePreviews([])
      setTimeout(() => {
        setSuccess(false)
      }, 2000)
      fetchNotes()
    } catch (error) {
      console.error('Error adding document:', error)
      openModal('Error', 'Failed to add document. Please try again.')
    }
  }

  const handleDelete = async (id, photoUrls) => {
    try {
      if (photoUrls) {
        const deletePromises = photoUrls.map(url => {
          const path = getImagePathFromUrl(url);
          const imageRef = ref(storage, path);
          return deleteObject(imageRef);
        });
        await Promise.all(deletePromises);
      }

      await deleteDoc(doc(db, 'mading', id));
      fetchNotes();
    } catch (error) {
      alert(error.message);
      setAlert(error.message);
    }
  }


  const getImagePathFromUrl = url => {
    const baseUrl =
      'https://firebasestorage.googleapis.com/v0/b/agung2-apps.appspot.com/o/'
    const path = url.replace(baseUrl, '').split('?')[0]
    return decodeURIComponent(path)
  }

  const fetchNotes = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'mading'));
      const notesData = snapshot.docs.map(async docSnapshot => {
        const data = docSnapshot.data();
        
        // Fetch user data for nabung
        const userDocRef = doc(db, 'users', data.user);
        const userSnapshot = await getDoc(userDocRef);
        const userData = userSnapshot.data();
  
        // Fetch comments
        const commentsSnapshot = await getDocs(collection(db, 'mading', docSnapshot.id, 'comments'));
        const commentsData = await Promise.all(
          commentsSnapshot.docs.map(async commentDoc => {
            const commentData = commentDoc.data();
            // Fetch user data for each comment
            const commentUserDocRef = doc(db, 'users', commentData.user);
            const commentUserSnapshot = await getDoc(commentUserDocRef);
            const commentUserData = commentUserSnapshot.data();
            return {
              id: commentDoc.id,
              ...commentData,
              user: commentUserData
            };
          })
        );
  
        return {
          id: docSnapshot.id,
          data,
          user: userData,
          comments: commentsData
        };
      });
  
      const resolvedNotes = await Promise.all(notesData)
      sortCommentsByTimestamp(resolvedNotes.sort((a, b) => {
        const dateA = new Date(a.data.date.seconds * 1000 + a.data.date.nanoseconds / 1000000);
        const dateB = new Date(b.data.date.seconds * 1000 + b.data.date.nanoseconds / 1000000);
        return dateB - dateA;
    }))
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };

  function sortCommentsByTimestamp(data) {
    data.forEach(item => {
      item.comments.sort((a, b) => {
        // Calculate the total milliseconds for each createdAt timestamp
        const timestampA = a.createdAt.seconds * 1000 + a.createdAt.nanoseconds / 1000000;
        const timestampB = b.createdAt.seconds * 1000 + b.createdAt.nanoseconds / 1000000;
        // Sort in ascending order
        return timestampA - timestampB;
      });
    });
    setNotes(data)
  }

  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  const handleImageClick = () => {
    fileInputRef.current.click()
  }

  const openModal = (title, message) => {
    setModalTitle(title)
    setModalMessage(message)
    onOpen()
  }

  const handleAddComment = async noteId => {
    if (
      (!newComments[noteId] || newComments[noteId].trim() === '') 
    )
      return;

    try {

      let imageUrl = null;
      // if (commentImages[noteId]) {
      //   imageUrl = await uploadCommentImage(commentImages[noteId]);
      // }

      await addDoc(collection(db, 'mading', noteId, 'comments'), {
        text: newComments[noteId] || '',
        imageUrl: imageUrl,
        createdAt: new Date(),
        user: localStorage.getItem('user')
      });

      // Reset comment input and image
      setNewComments(prevComments => ({
        ...prevComments,
        [noteId]: ''
      }));
      // setCommentImages(prevImages => ({
      //   ...prevImages,
      //   [noteId]: null
      // }));
      fetchNotes();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

 

  const handleDownload = (url, filename) => {
    if (downloadRef.current) {
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Layout title="Works">
      <VoxelDog rotate={20} />

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
              <Textarea
  placeholder="Enter posts..."
  value={description}
  onChange={e => setDescription(e.target.value)}
  rows={3}
  style={{
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
    border: '1px solid rgba(255, 255, 255, 0.2)', // Border yang lembut
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Shadow lebih halus
    color: '#FFF', // Warna teks putih
    resize: 'none',
    overflowY: 'auto',
  }}
/>
                <IconButton
                  variant="ghost"
                  colorScheme="gray"
                  aria-label="See menu"
                  ml={3}
                  icon={<AttachmentIcon />}
                  onClick={handleButtonClick}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  multiple
                  onChange={handleFileChange}
                />
              </div>
              {imagePreviews.length > 0 && (
                <Flex
                  justifyContent="center"
                  alignItems="center"
                  mt={4}
                  flexWrap="wrap"
                >
                  {imagePreviews.map((preview, index) => (
                    <Image
                      key={index}
                      src={preview}
                      alt="Image Preview"
                      boxSize="100px"
                      objectFit="cover"
                      borderRadius="lg"
                      onClick={handleImageClick}
                      m={2}
                    />
                  ))}
                </Flex>
              )}
              <Button mt={3} onClick={handleSubmit}>
                Upload
              </Button>
            </Box>
          </div>
          {notes.map(
            ({
              id,
              data: { maddingName, photoUrls, date },
              user,
              comments
            }) => (
              <div
                key={id}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingBottom: '20px'
                }}
              >
                <Card maxW="md" key={id}>
                  <CardHeader>
                    <Flex alignItems="center" justifyContent="space-between">
                      <Flex
                        flex="1"
                        gap="4"
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        <Avatar name={user?.name} src={user?.photoUrls} />
                        <Box>
                          <Text style={{ fontWeight: 'bolder' }}>
                            {user?.name}
                          </Text>
                          <Text>
                            {date?.toDate().toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Text>
                        </Box>
                        <Box></Box>
                      </Flex>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          variant="ghost"
                          colorScheme="gray"
                          aria-label="See menu"
                          icon={<BsThreeDotsVertical />}
                        />
                        <MenuList>
                          <MenuItem onClick={() => handleDelete(id, photoUrls)}>
                            Delete Post
                          </MenuItem>
                          <MenuItem
                            onClick={() =>
                              handleDownload(photoUrls, `image${id + 1}.jpg`)
                            }
                          >
                            Download Image
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Text mb={3}>{maddingName}</Text>
                    {photoUrls && photoUrls.length > 1 ? (
                      <Flex
                        justifyContent="center"
                        alignItems="center"
                        mt={4}
                        flexWrap="wrap"
                      >
                        {photoUrls?.map((photoUrl, index) => (
                          <Image
                            key={index}
                            objectFit="cover"
                            src={photoUrl}
                            alt={`Image ${index + 1}`}
                            onClick={() =>
                              handleDownload(photoUrl, `image${index + 1}.jpg`)
                            }
                            boxSize="100px"
                            m={2}
                          />
                        ))}
                      </Flex>
                    ) : (
                      <>
                        {photoUrls?.map((photoUrl, index) => (
                          <Flex
                            key={index}
                            justifyContent="center"
                            alignItems="center"
                            mt={4}
                            flexWrap="wrap"
                          >
                            <Image
                              key={index}
                              objectFit={'cover'}
                              src={photoUrl}
                              borderRadius="lg"
                              alt={`Image ${index + 1}`}
                            />
                          </Flex>
                        ))}
                      </>
                    )}
                    <Box mt={4}>
                      <Heading as="h4" mb={13} size="md">
                        Comments
                      </Heading>
                      {comments.map(comment => (
                        <div key={comment?.user?.name}>
                          <div style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}>
                            <p style={{ fontWeight: 'bold' }}>
                              {comment?.user?.name}
                            </p>
                            <Text fontSize="xs" color="gray.500">
                              {comment.createdAt
                                .toDate()
                                .toLocaleDateString('id-ID', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                            </Text>
                          </div>
                          <div style={{ display: 'flex' }}>
                            <Avatar
                              name={comment?.user?.name}
                              src={comment?.user?.photoUrls}
                            />
                            <Box
                              borderRadius="lg"
                              mb={3}
                              p={3}
                              ml={3}
                              bg={bgValue}
                              css={{ backdropFilter: 'blur(10px)' }}
                            >
                              <Text>{comment.text}</Text>
                            </Box>
                          </div>
                        </div>
                      ))}
                    </Box>
                    <Flex mt={4}>
                      <Input
                        placeholder="Add a comment..."
                        value={newComments[id] || ''} // Use comment specific to this note
                        onChange={e =>
                          setNewComments(prevComments => ({
                            ...prevComments,
                            [id]: e.target.value // Update comment only for this note
                          }))
                        }
                      />
                      <Button ml={2} onClick={() => handleAddComment(id)}>
                        Send
                      </Button>
                    </Flex>
                  </CardBody>
                  <CardFooter
                    justify="space-between"
                    flexWrap="wrap"
                    sx={{
                      '& > button': {
                        minW: '136px'
                      }
                    }}
                  ></CardFooter>
                  <a ref={downloadRef} style={{ display: 'none' }}>
                    Download
                  </a>
                </Card>
              </div>
            )
          )}
        </Section>
      </Container>
    </Layout>
  )
}

export default Works
export { getServerSideProps } from '../components/chakra'
