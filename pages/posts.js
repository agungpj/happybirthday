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
  Alert,
  VStack,
  HStack,
  Spacer,
  Center,
  Spinner,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader
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
import VoxelDog from '../components/voxel-dog'
import imageCompression from 'browser-image-compression'

const Posts = () => {
  const bgValue = useColorModeValue('whiteAlpha.900', 'whiteAlpha.200')
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
  const [newComments, setNewComments] = useState({})
  const [comments, setComments] = useState({})
  const [openModals, setOpenModals] = useState(false)
  const [alert, setAlert] = useState(false)
  const fileInputRef = useRef(null)
  const [ids, setIds] = useState('')
  const [commentImages, setCommentImages] = useState({})
  const commentFileInputRef = useRef(null)
  const downloadRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [imgPreview, setImgPreview] = useState([])
  const [user, setUser] = useState(null)

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
    const files = Array.from(event)
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
        photoUrls,
        user: localStorage.getItem('user'),
        date: new Date()
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

      await db.collection('nabung').doc(id).delete()
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
      setLoading(true)
      const snapshot = await db.collection('nabung').get()
      const notesData = snapshot.docs.map(async doc => {
        const data = doc.data()

        // Fetch user data for nabung
        const userSnapshot = await db.collection('users').doc(data.user).get()
        const userData = userSnapshot.data()

        // Fetch comments
        const commentsSnapshot = await db
          .collection('nabung')
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
      setLoading(false)
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
    if (
      (!newComments[noteId] || newComments[noteId].trim() === '') &&
      !commentImages[noteId]
    )
      return

    try {
      setLoading(true)

      let imageUrl = null
      if (commentImages[noteId]) {
        imageUrl = await uploadCommentImage(commentImages[noteId])
      }

      await db
        .collection('nabung')
        .doc(noteId)
        .collection('comments')
        .add({
          text: newComments[noteId] || '',
          imageUrl: imageUrl,
          createdAt: new Date(),
          user: localStorage.getItem('user')
        })

      // Reset comment input and image
      setNewComments(prevComments => ({
        ...prevComments,
        [noteId]: ''
      }))
      setCommentImages(prevImages => ({
        ...prevImages,
        [noteId]: null
      }))
      setLoading(false)
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
      onClose()
      setSuccess(true)
      setIds('')
      // await db.collection('mading').doc(id).updat()
      fetchNotes()
    } catch (error) {
      // alert(error.message)
    }
  }

  const handleOpenUpdate = async id => {
    onOpen()
    setIds(id)
    setOpenModals(true)
  }

  const handleCommentImageUpload = async (noteId, event) => {
    const imageFile = event.target.files[0]

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    }
    try {
      setLoading(true)
      const compressedFile = await imageCompression(imageFile, options)

      if (compressedFile) {
        setCommentImages(prevImages => ({
          ...prevImages,
          [noteId]: compressedFile
        }))
        const arr = URL.createObjectURL(compressedFile)
        setImgPreview(arr)
      }
      setLoading(false)
    } catch (e) {
      console.log(e)
    }
  }

  const uploadCommentImage = async file => {
    const filename = `${Date.now()}-${file.name}`
    const storageRef = storage.ref().child(`comment-images/${filename}`)
    await storageRef.put(file)
    return await storageRef.getDownloadURL()
  }

  const handleDownloadImage = async (url, filename) => {
    try {
      // if (downloadRef.current) {
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.target = '_blank' // This line opens the link in a new tab
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // }
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  async function handleImageUpload(event, func) {
    const files = Array.from(event.target.files)
    const compressedFiles = []

    for (let i = 0; i < files.length; i++) {
      const imageFile = files[i]

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      }
      try {
        setLoading(true)
        const compressedFile = await imageCompression(imageFile, options)
        compressedFiles.push(compressedFile)
        setLoading(false)
      } catch (error) {
        console.log(error)
      }
    }

    handleFileChange(compressedFiles) // write your own logic
  }

  return (
    <Layout title="Works">
      <VoxelDog rotate={20} />

      {loading ? (
        // <Modal isOpen={loading}>
        //   <ModalOverlay />
        //   <ModalContent>

        //     <ModalCloseButton />
        //     <ModalBody>
        //       <Center>
        //         <Spinner />
        //         <ModalHeader>Loading...</ModalHeader>
        //       </Center>
        //     </ModalBody>
        //   </ModalContent>
        // </Modal>

        <AlertDialog
          isOpen={loading}
          // leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                <Center>
                  <Spinner />
                  <ModalHeader>Loading...</ModalHeader>
                </Center>
              </AlertDialogHeader>

              {/* <AlertDialogBody>
            Are you sure? You can't undo this action afterwards.
          </AlertDialogBody> */}

              {/* <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme='red' onClick={onClose} ml={3}>
              Delete
            </Button>
          </AlertDialogFooter> */}
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
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
                  intlConfig={{ locale: 'id-ID', currency: 'IDR' }}
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
      {/* <Heading as="h3" fontSize={20} mb={4}>
          Works
        </Heading> */}

      {/* <SimpleGrid columns={[1, 1, 2]} gap={6}> */}
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
                onChange={event => handleImageUpload(event, 'post')}
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
              intlConfig={{ locale: 'id-ID', currency: 'IDR' }}
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
            data: { chatName, photoUrls, target, progress, date },
            user,
            comments
          }) => {
            let remainingTarget = target
            {
              progress
                ? progress?.map((item, index) => {
                    return (remainingTarget -= item.progress)
                  })
                : null
            }

            return (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Card maxW="md" key={id} pb={10} mb={10}>
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
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
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
                          <MenuItem onClick={() => handleDelete(id, photoUrls)}>
                            Delete Post
                          </MenuItem>
                          {remainingTarget !== 0 ? (
                            <MenuItem onClick={() => handleOpenUpdate(id)}>
                              Update Progress
                            </MenuItem>
                          ) : (
                            <></>
                          )}
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
                            width={'500px'}
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
                      <Heading as="h6" mb={13} size="md">
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          {remainingTarget == 0 ? (
                            <span
                              style={{ fontWeight: 'bolder', fontSize: '15px' }}
                            >
                              🌈💥 Yeay! Tabungan kamu sudah tercapai 💫 🌸
                            </span>
                          ) : (
                            <></>
                          )}
                        </div>
                      </Heading>
                      <Heading as="h6" mb={13} size="md">
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <CurrencyInput
                            placeholder="Enter target"
                            prefix="✨Rp. "
                            decimalsLimit={0}
                            style={{
                              backgroundColor: 'transparent',
                              fontWeight: 'bold',
                              justifyContent: 'center',
                              alignItems: 'center',
                              textAlign: 'center'
                            }}
                            intlConfig={{ locale: 'id-ID', currency: 'IDR' }}
                            onValueChange={value => setGoals(value)}
                            value={target}
                            disabled={true}
                          />
                        </div>
                      </Heading>

                      {progress ? (
                        progress?.map((item, index) => {
                          return (
                            <div key={index}>
                              <Text
                                fontFamily='M PLUS Rounded 1c", sans-serif'
                                fontWeight="bold"
                              >
                                {`Amount: Rp. ${item.progress.toLocaleString(
                                  'id-ID',
                                  {
                                    maximumFractionDigits: 3
                                  }
                                )} ( ${item.date
                                  .toDate()
                                  .toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })} )`}
                              </Text>
                            </div>
                          )
                        })
                      ) : (
                        <></>
                      )}
                      {remainingTarget !== 0 ? (
                        <h4
                          style={{
                            padding: '10px',
                            fontFamily: '"M PLUS Rounded 1c", sans-serif'
                          }}
                        >
                          Remaining Target:{' '}
                          <span
                            style={{ fontWeight: 'bolder' }}
                          >{`Rp. ${remainingTarget.toLocaleString('id-ID', {
                            maximumFractionDigits: 3
                          })}`}</span>
                        </h4>
                      ) : (
                        <></>
                      )}
                    </Box>
                    <VStack mt={4} align="stretch" spacing={4}>
                      <Heading as="h4" size="md">
                        Comments
                      </Heading>
                      {comments.map((comment, index) => (
                        <Box
                          key={index}
                          borderRadius="lg"
                          p={3}
                          bg={bgValue}
                          css={{ backdropFilter: 'blur(10px)' }}
                        >
                          <HStack spacing={3} mb={2}>
                            <Avatar
                              name={comment?.user?.name}
                              src={comment?.user?.photoUrls[0]}
                              size="sm"
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold">
                                {comment.user?.name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {comment.createdAt
                                  .toDate()
                                  .toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                              </Text>
                            </VStack>
                            <Spacer />
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                aria-label="Options"
                                icon={<BsThreeDotsVertical />}
                                variant="ghost"
                                size="sm"
                              />
                              <MenuList>
                                <MenuItem
                                  onClick={() =>
                                    handleDownloadImage(
                                      comment.imageUrl,
                                      `image${id + 1}.jpg`
                                    )
                                  }
                                >
                                  Download Image
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </HStack>
                          <Text mb={2}>{comment.text}</Text>
                          {comment.imageUrl && (
                            <Image
                              src={comment.imageUrl}
                              alt="Comment image"
                              maxH="200px"
                              objectFit="cover"
                              borderRadius="md"
                            />
                          )}
                        </Box>
                      ))}
                    </VStack>

                    <Flex mt={4}>
                      <Input
                        placeholder="Add a comment..."
                        value={newComments[id] || ''}
                        onChange={e =>
                          setNewComments(prevComments => ({
                            ...prevComments,
                            [id]: e.target.value
                          }))
                        }
                      />
                      <label htmlFor={`comment-image-${id}`}>
                        <IconButton
                          as="span"
                          ml={2}
                          icon={<AttachmentIcon />}
                          aria-label="Upload image"
                          cursor="pointer"
                        />
                      </label>
                      <input
                        id={`comment-image-${id}`}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleCommentImageUpload(id, e)}
                      />
                      <Button ml={2} onClick={() => handleAddComment(id)}>
                        Send
                      </Button>
                    </Flex>
                    {commentImages[id] && imgPreview.length > 0 && (
                      <Flex
                        justifyContent="center"
                        alignItems="center"
                        mt={4}
                        flexWrap="wrap"
                      >
                        {/* {imgPreview.map((preview, index) => ( */}
                        <Image
                          key={imgPreview}
                          src={imgPreview}
                          alt="Image Preview"
                          boxSize="100px"
                          objectFit="cover"
                          borderRadius="lg"
                          onClick={handleImageClick}
                          m={2}
                        />
                        {/* ))} */}
                      </Flex>
                    )}
                  </CardBody>
                  <CardFooter
                    justify="space-between"
                    flexWrap="wrap"
                    sx={{
                      '& > button': {
                        minW: '136px'
                      }
                    }}
                  />
                </Card>
              </div>
            )
          }
        )}
      </Section>
      {/* </SimpleGrid> */}
    </Layout>
  )
}

export default Posts
export { getServerSideProps } from '../components/chakra'
