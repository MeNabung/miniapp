/**
 * Type definitions for MeNabung Gamification system
 */

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string | null; // ISO date string
  totalCheckIns: number;
}

export type MissionId = 'first_steps' | 'know_yourself' | 'ask_ai' | 'consistent_saver' | 'dedicated_grower';

export interface Mission {
  id: MissionId;
  title: string;
  description: string;
  icon: string; // emoji
  requirement: number; // target value
  progress: number; // current value
  completed: boolean;
  reward: string;
}

export type BadgeId = 'connected' | 'risk_profiled' | 'ai_chatter' | 'streak_3' | 'streak_7';

export interface Badge {
  id: BadgeId;
  name: string;
  icon: string; // emoji
  earnedAt: string | null; // ISO date
}

export interface GamificationState {
  streak: StreakData;
  missions: Mission[];
  badges: Badge[];
}
