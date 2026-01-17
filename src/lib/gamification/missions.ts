/**
 * Mission and Badge definitions for MeNabung Gamification
 */

import type { Mission, Badge, BadgeId } from './types';

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Connect your wallet',
    icon: '👛',
    requirement: 1,
    progress: 0,
    completed: false,
    reward: 'connected',
  },
  {
    id: 'know_yourself',
    title: 'Know Yourself',
    description: 'Complete the risk quiz',
    icon: '🎯',
    requirement: 1,
    progress: 0,
    completed: false,
    reward: 'risk_profiled',
  },
  {
    id: 'ask_ai',
    title: 'Ask the AI',
    description: 'Chat with the AI advisor',
    icon: '🤖',
    requirement: 1,
    progress: 0,
    completed: false,
    reward: 'ai_chatter',
  },
  {
    id: 'consistent_saver',
    title: 'Consistent Saver',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    requirement: 3,
    progress: 0,
    completed: false,
    reward: 'streak_3',
  },
  {
    id: 'dedicated_grower',
    title: 'Dedicated Grower',
    description: 'Maintain a 7-day streak',
    icon: '💎',
    requirement: 7,
    progress: 0,
    completed: false,
    reward: 'streak_7',
  },
];

export const BADGES: Record<BadgeId, Omit<Badge, 'earnedAt'>> = {
  connected: { id: 'connected', name: 'Connected', icon: '👛' },
  risk_profiled: { id: 'risk_profiled', name: 'Risk Profiled', icon: '🎯' },
  ai_chatter: { id: 'ai_chatter', name: 'AI Chatter', icon: '🤖' },
  streak_3: { id: 'streak_3', name: '3-Day Streak', icon: '🔥' },
  streak_7: { id: 'streak_7', name: '7-Day Streak', icon: '💎' },
};
