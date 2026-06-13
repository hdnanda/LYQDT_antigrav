import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Lesson } from '../data/AcademyData';
import {
  HeartIcon,
  XIcon,
  CheckIcon,
  FireIcon,
  TrophyIcon,
  RetryIcon,
} from './Icons';
import { PepTalkModal } from './PepTalkModal';
import { type AnswerGlow, type AnswerStatus } from './AnswerGlow';
import { useSound } from '../hooks/useSound';

// STRICT MODULAR IMPORTS
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase.js';
import { useAuth } from '../contexts/AuthContext.js';
import { markLessonComplete } from '../utils/streakUtils';

interface LessonScreenProps {
  lesson: Lesson;
  sectionColor: string;
  onExit: () => void;
  onComplete: (xp: number) => void;
  onNextLesson: () => void;
  onFail: () => void;
}

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

export const LessonScreen: React.FC<LessonScreenProps> = ({
  lesson,
  sectionColor,
  onExit,
  onComplete,
  onNextLesson,
  onFail,
}) => {
  const { user } = useAuth();
  const { playSound } = useSound(); // Initialize Hook

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hearts, setHearts] = useState(lesson.isExam ? 3 : -1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showPepTalk, setShowPepTalk] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isLessonComplete, setIsLessonComplete] = useState(false);

  const currentQuestion = lesson.questions[currentQIndex];
  const progress = (currentQIndex / lesson.questions.length) * 100;

  const restartLesson = () => {
    playSound('click');
    setCurrentQIndex(0);
    setStreak(0);
    setHearts(lesson.isExam ? 3 : -1);
    setIsGameOver(false);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setShowPepTalk(false);
    setAnswerStatus(null);
    setCorrectCount(0);
    setIsLessonComplete(false);
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const correct = index === currentQuestion.correctIndex;

    setIsCorrect(correct);
    setAnswerStatus(correct ? 'correct' : 'wrong');
    setTimeout(() => setAnswerStatus(null), 600);

    // Play Feedback Sound
    playSound(correct ? 'success' : 'error');

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectCount((c) => c + 1);

      const isLastQuestion = currentQIndex === lesson.questions.length - 1;
      if (newStreak > 0 && newStreak % 5 === 0 && !isLastQuestion) {
        playSound('unlock'); // Bonus sound for streak
        setShowPepTalk(true);
      }
    } else {
      setStreak(0);
      if (lesson.isExam) {
        setHearts((h) => {
          const newHearts = h - 1;
          if (newHearts <= 0) setTimeout(() => setIsGameOver(true), 1000);
          return newHearts;
        });
      }
    }
  };

  const handlePepTalkFinished = () => {
    setShowPepTalk(false);
    handleNext();
  };

  const handleNext = () => {
    if (currentQIndex < lesson.questions.length - 1) {
      playSound('whoosh');
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      setIsLessonComplete(true);
      playSound('complete'); // Level complete sound
    }
  };

  const handleFinishLesson = (earnedXP: number) => {
    playSound('click');
    if (!user || !user.uid) {
      console.error('No user found, cannot save progress.');
      onExit();
      return;
    }

    // OPTIMISTIC UI: Transition immediately
    onComplete(earnedXP);
    onNextLesson();

    // NON-BLOCKING BACKGROUND SAVE
    const userRef = doc(db, 'users', user.uid);

    updateDoc(userRef, {
      xp: increment(earnedXP),
      completedLessons: arrayUnion(lesson.id),
    }).catch((error) =>
      console.error('Background save failed (XP/Lessons):', error)
    );

    // Update streak in background
    markLessonComplete(user).catch((error) =>
      console.error('Background save failed (Streak):', error)
    );
  };

  if (isGameOver) {
    return (
      <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 p-8 rounded-full mb-6">
          <HeartIcon className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Out of Hearts!</h2>
        <p className="text-slate-400 mb-8">
          You lost all your hearts during the exam. Penalties apply.
        </p>
        <button
          onClick={() => {
            playSound('click');
            onFail();
          }}
          className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-white transition-colors"
        >
          Accept Fate
        </button>
      </div>
    );
  }

  if (isLessonComplete) {
    const totalQuestions = lesson.questions.length;
    const accuracy =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;
    const requiredAccuracy = lesson.requiredAccuracy
      ? lesson.requiredAccuracy * 100
      : 55;
    const isPassed = accuracy >= requiredAccuracy;
    const earnedXP = isPassed ? Math.ceil(accuracy / 10) + lesson.xpReward : 0;

    return (
      <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center">
        <MotionDiv
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-8"
        >
          {isPassed ? (
            <TrophyIcon className="w-24 h-24 text-yellow-400" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center border-4 border-red-500">
              <XIcon className="w-12 h-12 text-red-500" />
            </div>
          )}
        </MotionDiv>

        <h2 className="text-3xl font-black text-white mb-2">
          {isPassed ? 'Lesson Passed!' : 'Lesson Failed'}
        </h2>
        <p className="text-slate-400 mb-8 max-w-xs mx-auto">
          {isPassed
            ? 'You showed great financial wisdom.'
            : `You need ${requiredAccuracy}% accuracy to advance.`}
        </p>

        <div className="flex gap-4 mb-12">
          <div className="bg-slate-900 p-4 rounded-2xl min-w-[100px] border border-slate-800">
            <p className="text-xs text-slate-400 uppercase font-bold">
              XP Earned
            </p>
            <p
              className={`text-2xl font-bold ${
                isPassed ? 'text-yellow-400' : 'text-slate-600'
              }`}
            >
              {isPassed ? `+${earnedXP}` : '0'}
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl min-w-[100px] border border-slate-800">
            <p className="text-xs text-slate-400 uppercase font-bold">
              Accuracy
            </p>
            <p
              className={`text-2xl font-bold ${
                isPassed ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {accuracy}%
            </p>
          </div>
        </div>

        {isPassed ? (
          <button
            onClick={() => handleFinishLesson(earnedXP)}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 rounded-2xl font-bold text-white shadow-lg shadow-emerald-500/20 transition-all mb-4"
          >
            Continue
          </button>
        ) : (
          <>
            <button
              onClick={restartLesson}
              className="w-full py-4 bg-white hover:bg-slate-200 rounded-2xl font-bold text-black shadow-lg transition-all mb-4 flex items-center justify-center gap-2"
            >
              <RetryIcon className="w-5 h-5" />
              Retry Lesson
            </button>
            <button
              onClick={() => {
                playSound('click');
                onExit();
              }}
              className="text-slate-500 font-bold hover:text-white transition-colors"
            >
              Return to Map
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black relative">
      <AnswerGlow status={answerStatus} />
      <AnimatePresence>
        {showPepTalk && <PepTalkModal onFinished={handlePepTalkFinished} />}
      </AnimatePresence>

      <div className="px-4 pt-4 pb-2 flex items-center gap-4">
        <button
          onClick={() => {
            playSound('click');
            onExit();
          }}
          className="p-2 hover:bg-slate-900 rounded-full transition-colors"
        >
          <XIcon className="w-6 h-6 text-slate-400" />
        </button>
        <div className="flex-1 relative h-4 bg-slate-900 rounded-full overflow-hidden">
          <MotionDiv
            className="absolute top-0 left-0 h-full rounded-full transition-colors duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: streak > 3 ? '#f97316' : '#10b981',
            }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        {lesson.isExam ? (
          <div className="flex items-center gap-1">
            <HeartIcon className="w-6 h-6 text-red-500 fill-red-500" />
            <span className="font-bold text-red-500">{hearts}</span>
          </div>
        ) : (
          <div
            className={`flex items-center gap-1 ${
              streak > 0 ? 'text-orange-500' : 'text-slate-600'
            }`}
          >
            <FireIcon
              className={`w-6 h-6 ${
                streak > 3 ? 'fill-orange-500 animate-pulse' : ''
              }`}
            />
            <span className="font-bold">{streak}</span>
          </div>
        )}
      </div>

      <div className="flex-1 px-6 flex flex-col justify-center max-w-2xl mx-auto w-full overflow-visible">
        <AnimatePresence mode="wait">
          <MotionDiv
            key={currentQIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full"
          >
            <h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">
              {currentQuestion.text}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((option, idx) => {
                let stateStyle =
                  'bg-slate-900 border-slate-800 hover:bg-slate-800';
                let animateProps = {};

                if (isAnswered) {
                  if (idx === currentQuestion.correctIndex) {
                    // Correct: Green Glow
                    stateStyle =
                      'bg-emerald-900/80 border-emerald-500 ring-4 ring-emerald-400 shadow-xl shadow-emerald-500/50 z-10 scale-105';
                    animateProps = {};
                  } else if (idx === selectedOption) {
                    // Wrong: Red Glow
                    stateStyle =
                      'bg-red-900/80 border-red-500 ring-4 ring-red-400 shadow-xl shadow-red-500/50 z-10 scale-105';
                    animateProps = { x: [0, -10, 10, -10, 10, 0] };
                  } else {
                    // Others: Dimmed
                    stateStyle =
                      'bg-slate-900 border-slate-800 opacity-50 grayscale';
                  }
                }

                return (
                  <MotionButton
                    key={idx}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={isAnswered}
                    animate={animateProps}
                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ease-in-out flex justify-between items-center ${stateStyle}`}
                  >
                    <span
                      className={`font-semibold ${
                        isAnswered && idx === currentQuestion.correctIndex
                          ? 'text-emerald-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {option}
                    </span>
                    {isAnswered && idx === currentQuestion.correctIndex && (
                      <CheckIcon className="w-5 h-5 text-emerald-400" />
                    )}
                    {isAnswered &&
                      idx === selectedOption &&
                      idx !== currentQuestion.correctIndex && (
                        <XIcon className="w-5 h-5 text-red-400" />
                      )}
                  </MotionButton>
                );
              })}
            </div>
          </MotionDiv>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAnswered && !showPepTalk && (
          <MotionDiv
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className={`p-6 pb-8 border-t-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 backdrop-blur-xl ${
              isCorrect
                ? 'bg-emerald-900/90 border-emerald-500'
                : 'bg-red-900/90 border-red-500'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isCorrect ? 'bg-emerald-100' : 'bg-red-100'
                }`}
              >
                {isCorrect ? (
                  <CheckIcon className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XIcon className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <h3
                  className={`font-black text-xl ${
                    isCorrect ? 'text-emerald-100' : 'text-red-100'
                  }`}
                >
                  {isCorrect ? 'Excellent!' : 'Incorrect'}
                </h3>
                {!isCorrect && (
                  <p className="text-red-200 text-sm">
                    Correct answer:{' '}
                    {currentQuestion.options[currentQuestion.correctIndex]}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleNext}
              className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                isCorrect
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-red-100 text-red-900'
              }`}
            >
              {currentQIndex === lesson.questions.length - 1
                ? 'Finish'
                : 'Continue'}
            </button>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};
