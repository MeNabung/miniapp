"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import { base } from "wagmi/chains";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import {
  Wallet,
  Check,
  Loader2,
  ChevronLeft,
  Target,
  Droplets,
  Lock,
} from "lucide-react";
import {
  useIDRXBalance,
  useIDRXAllowance,
  useApproveIDRX,
  useDeposit,
  formatIDRX,
  parseIDRXInput,
  isContractDeployed,
  IDRX_DECIMALS,
} from "@/lib/contracts";
import { formatUnits, parseUnits } from "viem";
import { getCustomAllocation, clearCustomAllocation } from "@/lib/strategy-storage";

// Strategy allocations based on risk profile
const STRATEGY_ALLOCATIONS = {
  conservative: { options: 20, lp: 30, staking: 50 },
  balanced: { options: 40, lp: 40, staking: 20 },
  aggressive: { options: 50, lp: 35, staking: 15 },
};

type RiskProfile = keyof typeof STRATEGY_ALLOCATIONS;

// Strategy info with APY
const STRATEGY_INFO = [
  { key: "options", name: "Options", icon: Target, apy: 8, color: "text-teal" },
  { key: "lp", name: "LP", icon: Droplets, apy: 12, color: "text-gold-dark" },
  { key: "staking", name: "Staking", icon: Lock, apy: 15, color: "text-terracotta" },
];

export default function DepositPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Form state
  const [amount, setAmount] = useState("");
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("balanced");
  const [customAllocation, setCustomAllocation] = useState<{
    options: number;
    lp: number;
    staking: number;
  } | null>(null);
  const [step, setStep] = useState<"input" | "approve" | "deposit" | "success">("input");

  // Contract hooks
  const { data: balanceData, refetch: refetchBalance } = useIDRXBalance(address);
  const { data: allowanceData, refetch: refetchAllowance } = useIDRXAllowance(address);
  const {
    approve,
    isPending: isApproving,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveError,
  } = useApproveIDRX();
  const {
    deposit,
    isPending: isDepositing,
    isConfirming: isDepositConfirming,
    isSuccess: isDepositSuccess,
    error: depositError,
  } = useDeposit();

  // Load saved risk profile and custom allocation from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("riskProfile") as RiskProfile | null;
    if (saved && STRATEGY_ALLOCATIONS[saved]) {
      setRiskProfile(saved);
    }

    // Check for custom allocation from AI chat
    const custom = getCustomAllocation();
    if (custom) {
      setCustomAllocation(custom);
    }
  }, []);

  // Get current allocation (custom from AI or based on risk profile)
  const allocation = customAllocation || STRATEGY_ALLOCATIONS[riskProfile];

  // Format balance for display
  const formattedBalance = useMemo(() => {
    if (!balanceData) return "0";
    return formatUnits(balanceData, IDRX_DECIMALS);
  }, [balanceData]);

  // Check if amount needs approval
  const needsApproval = useMemo(() => {
    if (!amount || !allowanceData) return true;
    try {
      const amountInWei = parseUnits(parseIDRXInput(amount), IDRX_DECIMALS);
      return allowanceData < amountInWei;
    } catch {
      return true;
    }
  }, [amount, allowanceData]);

  // Calculate strategy breakdown
  const strategyBreakdown = useMemo(() => {
    const parsedAmount = parseFloat(parseIDRXInput(amount)) || 0;
    return STRATEGY_INFO.map((strategy) => ({
      ...strategy,
      percentage: allocation[strategy.key as keyof typeof allocation],
      amount: (parsedAmount * allocation[strategy.key as keyof typeof allocation]) / 100,
    }));
  }, [amount, allocation]);

  // Calculate weighted APY
  const weightedAPY = useMemo(() => {
    return strategyBreakdown
      .reduce((total, strategy) => total + (strategy.apy * strategy.percentage) / 100, 0)
      .toFixed(1);
  }, [strategyBreakdown]);

  // Handle approval success
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance().then(() => {
        setStep("deposit");
      });
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Handle deposit success
  useEffect(() => {
    if (isDepositSuccess) {
      refetchBalance();
      clearCustomAllocation(); // Clear custom allocation after successful deposit
      setStep("success");
    }
  }, [isDepositSuccess, refetchBalance]);

  const handleMaxClick = () => {
    setAmount(formattedBalance);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.,]/g, "");
    setAmount(value);
  };

  const handleApprove = async () => {
    try {
      setStep("approve");
      await approve(parseIDRXInput(amount));
    } catch (err) {
      console.error("Approval failed:", err);
      setStep("input");
    }
  };

  const handleDeposit = async () => {
    try {
      const cleanAmount = parseIDRXInput(amount);
      await deposit(cleanAmount);
    } catch (err) {
      console.error("Deposit failed:", err);
    }
  };

  const isValidAmount = () => {
    if (!amount) return false;
    const parsed = parseFloat(parseIDRXInput(amount));
    const balance = parseFloat(formattedBalance);
    return parsed > 0 && parsed <= balance;
  };

  const isContractsDeployed = isContractDeployed(chainId);
  const isWrongNetwork = chainId !== base.id;
  const isProcessing = isApproving || isApproveConfirming || isDepositing || isDepositConfirming;

  // Not connected
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-teal/10 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-teal" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Connect Wallet</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Connect your wallet to deposit IDRX
        </p>
        <ConnectWallet />
      </div>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="w-20 h-20 mb-6 rounded-full bg-teal/10 flex items-center justify-center">
          <Check className="w-10 h-10 text-teal" />
        </div>
        <h1 className="text-2xl font-bold text-teal mb-2">Deposit Successful!</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your IDRX is now growing across {strategyBreakdown.length} strategies.
        </p>
        <div className="bg-white border border-border rounded-xl p-4 w-full max-w-xs mb-6">
          <p className="text-xs text-muted-foreground mb-1">Amount Deposited</p>
          <p className="text-2xl font-bold text-teal tabular-nums">
            {formatIDRX(parseIDRXInput(amount))} IDRX
          </p>
          <p className="text-sm text-gold-dark mt-1">Est. APY: {weightedAPY}%</p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full max-w-xs py-3 bg-teal text-white rounded-xl font-medium active:scale-95 transition-transform"
        >
          View Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center active:bg-cream transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Deposit IDRX</h1>
          <p className="text-xs text-muted-foreground">Start growing your savings</p>
        </div>
      </div>

      {/* Network warning */}
      {isWrongNetwork && (
        <div className="bg-terracotta/10 border border-terracotta/30 rounded-xl p-3">
          <p className="text-sm text-terracotta">Please switch to Base network to deposit</p>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Your IDRX Balance</span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatIDRX(formattedBalance)} IDRX
          </span>
        </div>
      </div>

      {/* Amount Input */}
      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
        <label className="text-sm font-medium text-foreground">Amount to deposit</label>
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0"
            className="w-full h-14 px-4 pr-20 bg-cream border border-border rounded-xl text-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
            disabled={isProcessing}
          />
          <button
            type="button"
            onClick={handleMaxClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-teal/10 text-teal text-sm font-medium rounded-lg active:bg-teal/20 transition-colors"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Strategy selector - only show if no custom allocation */}
      {!customAllocation && (
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          <label className="text-sm font-medium text-foreground">Your Strategy</label>
          <div className="grid grid-cols-3 gap-2">
            {(["conservative", "balanced", "aggressive"] as const).map((profile) => (
              <button
                key={profile}
                onClick={() => setRiskProfile(profile)}
                disabled={isProcessing}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  riskProfile === profile
                    ? "border-teal bg-teal/10 text-teal"
                    : "border-border bg-white active:border-teal/50"
                }`}
              >
                {profile.charAt(0).toUpperCase() + profile.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom allocation notice */}
      {customAllocation && (
        <div className="bg-teal/10 border border-teal/30 rounded-xl p-3">
          <p className="text-sm text-teal">Using AI-recommended allocation</p>
        </div>
      )}

      {/* Strategy Breakdown */}
      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">Strategy Allocation</span>
          <span className="text-xs font-medium text-gold-dark bg-gold/10 px-2 py-1 rounded-full">
            Est. APY: {weightedAPY}%
          </span>
        </div>

        <div className="space-y-2">
          {strategyBreakdown.map((strategy) => {
            const Icon = strategy.icon;
            return (
              <div
                key={strategy.key}
                className="flex items-center justify-between py-2 px-3 bg-cream rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${strategy.color}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{strategy.name}</p>
                    <p className="text-xs text-muted-foreground">{strategy.apy}% APY</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold tabular-nums ${strategy.color}`}>
                    {strategy.percentage}%
                  </p>
                  {amount && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatIDRX(strategy.amount)} IDRX
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      <div className="space-y-3">
        {step !== "deposit" && needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={!isValidAmount() || isProcessing || isWrongNetwork || !isContractsDeployed}
            className="w-full py-4 bg-gold text-white rounded-xl font-medium disabled:opacity-50 active:scale-98 transition-transform flex items-center justify-center gap-2"
          >
            {isApproving || isApproveConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isApproveConfirming ? "Confirming..." : "Approving..."}
              </>
            ) : (
              "Approve IDRX"
            )}
          </button>
        ) : (
          <button
            onClick={handleDeposit}
            disabled={!isValidAmount() || isProcessing || isWrongNetwork || !isContractsDeployed}
            className="w-full py-4 bg-teal text-white rounded-xl font-medium disabled:opacity-50 active:scale-98 transition-transform flex items-center justify-center gap-2"
          >
            {isDepositing || isDepositConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isDepositConfirming ? "Confirming..." : "Depositing..."}
              </>
            ) : (
              "Deposit"
            )}
          </button>
        )}

        {/* Error display */}
        {(approveError || depositError) && (
          <p className="text-sm text-destructive text-center">
            {approveError?.message || depositError?.message}
          </p>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        Not financial advice. DYOR. Smart contract risks apply.
      </p>
    </div>
  );
}
