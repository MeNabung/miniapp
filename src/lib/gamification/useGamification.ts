'use client';

import { useState, useCallback, useEffect } from 'react';
import type { GamificationState, MissionId, BadgeId, StreakData, Mission, Badge } from './types';
import { INITIAL_MISSIONS, BADGES } from './missions';

const STORAGE_KEY = 'menabung_gamification';

function getInitialState(): GamificationState {
  return {
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckIn: null,
      totalCheckIns: 0,
    },
    missions: INITIAL_MISSIONS.map((m) => ({ ...m })),
    badges: Object.values(BADGES).map((b) => ({ ...b, earnedAt: null })),
  };
}

function loadState(): GamificationState {
  if (typeof window === 'undefined') {
    return getInitialState();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as GamificationState;
      // Merge with initial state to ensure new missions/badges are included
      return {
        streak: parsed.streak || getInitialState().streak,
        missions: INITIAL_MISSIONS.map((initialMission) => {
          const savedMission = parsed.missions?.find((m) => m.id === initialMission.id);
          return savedMission || { ...initialMission };
        }),
        badges: Object.values(BADGES).map((badge) => {
          const savedBadge = parsed.badges?.find((b) => b.id === badge.id);
          return savedBadge || { ...badge, earnedAt: null };
        }),
      };
    }
  } catch {
    // Invalid JSON, return initial state
  }

  return getInitialState();
}

function saveState(state: GamificationState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage might be full or disabled
  }
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isConsecutiveDay(lastDate: Date, currentDate: Date): boolean {
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(lastDate, yesterday);
}

interface UseGamificationReturn {
  state: GamificationState;
  checkIn: () => { streakUpdated: boolean; newStreak: number };
  completeMission: (id: MissionId) => { completed: boolean; badgeAwarded: BadgeId | null };
  updateMissionProgress: (id: MissionId, progress: number) => void;
  getBadge: (id: BadgeId) => Badge | undefined;
  getMission: (id: MissionId) => Mission | undefined;
}

/**
 * React hook for managing gamification state
 */
export function useGamification(): UseGamificationReturn {
  const [state, setState] = useState<GamificationState>(getInitialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    setState(loadState());
    setIsInitialized(true);
  }, []);

  // Save state to localStorage whenever it changes (after initialization)
  useEffect(() => {
    if (isInitialized) {
      saveState(state);
    }
  }, [state, isInitialized]);

  const checkIn = useCallback((): { streakUpdated: boolean; newStreak: number } => {
    const now = new Date();
    const today = now.toISOString();

    let streakUpdated = false;
    let newStreak = state.streak.currentStreak;

    setState((prev) => {
      const lastCheckIn = prev.streak.lastCheckIn ? new Date(prev.streak.lastCheckIn) : null;

      // If already checked in today, do nothing
      if (lastCheckIn && isSameDay(lastCheckIn, now)) {
        return prev;
      }

      let updatedStreak: StreakData;

      if (lastCheckIn && isConsecutiveDay(lastCheckIn, now)) {
        // Consecutive day - increment streak
        const nextStreak = prev.streak.currentStreak + 1;
        updatedStreak = {
          currentStreak: nextStreak,
          longestStreak: Math.max(prev.streak.longestStreak, nextStreak),
          lastCheckIn: today,
          totalCheckIns: prev.streak.totalCheckIns + 1,
        };
        newStreak = nextStreak;
      } else {
        // Streak broken or first check-in - reset to 1
        updatedStreak = {
          currentStreak: 1,
          longestStreak: Math.max(prev.streak.longestStreak, 1),
          lastCheckIn: today,
          totalCheckIns: prev.streak.totalCheckIns + 1,
        };
        newStreak = 1;
      }

      streakUpdated = true;

      // Update streak-based missions
      const updatedMissions = prev.missions.map((mission) => {
        if (mission.id === 'consistent_saver' || mission.id === 'dedicated_grower') {
          return {
            ...mission,
            progress: updatedStreak.currentStreak,
            completed: mission.completed || updatedStreak.currentStreak >= mission.requirement,
          };
        }
        return mission;
      });

      // Award streak badges
      const updatedBadges = prev.badges.map((badge) => {
        if (badge.id === 'streak_3' && !badge.earnedAt && updatedStreak.currentStreak >= 3) {
          return { ...badge, earnedAt: today };
        }
        if (badge.id === 'streak_7' && !badge.earnedAt && updatedStreak.currentStreak >= 7) {
          return { ...badge, earnedAt: today };
        }
        return badge;
      });

      return {
        streak: updatedStreak,
        missions: updatedMissions,
        badges: updatedBadges,
      };
    });

    return { streakUpdated, newStreak };
  }, [state.streak.currentStreak, state.streak.lastCheckIn]);

  const completeMission = useCallback(
    (id: MissionId): { completed: boolean; badgeAwarded: BadgeId | null } => {
      let wasCompleted = false;
      let badgeAwarded: BadgeId | null = null;

      setState((prev) => {
        const mission = prev.missions.find((m) => m.id === id);
        if (!mission || mission.completed) {
          return prev;
        }

        wasCompleted = true;
        const today = new Date().toISOString();

        const updatedMissions = prev.missions.map((m) =>
          m.id === id ? { ...m, progress: m.requirement, completed: true } : m
        );

        const updatedBadges = prev.badges.map((badge) => {
          if (badge.id === mission.reward && !badge.earnedAt) {
            badgeAwarded = badge.id;
            return { ...badge, earnedAt: today };
          }
          return badge;
        });

        return {
          ...prev,
          missions: updatedMissions,
          badges: updatedBadges,
        };
      });

      return { completed: wasCompleted, badgeAwarded };
    },
    []
  );

  const updateMissionProgress = useCallback((id: MissionId, progress: number): void => {
    setState((prev) => {
      const mission = prev.missions.find((m) => m.id === id);
      if (!mission || mission.completed) {
        return prev;
      }

      const newProgress = Math.min(progress, mission.requirement);
      const isNowComplete = newProgress >= mission.requirement;
      const today = new Date().toISOString();

      const updatedMissions = prev.missions.map((m) =>
        m.id === id ? { ...m, progress: newProgress, completed: isNowComplete } : m
      );

      // Award badge if mission completed
      let updatedBadges = prev.badges;
      if (isNowComplete) {
        updatedBadges = prev.badges.map((badge) => {
          if (badge.id === mission.reward && !badge.earnedAt) {
            return { ...badge, earnedAt: today };
          }
          return badge;
        });
      }

      return {
        ...prev,
        missions: updatedMissions,
        badges: updatedBadges,
      };
    });
  }, []);

  const getBadge = useCallback(
    (id: BadgeId): Badge | undefined => {
      return state.badges.find((b) => b.id === id);
    },
    [state.badges]
  );

  const getMission = useCallback(
    (id: MissionId): Mission | undefined => {
      return state.missions.find((m) => m.id === id);
    },
    [state.missions]
  );

  return {
    state,
    checkIn,
    completeMission,
    updateMissionProgress,
    getBadge,
    getMission,
  };
}
