import {
  Container,
  Heading,
  SimpleGrid,
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
import Section from '../../components/section'
import { AttachmentIcon, ChatIcon } from '@chakra-ui/icons'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { useEffect, useState, useRef } from 'react'
import { db, storage } from '../../firebase'
import VoxelDog from '../../components/voxel-dog'
import { redirect } from 'next/dist/server/api-utils'
import { useRouter } from 'next/router'
import Layout from '../../components/layouts/article'
import questions from '../../q'

const getRandomQuestion = () => {
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
};
const Wallpapers = () => {
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
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState({})
  const fileInputRef = useRef(null)
  const [question, setQuestion] = useState(null);


  const router = useRouter()
  const downloadRef = useRef(null)
  const OverlayOne = () => (
    <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
  )

  useEffect(() => {
    fetchNotes().catch(console.error)
    if (!localStorage.getItem('user')) {
      router.push('/')
    }
  }, [])

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
        user: localStorage.getItem('user')
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
      const snapshot = await db.collection('question').get()
      const notesData = snapshot.docs.map(async doc => {
        const data = doc.data()

        // Fetch user data for question
        const userSnapshot = await db.collection('users').doc(data.user).get()
        const userData = userSnapshot.data()

        // Fetch comments
        const commentsSnapshot = await db
          .collection('question')
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
      setNotes(resolvedNotes)
      console.log(resolvedNotes)
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
    if (newComment.trim() === '') return

    try {
      await db
        .collection('question')
        .doc(noteId)
        .collection('comments')
        .add({
          text: newComment,
          createdAt: new Date(),
          user: localStorage.getItem('user')
        })
      setNewComment('')
      fetchNotes()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleDownload = (url, filename) => {
    console.log('jalan')
    if (downloadRef.current) {
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const adjustHeight = element => {
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }

  const createQ = async () => {
    try {
      let questions;
      questions = getRandomQuestion()
      setQuestion(questions)
      console.log("lewat ga?", questions)
      await db.collection('question').add({
        question: questions?.question,
        user: localStorage.getItem('user')
      })
      setSuccess(true)
      openModal('Success Upload!', 'Mading telah ditambahkan')
      setDescription('')
      setTimeout(() => {
        setSuccess(false)
      }, 2000)
      fetchNotes()
    } catch (error) {
      console.error('Error adding document:', error)
      openModal('Error', 'Failed to add document. Please try again.')
    }
    console.log(question)
  }

 

  return (
    <Layout title="Works">
      {/* <VoxelDog rotate={20} /> */}

      <Container>
        <Section>
          <Button onClick={createQ}>
            Generate Question
          </Button>
          <h1>
            
          </h1>
          {notes.map(
            ({ id, data: { question }, user, comments }) => (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingBottom: '20px'
                }}
              >
                <Box
                  borderRadius="lg"
                  mb={6}
                  p={3}
                  width={1000}
                  bg={bgValue}
                  css={{ backdropFilter: 'blur(10px)' }}
                >
                  <Box mt={4}>
                    <Heading as="h4" mb={13} size="md">
                    {question}
                    </Heading>
                    {comments.map(comment => (
                      <div>
                        <p style={{ padding: '10px', fontWeight: 'bold' }}>
                          {comment?.user?.name}
                        </p>

                        <div style={{ display: 'flex' }}>
                          <Avatar
                            name={comment?.user?.name}
                            src={comment?.user?.photoUrls[0]}
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
                    <Textarea
                      style={{
                        width: '100%',
                        minHeight: '50px',
                        resize: 'none',
                        overflow: 'hidden',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Add a comment..."
                      value={newComment}
                      resize={'horizon'}
                      onChange={e => {
                        adjustHeight(e.target)
                        setNewComment(e.target.value)
                      }}
                    />
                    <Button ml={2} onClick={() => handleAddComment(id)}>
                      Send
                    </Button>
                  </Flex>
                </Box>
              </div>
            )
          )}
        </Section>
      </Container>
    </Layout>
  )
}

export default Wallpapers
export { getServerSideProps } from '../../components/chakra'
