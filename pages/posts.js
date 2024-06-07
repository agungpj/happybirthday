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
  Alert
} from '@chakra-ui/react'
import Layout from '../components/layouts/article'
import Section from '../components/section'
import { AttachmentIcon, ChatIcon } from '@chakra-ui/icons'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { useEffect, useState, useRef } from 'react'
import { db, storage } from '../firebase'
import firebase from 'firebase'
import CurrencyInput from 'react-currency-input-field'
import { AiTwotoneShopping } from 'react-icons/ai'

const Posts = () => {
  const bgValue = useColorModeValue('whiteAlpha.500', 'whiteAlpha.200')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [notes, setNotes] = useState([])
  const [description, setDescription] = useState('')
  const [goals, setGoals] = useState(0)
  const [progress, setProgress] = useState([])
  const [images, setImages] = useState([])
  const [success, setSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [imagePreviews, setImagePreviews] = useState([])
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState({})
  const [openModals, setOpenModals] = useState(false)
  const [alert, setAlert] = useState(false)
  const fileInputRef = useRef(null)
  const [ids, setIds] = useState('')

  const OverlayOne = () => (
    <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
  )

  useEffect(() => {
    fetchNotes().catch(console.error)
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
      setGoals(0)

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
      await db.collection('nabung').add({
        chatName: description,
        target: goals,
        progress: 0,
        photoUrls
      })
      setSuccess(true)
      openModal('Success Upload!', 'Mading telah ditambahkan')
      setDescription('')
      setGoals(0)
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
      const snapshot = await db.collection('nabung').get()
      const notesData = snapshot.docs.map(async doc => {
        const data = doc.data()
        const commentsSnapshot = await db
          .collection('nabung')
          .doc(doc.id)
          .collection('comments')
          .get()
        const commentsData = commentsSnapshot.docs.map(commentDoc => ({
          id: commentDoc.id,
          ...commentDoc.data()
        }))
        return {
          id: doc.id,
          data,
          comments: commentsData
        }
      })
      const resolvedNotes = await Promise.all(notesData)
      setNotes(resolvedNotes)
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
      await db.collection('nabung').doc(noteId).collection('comments').add({
        text: newComment,
        createdAt: new Date()
      })
      setNewComment('')
      fetchNotes()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleChange = e => {
    let inputValue = e.target.value

    // Hilangkan karakter selain angka
    inputValue = inputValue.replace(/\D/g, '')

    // Format angka ke dalam format Rupiah
    if (inputValue.length > 0) {
      inputValue = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
      }).format(inputValue)
    }

    setGoals(inputValue)
  }

  const handleUpdate = async () => {
    try {
      const p = {
        date: new Date(),
        progress: Number(progress)
      }
      await db
        .collection('nabung')
        .doc(ids)
        .update({
          // progress: {
          //   progress: firebase.firestore.FieldValue.arrayUnion(progress),
          //   date: Date.now()
          // },
          progress: firebase.firestore.FieldValue.arrayUnion(p)
        })
      console.log(progress)
      onClose()
      setSuccess(true)
      setIds('')
      // await db.collection('mading').doc(id).updat()
      fetchNotes()
    } catch (error) {
      // alert(error.message)
      console.log(error)
    }
  }

  const handleOpenUpdate = async id => {
    onOpen()
    setIds(id)
    setOpenModals(true)
  }

  return (
    <Layout title="Works">
      {!openModals ? (
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
      ) : (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Input your progress : </ModalHeader>
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
                <CurrencyInput
                  placeholder="Enter progress"
                  prefix="Rp. "
                  decimalsLimit={0}
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: '#ddfa',
                    padding: '0 90px 14px 90px',
                    borderRadius: '5px',
                    marginRight: '4px',
                    borderWidth: '3.5px',
                    borderStyle: 'solid',
                    justifyContent: 'center',
                    textAlign: 'center',
                    alignItems: 'center'
                  }}
                  onValueChange={value => setProgress(value)}
                />
              </Box>
            </div>
            {alert ? (
              <div style={{ padding: '0 10px 20px 10px' }}>
                <Alert status="error">
                  There was an error processing your request
                </Alert>
              </div>
            ) : (
              <></>
            )}

            <Button
              style={{ margin: '0 100px' }}
              onClick={handleUpdate}
              colorScheme="teal"
            >
              Enter
            </Button>
            <br></br>
          </ModalContent>
        </Modal>
      )}
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
                <div pb={10} style={{ display: 'flex', paddingBottom: '15px' }}>
                  <Input
                    placeholder="Enter name"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
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
                <CurrencyInput
                  placeholder="Enter target"
                  prefix="Rp. "
                  decimalsLimit={0}
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: '#7C7C7C',
                    padding: '0 10px 14px 10px',
                    borderRadius: '5px',
                    marginRight: '4px',
                    borderWidth: '0.5px',
                    borderStyle: 'solid'
                  }}
                  onValueChange={value => setGoals(value)}
                  value={goals}
                />

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
                data: { chatName, photoUrls, target, progress },
                comments
              }) => {
                let remainingTarget = target

                return (
                  <Card maxW="md" key={id} pb={10} mb={10}>
                    <CardHeader>
                      <Flex alignItems="center" justifyContent="space-between">
                        <Flex
                          flex="1"
                          gap="4"
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          <Avatar
                            name="Segun Adebayo"
                            src="https://bit.ly/sage-adebayo"
                          />
                          <Box>
                            <Text>Creator, Chakra UI</Text>
                          </Box>
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
                            <MenuItem
                              onClick={() => handleDelete(id, photoUrls)}
                            >
                              Delete Post
                            </MenuItem>
                            <MenuItem onClick={() => handleOpenUpdate(id)}>
                              Update Progress
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      <Text mb={3}>{chatName}</Text>
                      {photoUrls.length > 1 ? (
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
                              boxSize="100px"
                              m={2}
                            />
                          ))}
                        </Flex>
                      ) : (
                        <>
                          {photoUrls?.map((photoUrl, index) => (
                            <Image
                              key={index}
                              objectFit="cover"
                              src={photoUrl}
                              alt={`Image ${index + 1}`}
                            />
                          ))}
                        </>
                      )}
                      <Box
                        borderRadius="lg"
                        mb={2}
                        mt={3}
                        p={3}
                        textAlign={'center'}
                        bg={bgValue}
                        css={{ backdropFilter: 'blur(10px)' }}
                      >
                        <Heading as="h4" mb={13} size="md">
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}
                          >
                            <CurrencyInput
                              placeholder="Enter target"
                              prefix="Target: Rp. "
                              decimalsLimit={0}
                              style={{
                                backgroundColor: 'transparent',
                                fontWeight: 'bold'
                              }}
                              onValueChange={value => setGoals(value)}
                              value={target}
                              disabled={true}
                            />
                          </div>
                        </Heading>
                        {progress ? progress?.map((item, index) => {
                          remainingTarget -= item.progress
                          return (
                            <div key={index}>
                              <h4>
                                {`Amount: Rp. ${(
                                  item.progress / 1000
                                ).toLocaleString('id-ID', {
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3
                                })} ( ${item.date
                                  .toDate()
                                  .toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })} )`}
                              </h4>
                              <h4 style={{padding: '10px', fontSize: '12px', fontWeight: 'bolder'}}>
                                {`+ Remaining Target: Rp. ${(
                                  remainingTarget / 1000
                                ).toLocaleString('id-ID', {
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3
                                })}`}
                              </h4>
                            </div>
                          )
                        }) : (<></>)}
                      </Box>
                      <Box mt={4}>
                        <Heading as="h4" mb={13} size="md">
                          Comments
                        </Heading>
                        {comments.map(comment => (
                          <div style={{ display: 'flex' }}>
                            <Avatar
                              name="Segun Adebayo"
                              src="https://bit.ly/sage-adebayo"
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
                        ))}
                      </Box>
                      <Flex mt={4}>
                        <Input
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
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
                  </Card>
                )
              }
            )}
          </Section>
        </SimpleGrid>
      </Container>
    </Layout>
  )
}

export default Posts
export { getServerSideProps } from '../components/chakra'