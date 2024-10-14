import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { db } from '../../firebase';
  import { 
    Box, 
    useColorModeValue, 
    Button,
   } from '@chakra-ui/react';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';


// Definisikan keyframes untuk animasi shuffle

const shuffleAnimation = keyframes`
  0% {
    transform: rotate(0) translateX(0) scale(1);
  }
  50% {
    transform: rotate(5deg) translateX(105%) scale(0.96);
  }
  100% {
    transform: rotate(0) translateX(0);
  }
`;

// Data pertanyaan dengan warna yang berbeda untuk setiap kartu

const questions = [
  { question: '', color: '#a37' },
  { question: 'Apa arti kebahagiaan dalam hidupmu? 😊', color: '#a37' },
  { question: 'Apa kenangan terindah dari masa kecilmu? 🌈', color: '#73a' },
  { question: 'Bagaimana cara kamu mengatasi patah hati? 💔', color: '#3a7' },
  { question: 'Apa harapanmu untuk masa depan? 🌟', color: '#7a3' },
  { question: 'Siapa yang paling berpengaruh dalam hidupmu? 👩‍👧', color: '#37a' },
  { question: 'Apa yang kamu pelajari dari kegagalan? 📚', color: '#a73' },
  { question: 'Bagaimana pandanganmu tentang cinta sejati? ❤️', color: '#3a8' },
  { question: 'Apa yang membuatmu merasa hidup? 🌍', color: '#9b4' },
  { question: 'Apa impian terbesarmu? ✨', color: '#49b' },
  { question: 'Apa yang ingin kamu ubah dari masa lalu? ⏳', color: '#b49' },
  { question: 'Bagaimana cara kamu menemukan makna hidup? 🔍', color: '#5a3' },
  { question: 'Apa yang kamu syukuri hari ini? 🙏', color: '#d72' },
  { question: 'Apa yang membuatmu merasa damai? ☮️', color: '#7b2' },
  { question: 'Apa yang kamu harapkan dari hubunganmu saat ini? 💞', color: '#2b7' },
  { question: 'Apa yang ingin kamu capai dalam 5 tahun ke depan? 📅', color: '#d84' },
  { question: 'Apa yang paling kamu hargai dalam hidup? 💖', color: '#84d' },
  { question: 'Apa yang membuatmu merasa berdaya? 💪', color: '#48a' },
  { question: 'Apa yang ingin kamu wariskan kepada generasi berikutnya? 🌱', color: '#a48' },
  { question: 'Apa yang kamu lakukan untuk menjaga kesehatan mental? 🧘‍♂️', color: '#a56' },
  { question: 'Apa yang paling kamu cintai dari dirimu? 💕', color: '#68a' },
  { question: 'Apa yang membuatmu merasa terinspirasi? 🌈', color: '#a68' },
  { question: 'Apa yang kamu lakukan untuk mencapai kebahagiaan? 🎉', color: '#79a' },
  { question: 'Apa yang kamu pelajari dari pengalaman hidupmu? 🧠', color: '#a79' },
  { question: 'Apa yang kamu lakukan untuk mengatasi stres? 🌊', color: '#8ab' },
  { question: 'Apa yang paling kamu inginkan dalam hidup? 🌠', color: '#ab8' },
  { question: 'Apa yang membuatmu merasa terhubung dengan orang lain? 🤝', color: '#9c4' },
  { question: 'Apa yang kamu lakukan untuk merayakan pencapaianmu? 🎊', color: '#c49' },
  { question: 'Apa yang ingin kamu sampaikan kepada dirimu yang lebih muda? 🗣️', color: '#bca' },
  { question: 'Apa yang membuatmu merasa bangga? 🏆', color: '#ac5' }
];
  

// Style untuk card-wrapper
const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 500px; // Tidak ada perubahan
`;

// Style untuk card-list
const CardList = styled.ul`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-height: 100%;
  height: 450px; // Tidak ada perubahan
  margin: 0;
  padding: 30px;
  list-style: none;
`;

// Style untuk card-list__item
const CardListItem = styled.li`
  position: absolute;
  animation: none;
  animation-fill-mode: forwards;

  &[data-card="0"] {
    z-index: 6;
    margin-top: 0;
  }

  &[data-card="1"] {
    z-index: 5;
    margin-top: 4px;
  }

  &[data-card="2"] {
    z-index: 4;
    margin-top: 8px;
  }

  /* Style untuk animasi ketika isAnimated aktif */
  ${CardList}.is-animated & {
    &[data-card="0"] {
      animation: ${shuffleAnimation} 1s ease-in-out 0s 1 normal;
      z-index: 2;
      transition: z-index 0s ease-in-out 0.5s;
    }

    &[data-card="1"] {
      animation: ${shuffleAnimation} 1s ease-in-out 1s 1 normal;
      z-index: 1;
      transition: z-index 0s ease-in-out 1.5s;
    }

    &[data-card="2"] {
      animation: ${shuffleAnimation} 1s ease-in-out 2s 1 normal;
      z-index: 0;
      transition: z-index 0s ease-in-out 2.5s;
    }
  }
`;

// Style untuk card dengan latar belakang sesuai warna dan tidak polos
const Card = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 100%;
  width: 200px; // Diperbesar dari 150px menjadi 200px untuk membuat kartu lebih besar
  max-height: 100%;
  height: 300px; // Diperbesar dari 250px menjadi 300px untuk membuat kartu lebih besar
  padding: 3px;
  border-radius: 10px;
  box-shadow: 0 1px 3px 0 #222;
  background: #555; // Tidak ada perubahan
  color: #fff; // Tidak ada perubahan
  text-align: center;
  font-size: 16px; // Diperkecil dari 18px menjadi 16px untuk membuat tulisan lebih kecil
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);

  /* Style background sesuai dengan data-card dan tidak polos */
  ${CardListItem}[data-card="0"] & {
    background-color: ${(props) => props.color};
    background-size: cover;
  }

  ${CardListItem}[data-card="1"] & {
    background-color: ${(props) => props.color};
    background-size: cover;
  }

  ${CardListItem}[data-card="2"] & {
    background-color: ${(props) => props.color};
    background-image: url('');
    background-size: cover;
  }
`;

// Style untuk button-wrapper

// Style untuk button
// const Button = styled.button`
//   padding: 7px 15px;
//   border: 0;
//   border-radius: 10px;
//   outline: 0;
//   // background: #f3a;
//   color: #fff;
//   z-index: 0;
//   appearance: none;
//   cursor: pointer;

//   &:last-child {
//     margin-right: 0;
//   }

//   &:disabled {
//     background: #777;
//     cursor: not-allowed;
//   }
// `;


const CardShuffler = ({card, reset, onUpdate}) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState([...questions]);
  const bgValue = useColorModeValue('whiteAlpha.500', 'whiteAlpha.200');

  const someAction = async (params) => {
    // const newData = { /* some data */ };
    onUpdate(params); // Mengirim data kembali ke komponen induk

  };

useEffect(() => {
   fetch()
  }, [card])


  
  const fetch = async () => {
    try {
      const snapshots = await getDocs(collection(db, 'question'));

      snapshots.docs.forEach((item) => { 
         console.log(item.data())
      })
    } catch (e) {
      console.log(e)
    }
    
  }

  const handleShuffle = () => {
    setIsAnimated(true);
    shuffleQuestions();
    createQ()
    someAction("shuffle")
  };

  const handleReset = () => {
    stopQ()
    setIsAnimated(false);
    setCurrentQuestions([...questions]);
  };

  const shuffleQuestions = () => {
    // Shuffle array menggunakan algoritma Fisher-Yates
    for (let i = currentQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentQuestions[i], currentQuestions[j]] = [currentQuestions[j], currentQuestions[i]];
    }
    setCurrentQuestions([...currentQuestions]);
  };

  const createQ = async () => {
    try {
      await addDoc(collection(db, 'question'), {
        question: currentQuestions[0].question,
        user: localStorage.getItem('user'),
      });
      // fetchNotes();
    } catch (error) {
      console.error('Error adding document:', error);
    }
  };

  const stopQ = async ()  => {
    try {
      console.log(reset)
      await deleteDoc(doc(db, 'question', reset));
      // fetchNotes();
    someAction("reset")
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  }

  return (
    <CardWrapper>
      <CardList className={isAnimated ? 'is-animated' : ''}>
        {currentQuestions.map((question, index) => (
          <CardListItem key={index} data-card={index}>
            <Card color={question.color}>{question.question}</Card>
          </CardListItem>
        ))}
      </CardList>
      <Box display={"flex"} justifyContent="space-between" width="100%">
         <Button
            padding="10px 40px"
            onClick={handleShuffle} 
            isDisabled={isAnimated || card > 0}
            style={{margin: '10px 0'}}
            bg={bgValue}
            css={{ backdropFilter: 'blur(2px)' }}

          >
           Shuffle
          </Button>
          <Button
            padding="10px 40px"
            onClick={handleReset} 
            disabled={!isAnimated}
            style={{margin: '10px 0'}}
            bg={bgValue}
            css={{ backdropFilter: 'blur(2px)' }}

          >
           Reset
          </Button>
        </Box>
    </CardWrapper>
  );
};

export default CardShuffler;
