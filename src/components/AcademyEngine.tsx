
import React from 'react';
import { Lesson, Section } from '../data/AcademyData';
import { LessonScreen } from './LessonScreen';

interface AcademyEngineProps {
  lesson: Lesson;
  section: Section;
  onExit: () => void;
  onComplete: (xp: number) => void;
  onNextLesson: () => void;
  onFail: () => void;
}

export const AcademyEngine: React.FC<AcademyEngineProps> = ({ 
  lesson, 
  section, 
  onExit, 
  onComplete, 
  onNextLesson, 
  onFail 
}) => {
  // No longer need AI fetching or loading states
  return (
    <LessonScreen
      lesson={lesson}
      sectionColor={section.color}
      onExit={onExit}
      onComplete={onComplete}
      onNextLesson={onNextLesson}
      onFail={onFail}
    />
  );
};
