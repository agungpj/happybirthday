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
  }, [user])

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

  const uploadImage = file => {
    return new Promise((resolve, reject) => {
      const filename = `${Date.now()}-${file.name}`
      const storageRef = storage.ref().child(`images/${filename}`)
      const uploadTask = storageRef.put(file)

      setDescription('')

      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(prevProgress => ({
            ...prevProgress,
            [file.name]: progress
          }))
          console.log(success, uploadProgress)
        },
        error => {
          console.error('Upload failed:', error)
          reject(error)
        },
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL()
          resolve(downloadURL)
        }
      )
    })
  }

  const createChat = async photoUrls => {
    try {
      await db.collection('mading').add({
        maddingName: description,
        photoUrls,
        user: localStorage.getItem('user'),
        date: new Date()
      })
      setSuccess(true)
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
        const storageRef = storage.ref()
        const deletePromises = photoUrls.map(url => {
          const path = getImagePathFromUrl(url)
          const imageRef = storageRef.child(path)
          return imageRef.delete()
        })
        await Promise.all(deletePromises)
      }

      await db.collection('mading').doc(id).delete()
      fetchNotes()
    } catch (error) {
      alert(error.message)
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
      const snapshot = await db.collection('mading').get()
      const notesData = snapshot.docs.map(async doc => {
        const data = doc.data()

        // Fetch user data for mading
        const userSnapshot = await db.collection('users').doc(data.user).get()
        const userData = userSnapshot.data()

        // Fetch comments
        const commentsSnapshot = await db
          .collection('mading')
          .doc(doc.id)
          .collection('comments')
          .get()
        const commentsData = await Promise.all(
          commentsSnapshot.docs.map(async commentDoc => {
            const commentData = commentDoc.data()

            // Fetch user data for each comment
            const commentUserSnapshot = await db
              .collection('users')
              .doc(commentData.user)
              .get()
            const commentUserData = commentUserSnapshot.data()

            return {
              id: commentDoc.id,
              ...commentDoc.data(),
              user: commentUserData
            }
          })
        )

        return {
          id: doc.id,
          data,
          user: userData,
          comments: commentsData
        }
      })

      const resolvedNotes = await Promise.all(notesData)
      setNotes(resolvedNotes.sort((a, b) => {
        const dateA = new Date(a.data.date.seconds * 1000 + a.data.date.nanoseconds / 1000000);
        const dateB = new Date(b.data.date.seconds * 1000 + b.data.date.nanoseconds / 1000000);
        return dateB - dateA;
    }))
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    }
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
    if (!newComments[noteId] || newComments[noteId].trim() === '') return

    try {
      await db
        .collection('mading')
        .doc(noteId)
        .collection('comments')
        .add({
          text: newComments[noteId],
          createdAt: new Date(),
          user: localStorage.getItem('user')
        })
      setNewComments(prevComments => ({
        ...prevComments,
        [noteId]: '' // Clear the comment input for this mading
      }))
      fetchNotes()
    } catch (error) {
      console.error('Error adding comment:', error)
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
                          <p style={{ padding: '10px', fontWeight: 'bold' }}>
                            {comment?.user?.name}
                          </p>

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
