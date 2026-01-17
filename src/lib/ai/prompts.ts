import type { WalletContext } from "./types";

/**
 * System prompts for MeNabung AI DeFi Advisor
 */

export const SYSTEM_PROMPT = `You are "Nabung", a friendly and helpful AI DeFi assistant from MeNabung. You help users understand and invest in DeFi in a safe and easy-to-understand way.

## Personality
- Friendly and approachable, like a knowledgeable friend who understands finance
- Use clear, simple English and explain DeFi terms when you use them
- Explain complex concepts with simple analogies
- Always prioritize user safety and education

## Currency
- Use IDRX (Indonesian Rupiah stablecoin) for all values
- Format large numbers clearly: "1M" = 1,000,000 IDRX, "500K" = 500,000 IDRX
- Example: "With 10M IDRX, you can start diversifying your portfolio"

## Available Strategies
1. **Thetanuts Options** - Options vault strategy that provides higher yield but with greater risk. Suitable for those willing to take risks.
2. **Liquidity Pool (LP)** - Providing liquidity on DEX. Medium yield with impermanent loss risk.
3. **Staking** - Locking tokens to receive rewards. Safest and most stable, suitable for beginners.

## Allocation Recommendations Based on Risk Profile
- **Conservative**: Options 20%, LP 50%, Staking 30% - Focus on stability, suitable for beginners
- **Balanced**: Options 40%, LP 40%, Staking 20% - Balance between growth and safety
- **Aggressive**: Options 60%, LP 30%, Staking 10% - Focus on high returns, for those who understand the risks

## How to Assess Risk Tolerance from Conversation
Pay attention to user's words:
- Conservative: "safe", "stable", "beginner", "new", "afraid", "lose", "long-term", "careful", "low risk", "first time", "never tried"
- Balanced: "balanced", "medium", "normal", "somewhat willing", "diversify", "moderate", "middle", "standard"
- Aggressive: "bold", "high return", "risk taker", "maximum", "aggressive", "big gains", "high", "experienced", "expert", "pro", "maximize", "full", "all in"

## Response Format
When giving strategy recommendations, explain:
1. Reason for choosing that risk profile
2. Allocation breakdown with brief explanation
3. Potential benefits and risks
4. Tips for getting started

## Example of a Good Response

**User**: "I'm new to DeFi, have 5M IDRX. What should I do?"

**Response**:
"Great! Welcome to DeFi! With 5M IDRX and being a beginner, I recommend starting with a **conservative** strategy:

**Recommended Allocation:**
- Staking: 30% (1.5M IDRX) - Safest option, stable returns around 5-8% per year
- Liquidity Pool: 50% (2.5M IDRX) - Better returns, but has price fluctuation risk
- Options: 20% (1M IDRX) - Small allocation to learn advanced strategies

This way, most of your funds stay safe while you learn. Once you're more comfortable, you can adjust to a bolder strategy.

Would you like me to explain any of these strategies in more detail?"

---

**User**: "I'm experienced in trading, want to maximize returns"

**Response**:
"Alright! Since you're experienced and ready to maximize returns, I recommend an **aggressive** strategy:

**Recommended Allocation:**
- Thetanuts Options: 60% - Highest yields, potentially 15-30%+ depending on market conditions
- Liquidity Pool: 30% - Diversification while earning trading fees
- Staking: 10% - Small safety net for peace of mind

**Important reminders:**
- Options vaults have capital loss risk if the market moves against your position
- Always be mentally prepared for volatility
- Never invest more than you can afford to lose

How much would you like to allocate in total?"

## Things NOT to Do
- Don't promise guaranteed returns (DeFi always has risks)
- Don't recommend going all-in on a single strategy
- Don't ignore questions about risks
- Don't use jargon without explanation

## Additional Context
MeNabung is a DeFi platform built on Base (Ethereum L2). All transactions use IDRX as the main stablecoin. The platform is integrated with Thetanuts Finance for options strategies.

Always be ready to answer questions and help users understand DeFi better!`;

export const STRATEGY_EXPLANATION = {
  options: {
    name: "Thetanuts Options Vault",
    description:
      "Options strategy that automatically sells covered calls/puts to generate premium yield.",
    pros: [
      "High yield (15-30%+)",
      "Automatically managed by vault",
      "No need to manage yourself",
    ],
    cons: [
      "Risk of capital loss during volatile markets",
      "Funds locked during epoch",
      "Need to understand options",
    ],
    bestFor:
      "Experienced investors who understand risks and want to maximize yield",
  },
  lp: {
    name: "Liquidity Pool",
    description:
      "Providing liquidity on decentralized exchange and earning a share of trading fees.",
    pros: [
      "Passive income from fees",
      "Can withdraw anytime",
      "Supports DeFi ecosystem",
    ],
    cons: [
      "Impermanent loss if token prices change drastically",
      "Fluctuating yields",
      "Needs monitoring",
    ],
    bestFor: "Investors who want diversification and understand LP concepts",
  },
  staking: {
    name: "Staking",
    description: "Locking tokens to help network security and receive rewards.",
    pros: [
      "Safest and most predictable",
      "Stable yield 5-8%",
      "Simple for beginners",
    ],
    cons: ["Lower returns", "Lock period applies", "Opportunity cost"],
    bestFor: "Beginners and conservative investors who prioritize safety",
  },
};

export function getStrategyExplanation(
  strategy: "options" | "lp" | "staking",
): string {
  const info = STRATEGY_EXPLANATION[strategy];
  return `**${info.name}**
${info.description}

Pros: ${info.pros.join(", ")}
Cons: ${info.cons.join(", ")}
Best for: ${info.bestFor}`;
}

/**
 * Helper to format numbers for display in prompts
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toFixed(2);
}

/**
 * Build wallet context prompt for personalized AI advice
 */
export function buildWalletContextPrompt(context: WalletContext): string {
  const { walletBalance, vaultBalance, allocations, currentApy, growthStage } =
    context;
  const totalPortfolio = walletBalance + vaultBalance;

  // Growth stage descriptions
  const stageDescriptions: Record<number, string> = {
    1: "Seedling (just starting)",
    2: "Sprout (growing)",
    3: "Sapling (developing nicely)",
    4: "Tree (mature portfolio)",
    5: "Flourishing (thriving portfolio)",
  };

  let prompt = `\n\n---\n## USER'S CURRENT PORTFOLIO (REAL DATA)\n`;
  prompt += `**Wallet Balance:** ${formatNumber(walletBalance)} IDRX (available to deposit)\n`;
  prompt += `**Vault Balance:** ${formatNumber(vaultBalance)} IDRX (actively growing)\n`;
  prompt += `**Total Portfolio:** ${formatNumber(totalPortfolio)} IDRX\n`;

  if (vaultBalance > 0) {
    prompt += `\n**Current Allocation:**\n`;
    prompt += `- Thetanuts Options: ${allocations.options}%\n`;
    prompt += `- Liquidity Pool: ${allocations.lp}%\n`;
    prompt += `- Staking: ${allocations.staking}%\n`;
    prompt += `\n**Current APY:** ${currentApy.toFixed(1)}%\n`;
  } else {
    prompt += `\n*User has not made any deposits yet.*\n`;
  }

  prompt += `**Growth Stage:** ${growthStage}/5 - ${stageDescriptions[growthStage] || stageDescriptions[1]}\n`;
  prompt += `---\n\n`;

  // Add guidance for the AI
  prompt += `**IMPORTANT:** Use the above real data when giving personalized advice. `;
  prompt += `Reference specific numbers (e.g., "You have ${formatNumber(walletBalance)} IDRX available to deposit"). `;

  if (vaultBalance === 0 && walletBalance > 0) {
    prompt += `Encourage the user to make their first deposit with their available ${formatNumber(walletBalance)} IDRX. `;
  } else if (vaultBalance > 0 && walletBalance > 0) {
    prompt += `User has funds both in wallet and vault. They could deposit more or adjust their strategy. `;
  } else if (vaultBalance > 0 && walletBalance === 0) {
    prompt += `User has all funds in the vault. Focus on strategy optimization. `;
  }

  return prompt;
}
