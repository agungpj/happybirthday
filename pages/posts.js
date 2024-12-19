import {
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
  useDisclosure,
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
import { AttachmentIcon } from '@chakra-ui/icons'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { useEffect, useState, useRef } from 'react'
import { collection, addDoc, getDocs, getDoc, doc, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import CurrencyInput from 'react-currency-input-field'
import VoxelDog from '../components/voxel-dog'
import imageCompression from 'browser-image-compression'
import { db, storage } from '../firebase'
import useFcmToken from './useFcmToken'

const Posts = () => {
  const bgValue = useColorModeValue('whiteAlpha.900', 'whiteAlpha.200')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [notes, setNotes] = useState([])
  const [description, setDescription] = useState('')
  const [goals, setGoals] = useState(0)
  const [progress, setProgress] = useState([])
  const [images, setImages] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [imagePreviews, setImagePreviews] = useState([])
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const [newComments, setNewComments] = useState({})
  const [openModals, setOpenModals] = useState(false)
  const [alert, setAlert] = useState(false)
  const fileInputRef = useRef(null)
  const [ids, setIds] = useState('')
  const [commentImages, setCommentImages] = useState({})
  const [loading, setLoading] = useState(false)
  const [imgPreview, setImgPreview] = useState([])
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')

  
  const { token } = useFcmToken();

  const fetchUser = async () => {
    const userId = localStorage.getItem('user');
    if (userId) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const user = userDoc.data()
        setUsername(user.name)
      }
    }
  }
  
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
  };

  useEffect(() => {
    const getName = localStorage.getItem('user') || null;
    if (!getName) {
      window.location.href = '/';
    } else {
      setUser(getName);
      fetchUser()
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
      handleNotification(`${username} telah menambahkan wishlist`)

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
      await addDoc(collection(db, 'nabung'), {
        chatName: description,
        target: goals,
        progress: 0,
        photoUrls,
        user: localStorage.getItem('user'),
        date: new Date()
      });
      openModal('Success Upload!', 'Mading telah ditambahkan');
      setDescription('');
      setGoals(0);
      setImages([]);
      setImagePreviews([]);
      setTimeout(() => {
      }, 2000);
      fetchNotes();
    } catch (error) {
      console.error('Error adding document:', error);
      openModal('Error', 'Failed to add document. Please try again.');
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

      await deleteDoc(doc(db, 'nabung', id));
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
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'nabung'));
      const notesData = snapshot.docs.map(async docSnapshot => {
        const data = docSnapshot.data();
        
        // Fetch user data for nabung
        const userDocRef = doc(db, 'users', data.user);
        const userSnapshot = await getDoc(userDocRef);
        const userData = userSnapshot.data();
  
        // Fetch comments
        const commentsSnapshot = await getDocs(collection(db, 'nabung', docSnapshot.id, 'comments'));
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
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      setLoading(false);
    }
  };

  function sortCommentsByTimestamp(data) {
    data.forEach(item => {
      item.comments.sort((a, b) => {
        const timestampA = a.createdAt.seconds * 1000 + a.createdAt.nanoseconds / 1000000;
        const timestampB = b.createdAt.seconds * 1000 + b.createdAt.nanoseconds / 1000000;
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
    console.log(modalTitle, modalMessage)
    setModalMessage(message)
    // onOpen()
  }

  const handleAddComment = async noteId => {
    if (
      (!newComments[noteId] || newComments[noteId].trim() === '') &&
      !commentImages[noteId]
    )
      return;

    try {
      setLoading(true);

      let imageUrl = null;
      if (commentImages[noteId]) {
        imageUrl = await uploadCommentImage(commentImages[noteId]);
      }

      handleNotification(`${username} : ${newComments[noteId]}`, `${username} menambahkan komentar`)

      await addDoc(collection(db, 'nabung', noteId, 'comments'), {
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
      setCommentImages(prevImages => ({
        ...prevImages,
        [noteId]: null
      }));
      setLoading(false);
      fetchNotes();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  const handleUpdate = async () => {
    try {
      const p = {
        date: new Date(),
        progress: Number(progress)
      };
      await updateDoc(doc(db, 'nabung', ids), {
        progress: arrayUnion(p)
      });
      onClose();
      setIds('');
      fetchNotes();
    } catch (error) {
      // handle error
    }
  }

  

  const handleOpenUpdate = async id => {
    onOpen()
    setIds(id)
    setOpenModals(true)
    console.log(openModals)
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
    const filename = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `comment-images/${filename}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
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
    console.log(func)

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
      <Section key={1}>
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
                ? progress?.map((item) => {
                    return (remainingTarget -= item.progress)
                  })
                : null
            }

            return (
              <div key={id} style={{ display: 'flex', justifyContent: 'center' }}>
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
                              src={comment?.user?.photoUrls}
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