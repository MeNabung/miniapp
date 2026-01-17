"use client";

import { useState, useCallback } from "react";
import type {
  ChatMessage,
  ChatResponse,
  AIResponse,
  RiskLevel,
  StrategyAllocation,
  WalletContext,
} from "./types";

interface UseChatOptions {
  /** Initial messages to populate the chat */
  initialMessages?: ChatMessage[];
  /** User's portfolio value in IDRX for context */
  portfolioValue?: number;
  /** User's wallet context for personalized advice */
  walletContext?: WalletContext;
  /** Callback when AI responds */
  onResponse?: (response: AIResponse) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  lastAllocation: StrategyAllocation | null;
  lastRiskLevel: RiskLevel | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  resetError: () => void;
}

/**
 * React hook for interacting with MeNabung AI chat
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    initialMessages = [],
    portfolioValue,
    walletContext,
    onResponse,
    onError,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAllocation, setLastAllocation] =
    useState<StrategyAllocation | null>(null);
  const [lastRiskLevel, setLastRiskLevel] = useState<RiskLevel | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setIsLoading(true);
      setError(null);

      // Add user message to state
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: updatedMessages,
            portfolioValue,
            walletContext,
          }),
        });

        const data: ChatResponse = await response.json();

        if (!response.ok || !data.success) {
          const errorMessage = data.error || "Failed to get AI response";
          setError(errorMessage);
          onError?.(errorMessage);
          return;
        }

        if (data.response) {
          // Add assistant message to state
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.response.message,
            timestamp: Date.now(),
          };

          setMessages((prev) => [...prev, assistantMessage]);

          // Update allocation if provided
          if (data.response.allocation) {
            setLastAllocation(data.response.allocation);
          }
          if (data.response.riskLevel) {
            setLastRiskLevel(data.response.riskLevel);
          }

          onResponse?.(data.response);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Network error";
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, portfolioValue, walletContext, onResponse, onError],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastAllocation(null);
    setLastRiskLevel(null);
    setError(null);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    lastAllocation,
    lastRiskLevel,
    sendMessage,
    clearMessages,
    resetError,
  };
}

/**
 * Fetch strategy recommendation based on risk level
 */
export async function getStrategy(
  riskLevel: RiskLevel,
  amount?: number,
): Promise<{
  success: boolean;
  allocation?: StrategyAllocation;
  breakdown?: {
    options: { percentage: number; amount?: number; description: string };
    lp: { percentage: number; amount?: number; description: string };
    staking: { percentage: number; amount?: number; description: string };
  };
  error?: string;
}> {
  try {
    const response = await fetch("/api/strategy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ riskLevel, amount }),
    });

    return await response.json();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Fetch all available strategies
 */
export async function getAllStrategies(): Promise<{
  success: boolean;
  strategies?: Array<{
    riskLevel: RiskLevel;
    description: string;
    allocation: StrategyAllocation;
  }>;
  error?: string;
}> {
  try {
    const response = await fetch("/api/strategy");
    return await response.json();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
