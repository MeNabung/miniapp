/**
 * Strategy recommendation logic for MeNabung
 */

import type { RiskLevel, StrategyAllocation } from './types';

/** Risk keywords for parsing user messages */
const RISK_KEYWORDS: Record<RiskLevel, string[]> = {
  conservative: [
    'safe',
    'stable',
    'beginner',
    'new',
    'afraid',
    'lose',
    'long-term',
    'careful',
    'conservative',
    'low',
    'low risk',
    'newbie',
    'first time',
    'never tried',
    'not confident',
    'scared',
    'secure',
    'protection',
  ],
  balanced: [
    'balanced',
    'medium',
    'moderate',
    'somewhat',
    'diversify',
    'diversification',
    'middle',
    'normal',
    'standard',
    'average',
    'mix',
  ],
  aggressive: [
    'bold',
    'high return',
    'risk taker',
    'maximum',
    'aggressive',
    'gains',
    'big',
    'high',
    'experienced',
    'expert',
    'pro',
    'maximize',
    'max',
    'full',
    'all in',
    'yolo',
    'moon',
  ],
};

/** Allocation percentages for each risk level: [options, lp, staking] */
const RISK_ALLOCATIONS: Record<RiskLevel, [number, number, number]> = {
  conservative: [20, 50, 30],
  balanced: [40, 40, 20],
  aggressive: [60, 30, 10],
};

/**
 * Parse risk level from user message text
 * @param message - User's message text
 * @returns Detected risk level, defaults to 'balanced' if unclear
 */
export function parseRiskLevel(message: string): RiskLevel {
  const lowerMessage = message.toLowerCase();

  const scores: Record<RiskLevel, number> = {
    conservative: 0,
    balanced: 0,
    aggressive: 0,
  };

  // Score each risk level based on keyword matches
  for (const [level, keywords] of Object.entries(RISK_KEYWORDS) as [RiskLevel, string[]][]) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        scores[level] += 1;
      }
    }
  }

  // Find the level with highest score
  let maxScore = 0;
  let detectedLevel: RiskLevel = 'balanced';

  for (const [level, score] of Object.entries(scores) as [RiskLevel, number][]) {
    if (score > maxScore) {
      maxScore = score;
      detectedLevel = level;
    }
  }

  return detectedLevel;
}

/**
 * Generate allocation percentages based on risk level
 * @param riskLevel - User's risk tolerance
 * @returns Strategy allocation percentages
 */
export function generateAllocation(riskLevel: RiskLevel): StrategyAllocation {
  const [options, lp, staking] = RISK_ALLOCATIONS[riskLevel];
  return { options, lp, staking };
}

/**
 * Calculate actual amounts based on allocation and total value
 * @param allocation - Strategy allocation percentages
 * @param totalAmount - Total amount in IDRX
 * @returns Breakdown with amounts
 */
export function calculateAmounts(
  allocation: StrategyAllocation,
  totalAmount: number
): {
  options: { percentage: number; amount: number };
  lp: { percentage: number; amount: number };
  staking: { percentage: number; amount: number };
} {
  return {
    options: {
      percentage: allocation.options,
      amount: Math.floor((totalAmount * allocation.options) / 100),
    },
    lp: {
      percentage: allocation.lp,
      amount: Math.floor((totalAmount * allocation.lp) / 100),
    },
    staking: {
      percentage: allocation.staking,
      amount: Math.floor((totalAmount * allocation.staking) / 100),
    },
  };
}

/**
 * Format IDRX amount in readable style
 * @param amount - Amount in IDRX
 * @returns Formatted string (e.g., "1.5M IDRX", "500K IDRX")
 */
export function formatIDRX(amount: number): string {
  if (amount >= 1_000_000_000) {
    const value = amount / 1_000_000_000;
    return `${value % 1 === 0 ? value : value.toFixed(1)}B IDRX`;
  }
  if (amount >= 1_000_000) {
    const value = amount / 1_000_000;
    return `${value % 1 === 0 ? value : value.toFixed(1)}M IDRX`;
  }
  if (amount >= 1_000) {
    const value = amount / 1_000;
    return `${value % 1 === 0 ? value : value.toFixed(1)}K IDRX`;
  }
  return `${amount} IDRX`;
}

/**
 * Parse amount from text
 * @param text - Text containing amount (e.g., "5 million", "500k", "5M")
 * @returns Parsed amount in IDRX, or null if not found
 */
export function parseAmountFromText(text: string): number | null {
  const lowerText = text.toLowerCase().replace(/[,\.]/g, '');

  // Match patterns like "5 million", "10m", "500 thousand", "500k", "1b"
  const patterns = [
    { regex: /(\d+(?:\.\d+)?)\s*(?:billion|b)/i, multiplier: 1_000_000_000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:million|m)/i, multiplier: 1_000_000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:thousand|k)/i, multiplier: 1_000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:idrx)/i, multiplier: 1 },
  ];

  for (const { regex, multiplier } of patterns) {
    const match = lowerText.match(regex);
    if (match) {
      return parseFloat(match[1]) * multiplier;
    }
  }

  // Try to find plain numbers (assume IDRX if large enough)
  const plainNumber = text.match(/(\d{4,})/);
  if (plainNumber) {
    return parseInt(plainNumber[1], 10);
  }

  return null;
}

/**
 * Get risk level description
 */
export function getRiskLevelDescription(riskLevel: RiskLevel): string {
  const descriptions: Record<RiskLevel, string> = {
    conservative: 'Conservative - Focus on security and stability',
    balanced: 'Balanced - Balance between growth and safety',
    aggressive: 'Aggressive - Focus on high returns with greater risk',
  };
  return descriptions[riskLevel];
}

/**
 * Validate if allocation percentages sum to 100
 */
export function validateAllocation(allocation: StrategyAllocation): boolean {
  const total = allocation.options + allocation.lp + allocation.staking;
  return total === 100;
}

/** Keywords that indicate user wants to take action / get a strategy recommendation */
const ACTION_INTENT_KEYWORDS = [
  "let's do it",
  "lets do it",
  "help me",
  "do it",
  "start",
  "begin",
  "ready",
  "invest",
  "grow",
  "deposit",
  "allocate",
  "proceed",
  "go ahead",
  "yes",
  "sure",
  "sounds good",
  "let's go",
  "lets go",
  "i'm in",
  "im in",
  "sign me up",
];

/**
 * Detect if user message indicates intent to take action
 * @param message - User's message text
 * @returns true if user expresses action intent
 */
export function detectActionIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return ACTION_INTENT_KEYWORDS.some((keyword) => lowerMessage.includes(keyword));
}
