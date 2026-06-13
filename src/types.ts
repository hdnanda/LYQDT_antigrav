
import React from 'react';

export interface Impact {
  health: number;
  wealth: number;
}

export interface SwipeAction {
  action: string;
  impact: Impact;
}

export interface SwiperCard {
  card_id: string;
  scenario_text: string;
  left_swipe: SwipeAction;
  right_swipe: SwipeAction;
}

export interface Level {
  level_id: string;
  type: 'quiz' | 'lesson';
  question: string;
  options: string[];
  correct_index: number;
  xp_reward: number;
}

export interface Unit {
  unit_id: string;
  levels: Level[];
}

export interface DailyPage {
  page_num: number;
  text: string;
  choices: string[];
}

export interface DailyScenario {
  date: string;
  story_id: string;
  pages: DailyPage[];
  leaderboard_metric: string;
}

export type GameMode = 'swiper' | 'academy' | 'daily';

export interface GameModeConfig {
  id: GameMode;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  accentColor: string;
}
