"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { Send, Loader2, Sparkles } from "lucide-react";
import {
  useIDRXBalance,
  useUserPosition,
  useUserTotalBalance,
  isContractDeployed,
} from "@/lib/contracts";
import type {
  ChatMessage,
  AIResponse,
  StrategyAllocation,
  RiskLevel,
  WalletContext,
} from "@/lib/ai/types";
import { saveCustomAllocation } from "@/lib/strategy-storage";

// Initial greeting message
const INITIAL_MESSAGE: ChatMessage = {
  id: "initial",
  role: "assistant",
  content:
    "Welcome to MeNabung! I'm your AI advisor for IDRX growth. Tell me about your goals and how much you'd like to allocate.",
  timestamp: Date.now(),
};

// Risk level labels
const RISK_LABELS: Record<RiskLevel, string> = {
  conservative: "Conservative",
  balanced: "Balanced",
  aggressive: "Aggressive",
};

// Strategy info
const STRATEGY_INFO = {
  options: { name: "Options", description: "Premium yields" },
  lp: { name: "LP", description: "Trading fees" },
  staking: { name: "Staking", description: "Stable rewards" },
};

// Strategy APY rates
const STRATEGY_APYS = { options: 8, lp: 12, staking: 15 };

// Growth stages
function getGrowthStage(totalValue: number): number {
  if (totalValue < 10) return 1;
  if (totalValue < 100) return 2;
  if (totalValue < 500) return 3;
  if (totalValue < 1000) return 4;
  return 5;
}

// Quick action suggestions
const QUICK_ACTIONS = [
  { text: "Safe", action: "I want to invest safely with low risk" },
  { text: "Balanced", action: "Suggest a balanced strategy for me" },
  { text: "High yield", action: "I want maximum returns, aggressive strategy" },
];

export default function ChatPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const chainId = useChainId();

  // Contract hooks for wallet context
  const { data: idrxBalanceRaw } = useIDRXBalance(address);
  const { position } = useUserPosition(address);
  const { balance: vaultBalanceRaw } = useUserTotalBalance(address);

  // Check if contracts are deployed
  const contractsDeployed = isContractDeployed(chainId);

  // Build wallet context for AI
  const walletContext = useMemo((): WalletContext | undefined => {
    if (!contractsDeployed || !address) return undefined;

    const walletBalance = idrxBalanceRaw ? Number(idrxBalanceRaw) / 100 : 0;
    const vaultBalance = parseFloat(vaultBalanceRaw || "0");

    const allocations = position
      ? {
          options: position.optionsAllocation,
          lp: position.lpAllocation,
          staking: position.stakingAllocation,
        }
      : { options: 0, lp: 0, staking: 0 };

    const currentApy =
      vaultBalance > 0
        ? (allocations.options / 100) * STRATEGY_APYS.options +
          (allocations.lp / 100) * STRATEGY_APYS.lp +
          (allocations.staking / 100) * STRATEGY_APYS.staking
        : 0;

    return {
      walletBalance,
      vaultBalance,
      allocations,
      currentApy,
      growthStage: getGrowthStage(vaultBalance),
    };
  }, [contractsDeployed, address, idrxBalanceRaw, vaultBalanceRaw, position]);

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastAllocation, setLastAllocation] =
    useState<StrategyAllocation | null>(null);
  const [lastRiskLevel, setLastRiskLevel] = useState<RiskLevel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            walletContext,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to get AI response");
        }

        if (data.response) {
          const aiResponse: AIResponse = data.response;

          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: aiResponse.message,
            timestamp: Date.now(),
          };

          setMessages((prev) => [...prev, assistantMessage]);

          if (aiResponse.allocation) {
            setLastAllocation(aiResponse.allocation);
          }
          if (aiResponse.riskLevel) {
            setLastRiskLevel(aiResponse.riskLevel);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Network error occurred";
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: `Sorry, I encountered an error: ${errorMessage}`,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [messages, isLoading, walletContext]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleApplyStrategy = () => {
    if (lastAllocation) {
      saveCustomAllocation(lastAllocation);
    }
    router.push("/dashboard");
  };

  // If not connected, show connect prompt
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-teal/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-teal" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Connect to Start
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Connect your wallet to chat with your AI savings advisor
        </p>
        <ConnectWallet />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              AI Advisor
            </h1>
            {lastRiskLevel && (
              <span className="text-xs text-muted-foreground">
                {RISK_LABELS[lastRiskLevel]} profile
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 hide-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" ? (
              <div className="max-w-[85%] bg-white border border-border rounded-2xl rounded-tl-md px-4 py-3">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            ) : (
              <div className="max-w-[85%] bg-teal text-white rounded-2xl rounded-tr-md px-4 py-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-border rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal" />
                <span className="text-sm text-muted-foreground">
                  Analyzing...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Card */}
        {lastAllocation && (
          <div className="bg-white border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-teal mb-3">
              Strategy Allocation
            </h3>
            <div className="space-y-2">
              {Object.entries(STRATEGY_INFO).map(([key, info]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 px-3 bg-cream rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {info.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {info.description}
                    </p>
                  </div>
                  <span className="text-lg font-semibold text-teal tabular-nums">
                    {lastAllocation[key as keyof StrategyAllocation]}%
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={handleApplyStrategy}
              className="w-full mt-4 py-3 bg-teal text-white rounded-xl font-medium active:scale-98 transition-transform"
            >
              Apply Strategy
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions - only show early in conversation */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-border bg-cream">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {QUICK_ACTIONS.map((item) => (
              <button
                key={item.text}
                onClick={() => sendMessage(item.action)}
                className="flex-shrink-0 px-4 py-2 bg-white border border-border rounded-full text-sm text-foreground active:bg-cream-dark transition-colors"
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border bg-white p-4 pb-safe">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about savings..."
            className="flex-1 px-4 py-3 bg-cream border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 bg-teal text-white rounded-xl flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Not financial advice. DYOR.
        </p>
      </div>
    </div>
  );
}
