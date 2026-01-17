import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SYSTEM_PROMPT, buildWalletContextPrompt } from '@/lib/ai/prompts';
import {
  parseRiskLevel,
  generateAllocation,
  parseAmountFromText,
  calculateAmounts,
  detectActionIntent,
} from '@/lib/ai/strategy';
import type { ChatMessage, ChatRequest, ChatResponse, AIResponse } from '@/lib/ai/types';

// Lazy initialize OpenAI client
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * POST /api/chat
 * Main chat endpoint for AI conversation
 */
export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body = (await request.json()) as ChatRequest;
    const { messages, portfolioValue, walletContext } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages are required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get the latest user message for analysis
    const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const userMessageContent = latestUserMessage?.content || '';

    // Analyze user message for risk level and amount
    const detectedRiskLevel = parseRiskLevel(userMessageContent);
    const hasActionIntent = detectActionIntent(userMessageContent);

    // Use explicit amount, or fall back to wallet balance if user shows action intent
    let detectedAmount = parseAmountFromText(userMessageContent) || portfolioValue;
    if (!detectedAmount && hasActionIntent && walletContext?.walletBalance) {
      detectedAmount = walletContext.walletBalance;
    }

    // Build context for the AI
    let contextAddition = '';

    // Add wallet context if provided
    if (walletContext) {
      contextAddition += buildWalletContextPrompt(walletContext);
    }

    // Add amount/allocation context if detected
    if (detectedAmount) {
      const allocation = generateAllocation(detectedRiskLevel);
      const breakdown = calculateAmounts(allocation, detectedAmount);
      contextAddition += `\n\n[Context: User mentioned amount ${detectedAmount} IDRX. Detected risk profile: ${detectedRiskLevel}. Suggested breakdown: Options ${breakdown.options.amount} IDRX (${breakdown.options.percentage}%), LP ${breakdown.lp.amount} IDRX (${breakdown.lp.percentage}%), Staking ${breakdown.staking.amount} IDRX (${breakdown.staking.percentage}%)]`;
    }

    // Format messages for OpenAI
    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + contextAddition,
      },
      ...messages.map((msg: ChatMessage) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Call OpenAI API
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json(
        { success: false, error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Build response with optional allocation data
    const response: AIResponse = {
      message: assistantMessage,
    };

    // Include allocation if we detected an amount
    if (detectedAmount) {
      response.allocation = generateAllocation(detectedRiskLevel);
      response.riskLevel = detectedRiskLevel;
    }

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('Chat API error:', error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat
 * Health check endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    service: 'MeNabung AI Chat',
    hasApiKey: !!process.env.OPENAI_API_KEY,
  });
}
