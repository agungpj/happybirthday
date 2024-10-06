import {
    Container,
    Box,
    Text,
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
    VStack, 
    Center,
    Spinner,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    FormControl,
    FormLabel
  } from '@chakra-ui/react'
  import Layout from '../components/layouts/article'
  import Section from '../components/section'
  import { useEffect, useState, useRef } from 'react'
  import { db, storage } from '../firebase'
import {  getDoc, doc, updateDoc } from 'firebase/firestore';
  import VoxelDog from '../components/voxel-dog'
  import imageCompression from 'browser-image-compression'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

  
  const Profile = () => {
    const bgValue = useColorModeValue('whiteAlpha.900', 'whiteAlpha.200')
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [images, setImages] = useState([])
    const [success, setSuccess] = useState(false)
    const [uploadProgress, setUploadProgress] = useState({})
    const [imagePreviews, setImagePreviews] = useState([])
    const [modalTitle, setModalTitle] = useState('')
    const [modalMessage, setModalMessage] = useState('')
    const fileInputRef = useRef(null)
    const [loading, setLoading] = useState(false)
    const [tempName, setTempName] = useState("");
    const [user, setUser] = useState({
        name: "",
        photo: ""
    })
    const [users, setUsers] = useState(null)
  
    useEffect(() => {
        const getName = localStorage.getItem('user') || null;
        if (!getName) {
          window.location.href = '/';
        } else {
          setUsers(getName);
          fetchUser().catch(console.error);
        }
      fetchUser().catch(console.error)
    }, [users])

    const fetchUser = async () => {
      try {
        setLoading(true);
        const userDoc = doc(db, 'users', localStorage.getItem('user'));  // Referensi ke dokumen
        const userSnapshot = await getDoc(userDoc);  // Mengambil data dokumen
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          setUser({
            name: userData.name,
            photo: userData.photoUrls
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

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
          // If no images are selected, directly call updateProfile without uploading images
          updateProfile(user.photoUrls)
        }
      }
    
      const uploadImages = async files => {
        if (files.length === 0) return
    
        const promises = files.map(file => uploadImage(file))
        try {
          const urls = await Promise.all(promises)
          updateProfile(urls)
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

      const getImagePathFromUrl = url => {
        const baseUrl =
          'https://firebasestorage.googleapis.com/v0/b/agung2-apps.appspot.com/o/'
        const path = url.replace(baseUrl, '').split('?')[0]
        return decodeURIComponent(path)
      }
    
      const updateProfile = async (photoUrls) => {
        try {
          setLoading(true);
          const userDoc = doc(db, 'users', localStorage.getItem('user')); // Referensi ke dokumen
          await updateDoc(userDoc, {
            name: tempName !== "" ? tempName : user.name,
            photoUrls: photoUrls !== undefined ? photoUrls : user.photo
          });
      
          // Hapus gambar lama dari storage
          if (photoUrls) {
            const deletePromises = user.photo.map((url) => {
              const path = getImagePathFromUrl(url);
              const imageRef = ref(storage, path); // Mendapatkan referensi file
              return deleteObject(imageRef); // Hapus file
            });
            await Promise.all(deletePromises);
          }
      
          setSuccess(true);
          console.log(success);
          openModal('Success Upload!', 'Profile has been updated');
          setImages([]);
          setImagePreviews([]);
          setTimeout(() => {
            setSuccess(false);
          }, 2000);
          onClose();
          fetchUser();
          setLoading(false);
        } catch (error) {
          console.error('Error updating profile:', error);
          openModal('Error', 'Failed to update profile. Please try again.');
        }
      };
    
      const openModal = (title, message) => {
        setModalTitle(title)
        setModalMessage(message)
        console.log(modalTitle, modalMessage)
        onOpen()
      }
    
      async function handleImageUpload(event) {
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
    
        handleFileChange(compressedFiles)
      }

  return (
    <Layout title="Profile">
    <VoxelDog rotate={20} />
    <Container>
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
      <Section>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Box
            borderRadius="lg"
            mb={6}
            p={10}
            width={400}
            textAlign="center"
            bg={bgValue}
            css={{ backdropFilter: 'blur(10px)' }}
          >
            <VStack spacing={4} align="center">
            <Image
                borderRadius="full"
                boxSize="150px"
                src={user?.photo ? user?.photo : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'}
                alt={"Profile Image"}
                objectFit="cover"
                border="3px solid white"
                />
              <Text fontSize="lg" fontWeight="bold">
                Halo, {user?.name} 🐈‍⬛
              </Text>
              <Button onClick={onOpen}>Edit Profile</Button>
            </VStack>
          </Box>
        </div>
      </Section>
      )}
    </Container>

    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Profile</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Profile Image</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={(e)=> handleImageUpload(e)}
                ref={fileInputRef}
                display="none"
              />
              <Button onClick={() => fileInputRef.current.click()}>
                Choose Image
              </Button>
            </FormControl>
            {imagePreviews && imagePreviews.length !== 0 ? (
              <Image
                src={imagePreviews}
                alt="Profile Preview"
                maxHeight="200px"
              />
            ) : (<></>)}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="ghost" mr={3} onClick={handleSubmit}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  </Layout>
  );
};

export default Profile;