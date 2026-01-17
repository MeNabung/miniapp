import { NextRequest, NextResponse } from 'next/server';
import {
  generateAllocation,
  calculateAmounts,
  formatIDRX,
  getRiskLevelDescription,
  validateAllocation,
} from '@/lib/ai/strategy';
import { STRATEGY_EXPLANATION } from '@/lib/ai/prompts';
import type { RiskLevel, StrategyRequest, StrategyResponse } from '@/lib/ai/types';

const VALID_RISK_LEVELS: RiskLevel[] = ['conservative', 'balanced', 'aggressive'];

/**
 * POST /api/strategy
 * Get recommended strategy allocation based on risk level
 */
export async function POST(request: NextRequest): Promise<NextResponse<StrategyResponse>> {
  try {
    const body = (await request.json()) as StrategyRequest;
    const { riskLevel, amount } = body;

    // Validate risk level
    if (!riskLevel) {
      return NextResponse.json(
        { success: false, error: 'Risk level is required' },
        { status: 400 }
      );
    }

    if (!VALID_RISK_LEVELS.includes(riskLevel)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid risk level. Must be one of: ${VALID_RISK_LEVELS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Generate allocation
    const allocation = generateAllocation(riskLevel);

    // Validate allocation adds up to 100%
    if (!validateAllocation(allocation)) {
      console.error('Allocation validation failed:', allocation);
      return NextResponse.json(
        { success: false, error: 'Internal error: Invalid allocation calculation' },
        { status: 500 }
      );
    }

    // Build response
    const response: StrategyResponse = {
      success: true,
      allocation,
    };

    // Include breakdown with amounts if amount provided
    if (amount && amount > 0) {
      const calculated = calculateAmounts(allocation, amount);
      response.breakdown = {
        options: {
          percentage: calculated.options.percentage,
          amount: calculated.options.amount,
          description: `${STRATEGY_EXPLANATION.options.name} - ${formatIDRX(calculated.options.amount)}`,
        },
        lp: {
          percentage: calculated.lp.percentage,
          amount: calculated.lp.amount,
          description: `${STRATEGY_EXPLANATION.lp.name} - ${formatIDRX(calculated.lp.amount)}`,
        },
        staking: {
          percentage: calculated.staking.percentage,
          amount: calculated.staking.amount,
          description: `${STRATEGY_EXPLANATION.staking.name} - ${formatIDRX(calculated.staking.amount)}`,
        },
      };
    } else {
      // Provide breakdown without amounts
      response.breakdown = {
        options: {
          percentage: allocation.options,
          description: STRATEGY_EXPLANATION.options.description,
        },
        lp: {
          percentage: allocation.lp,
          description: STRATEGY_EXPLANATION.lp.description,
        },
        staking: {
          percentage: allocation.staking,
          description: STRATEGY_EXPLANATION.staking.description,
        },
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Strategy API error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/strategy
 * Get all available risk levels and their allocations
 */
export async function GET(): Promise<NextResponse> {
  const strategies = VALID_RISK_LEVELS.map((level) => ({
    riskLevel: level,
    description: getRiskLevelDescription(level),
    allocation: generateAllocation(level),
    strategyDetails: {
      options: {
        name: STRATEGY_EXPLANATION.options.name,
        pros: STRATEGY_EXPLANATION.options.pros,
        cons: STRATEGY_EXPLANATION.options.cons,
        bestFor: STRATEGY_EXPLANATION.options.bestFor,
      },
      lp: {
        name: STRATEGY_EXPLANATION.lp.name,
        pros: STRATEGY_EXPLANATION.lp.pros,
        cons: STRATEGY_EXPLANATION.lp.cons,
        bestFor: STRATEGY_EXPLANATION.lp.bestFor,
      },
      staking: {
        name: STRATEGY_EXPLANATION.staking.name,
        pros: STRATEGY_EXPLANATION.staking.pros,
        cons: STRATEGY_EXPLANATION.staking.cons,
        bestFor: STRATEGY_EXPLANATION.staking.bestFor,
      },
    },
  }));

  return NextResponse.json({
    success: true,
    strategies,
  });
}
