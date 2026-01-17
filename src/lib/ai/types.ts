/**
 * Type definitions for MeNabung AI Chat system
 */

export type RiskLevel = "conservative" | "balanced" | "aggressive";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface StrategyAllocation {
  /** Percentage allocated to Thetanuts options (0-100) */
  options: number;
  /** Percentage allocated to Liquidity Pool (0-100) */
  lp: number;
  /** Percentage allocated to Staking (0-100) */
  staking: number;
}

export interface AIResponse {
  message: string;
  allocation?: StrategyAllocation;
  riskLevel?: RiskLevel;
  /** Suggested actions for the user */
  suggestedActions?: string[];
}

/** User's current allocation percentages */
export interface UserAllocations {
  /** Percentage allocated to Thetanuts options (0-100) */
  options: number;
  /** Percentage allocated to Liquidity Pool (0-100) */
  lp: number;
  /** Percentage allocated to Staking (0-100) */
  staking: number;
}

/** Wallet context for personalized AI advice */
export interface WalletContext {
  /** IDRX balance in wallet (not deposited) */
  walletBalance: number;
  /** Total IDRX deposited in vault */
  vaultBalance: number;
  /** Current allocation percentages */
  allocations: UserAllocations;
  /** Weighted APY based on current allocation */
  currentApy: number;
  /** Growth stage 1-5 based on portfolio size */
  growthStage: number;
}

export interface ChatRequest {
  messages: ChatMessage[];
  /** Optional: User's wallet address for personalized advice */
  walletAddress?: string;
  /** Optional: User's current portfolio value in IDRX */
  portfolioValue?: number;
  /** Optional: User's wallet context for personalized advice */
  walletContext?: WalletContext;
}

export interface ChatResponse {
  success: boolean;
  response?: AIResponse;
  error?: string;
}

export interface StrategyRequest {
  riskLevel: RiskLevel;
  /** Amount in IDRX */
  amount?: number;
}

export interface StrategyResponse {
  success: boolean;
  allocation?: StrategyAllocation;
  /** Detailed breakdown with amounts if provided */
  breakdown?: {
    options: { percentage: number; amount?: number; description: string };
    lp: { percentage: number; amount?: number; description: string };
    staking: { percentage: number; amount?: number; description: string };
  };
  error?: string;
}
