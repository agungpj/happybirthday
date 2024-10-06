import {
  Container,
  Heading,
  Box,
  Flex,
  Avatar,
  Text,
  Button,
  Textarea,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Card,
  Menu,
  MenuList,
  MenuItem,
  MenuButton,
  IconButton,
  Spinner,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  Center
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { db } from '../../firebase'
import Layout from '../../components/layouts/article'
import VoxelDog from '../../components/voxel-dog'
import ShuffleCards from './card'
import { BsThreeDotsVertical } from 'react-icons/bs'
// import {
//   Box,
//   useColorModeValue,
//   Button,
//   Spinner,
//   AlertDialog,
//   AlertDialogOverlay,
//   AlertDialogContent,
//   AlertDialogHeader
//  } from '@chakra-ui/react';

import { collection, addDoc, getDocs, getDoc, doc, deleteDoc } from 'firebase/firestore';


const Wallpapers = () => {
  const bgValue = useColorModeValue('whiteAlpha.500', 'whiteAlpha.200')
  const { isOpen, onClose } = useDisclosure()
  const [notes, setNotes] = useState([])
  const [comments, setComments] = useState({})
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const getName = localStorage.getItem('user') || null;
    if (!getName) {
      window.location.href = '/';
    } else {
      setUser(getName);
    }
    
  }, [user, notes])

  // useEffect(() => {
  // }, [notes])

  const fetchNotes = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'question'));
      const notesData = snapshot.docs.map(async docSnapshot => {
        const data = docSnapshot.data();
        
        // Fetch user data for nabung
        const userDocRef = doc(db, 'users', data.user);
        const userSnapshot = await getDoc(userDocRef);
        const userData = userSnapshot.data();
        
        // Fetch comments
        const commentsSnapshot = await getDocs(collection(db, 'question', docSnapshot.id, 'comments'));
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

    console.log("jalan", notesData)

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

  const handleAddComment = async (noteId) => {
    const newComment = comments[noteId]
    if (newComment.trim() === '') return

    try {
      await addDoc(collection(db, 'question', noteId, 'comments'), {
          text: newComment,
          createdAt: new Date(),
          user: localStorage.getItem('user')
        })
      setComments({ ...comments, [noteId]: '' })
      fetchNotes()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleCommentChange = (noteId, value) => {
    setComments({ ...comments, [noteId]: value })
  }

  const handleDelete = async (id) => {
    try {
      console.log(id)
      await deleteDoc(doc(db, 'question', id))
      fetchNotes()
    } catch (error) {
      alert(error.message)
    }
  }

  const handleShuffleCardsUpdate = async (newData) => {
    // Handle data returned from ShuffleCards
    if(newData) {
      fetchNotes();
    }

    if (newData?.question) { 
      console.log("lewat sini?")
      console.log(newData.question);
    }

  };


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
        <>
          <Container>
          <Box
          borderRadius="lg"
          mb={6}
          p={30}
          textAlign="center"
          bg={bgValue}
          css={{ backdropFilter: 'blur(5px)' }}
        >
        <ShuffleCards card={notes.length} reset={notes[0]?.id} onUpdate={handleShuffleCardsUpdate} />

        </Box>
            {notes.map(
              ({ id, data: { question }, comments: noteComments }) => (
                <div key={id} style={{ display: 'flex' }}>
                  <Card
                    key={id}
                    borderRadius="lg"
                    mb={6}
                    p={3}
                    mt={3}
                    width={1000}
                    bg={bgValue}
                    css={{ backdropFilter: 'blur(10px)' }}
                  >
                    <Box mt={4}>
                      <Heading
                        as="h4"
                        mb={4}
                        size="md"
                        display={'flex'}
                        justifyContent={'space-between'}
                      >
                        {question}
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            variant="ghost"
                            colorScheme="gray"
                            aria-label="See menu"
                            icon={<BsThreeDotsVertical />}
                          />
                          <MenuList>
                            <MenuItem onClick={() => handleDelete(id)}>
                              Delete Post
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Heading>
                      {noteComments.map(comment => (
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
                      <Textarea
                        style={{
                          width: '100%',
                          minHeight: '50px',
                          resize: 'none',
                          overflow: 'hidden',
                          boxSizing: 'border-box'
                        }}
                        placeholder="Add a comment..."
                        value={comments[id] || ''}
                        onChange={e => handleCommentChange(id, e.target.value)}
                      />
                      <Button
                        ml={2}
                        onClick={() => handleAddComment(id, comments[id])}
                      >
                        Send
                      </Button>
                    </Flex>
                  </Card>
                </div>
              )
            )}
          </Container>
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
            <ModalContent>
              <ModalHeader></ModalHeader>
              <ModalCloseButton />
              <ModalBody></ModalBody>
              <ModalFooter>
                <Button onClick={onClose}>Close</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      )}
    </Layout>
  )
}

export default Wallpapers
export { getServerSideProps } from '../../components/chakra'
