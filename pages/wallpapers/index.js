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



const Wallpapers = () => {
  const bgValue = useColorModeValue('whiteAlpha.500', 'whiteAlpha.200')
  const { isOpen, onOpen, onClose } = useDisclosure()
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
      fetchNotes().catch(console.error);
    }
  }, [user, notes, fetchNotes])

  const fetchNotes = async () => {
    try {
      // setLoading(true)
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
      if (notes.length == 0) {
        setNotes(resolvedNotes)

        setLoading(false)

      } else {
        setNotes(resolvedNotes)
        setLoading(false)

      }

    } catch (error) {
      console.error('Failed to fetch notes:', error)
    }
  }

  const handleAddComment = async (noteId) => {
    const newComment = comments[noteId]
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
      await db.collection('question').doc(id).delete()
      fetchNotes()
    } catch (error) {
      alert(error.message)
    }
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
        <ShuffleCards card={notes.length} />

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
                        <Box key={comment.id} mb={4}>
                          <p style={{ padding: '10px', fontWeight: 'bold' }}>
                            {comment?.user?.name}
                          </p>
                          <Flex>
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
                          </Flex>
                        </Box>
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
