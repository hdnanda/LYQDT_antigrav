
// @ts-ignore
import correctSound from '../sounds/correct.wav';
// @ts-ignore
import wrongSound from '../sounds/wrong.wav';
// @ts-ignore
import completeSound from '../sounds/session_complete.mp3';

const correctAudio = new Audio(correctSound);
const wrongAudio = new Audio(wrongSound);
const completeAudio = new Audio(completeSound);

// Adjust volumes
correctAudio.volume = 0.6;
wrongAudio.volume = 0.5;
completeAudio.volume = 0.7;

export const playSound = {
  correct: () => {
    correctAudio.currentTime = 0;
    correctAudio.play().catch(e => console.warn("Audio blocked:", e));
  },
  wrong: () => {
    wrongAudio.currentTime = 0;
    wrongAudio.play().catch(e => console.warn("Audio blocked:", e));
  },
  complete: () => {
    completeAudio.currentTime = 0;
    completeAudio.play().catch(e => console.warn("Audio blocked:", e));
  }
};
