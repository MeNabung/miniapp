/**
 * Strategy Storage Utility
 *
 * Persists user's strategy allocation and risk profile to localStorage
 * so it can be used across the quiz → chat → deposit flow.
 */

export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';

export interface StrategyAllocation {
  options: number;  // Thetanuts Options percentage
  lp: number;       // Aerodrome LP percentage
  staking: number;  // IDRX Staking percentage
}

export interface SavedStrategy {
  riskProfile: RiskProfile;
  allocation: StrategyAllocation;
  updatedAt: number;
}

// Default allocations based on risk profile
export const DEFAULT_ALLOCATIONS: Record<RiskProfile, StrategyAllocation> = {
  conservative: { options: 20, lp: 30, staking: 50 },
  balanced: { options: 40, lp: 40, staking: 20 },
  aggressive: { options: 50, lp: 35, staking: 15 },
};

const STORAGE_KEY = 'menabung_strategy';

/**
 * Save strategy to localStorage
 */
export function saveStrategy(strategy: SavedStrategy): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(strategy));
  } catch (error) {
    console.error('Failed to save strategy:', error);
  }
}

/**
 * Save strategy from risk profile (uses default allocation)
 */
export function saveStrategyFromProfile(riskProfile: RiskProfile): void {
  saveStrategy({
    riskProfile,
    allocation: DEFAULT_ALLOCATIONS[riskProfile],
    updatedAt: Date.now(),
  });

  // Also save just the risk profile for backwards compatibility
  localStorage.setItem('riskProfile', riskProfile);
}

const CUSTOM_ALLOCATION_KEY = 'menabung_custom_allocation';

/**
 * Save custom allocation (keeps current risk profile)
 */
export function saveCustomAllocation(allocation: StrategyAllocation): void {
  const current = getStrategy();
  saveStrategy({
    riskProfile: current?.riskProfile || 'balanced',
    allocation,
    updatedAt: Date.now(),
  });

  // Also save as custom allocation for deposit page
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CUSTOM_ALLOCATION_KEY, JSON.stringify(allocation));
    } catch (error) {
      console.error('Failed to save custom allocation:', error);
    }
  }
}

/**
 * Get custom allocation from AI chat (if any)
 */
export function getCustomAllocation(): StrategyAllocation | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CUSTOM_ALLOCATION_KEY);
    if (stored) {
      return JSON.parse(stored) as StrategyAllocation;
    }
  } catch (error) {
    console.error('Failed to get custom allocation:', error);
  }

  return null;
}

/**
 * Clear custom allocation after deposit
 */
export function clearCustomAllocation(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CUSTOM_ALLOCATION_KEY);
  } catch (error) {
    console.error('Failed to clear custom allocation:', error);
  }
}

/**
 * Get saved strategy from localStorage
 */
export function getStrategy(): SavedStrategy | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SavedStrategy;
    }

    // Fallback: check for old riskProfile key
    const riskProfile = localStorage.getItem('riskProfile') as RiskProfile | null;
    if (riskProfile && DEFAULT_ALLOCATIONS[riskProfile]) {
      return {
        riskProfile,
        allocation: DEFAULT_ALLOCATIONS[riskProfile],
        updatedAt: Date.now(),
      };
    }
  } catch (error) {
    console.error('Failed to get strategy:', error);
  }

  return null;
}

/**
 * Get allocation or return default
 */
export function getStrategyAllocation(): StrategyAllocation {
  const strategy = getStrategy();
  return strategy?.allocation || DEFAULT_ALLOCATIONS.balanced;
}

/**
 * Get risk profile or return default
 */
export function getRiskProfile(): RiskProfile {
  const strategy = getStrategy();
  return strategy?.riskProfile || 'balanced';
}

/**
 * Clear saved strategy
 */
export function clearStrategy(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('riskProfile');
  } catch (error) {
    console.error('Failed to clear strategy:', error);
  }
}

/**
 * Check if strategy is stale (older than 24 hours)
 */
export function isStrategyStale(): boolean {
  const strategy = getStrategy();
  if (!strategy) return true;

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  return Date.now() - strategy.updatedAt > ONE_DAY_MS;
}

/**
 * Validate that allocation percentages sum to 100
 */
export function isValidAllocation(allocation: StrategyAllocation): boolean {
  return allocation.options + allocation.lp + allocation.staking === 100;
}
