"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import { base } from "wagmi/chains";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { Wallet, Check, Loader2, ChevronLeft } from "lucide-react";
import {
  useUserTotalBalance,
  useWithdraw,
  formatIDRX,
  parseIDRXInput,
  isContractDeployed,
} from "@/lib/contracts";

export default function WithdrawPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Form state
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "withdraw" | "success">("input");

  // Contract hooks
  const { balance: vaultBalance, refetch: refetchBalance } = useUserTotalBalance(address);
  const {
    withdraw,
    isPending: isWithdrawing,
    isConfirming: isWithdrawConfirming,
    isSuccess: isWithdrawSuccess,
    error: withdrawError,
  } = useWithdraw();

  // Handle withdraw success
  useEffect(() => {
    if (isWithdrawSuccess) {
      refetchBalance();
      setStep("success");
    }
  }, [isWithdrawSuccess, refetchBalance]);

  const formattedBalance = useMemo(() => {
    return vaultBalance || "0";
  }, [vaultBalance]);

  const handleMaxClick = () => {
    setAmount(formattedBalance);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.,]/g, "");
    setAmount(value);
  };

  const handleWithdraw = async () => {
    try {
      setStep("withdraw");
      const cleanAmount = parseIDRXInput(amount);
      await withdraw(cleanAmount);
    } catch (err) {
      console.error("Withdraw failed:", err);
      setStep("input");
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
  const isProcessing = isWithdrawing || isWithdrawConfirming;

  // Not connected
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-teal/10 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-teal" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Connect Wallet</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Connect your wallet to withdraw IDRX
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
        <h1 className="text-2xl font-bold text-teal mb-2">Withdrawal Successful!</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your IDRX has been withdrawn to your wallet.
        </p>
        <div className="bg-white border border-border rounded-xl p-4 w-full max-w-xs mb-6">
          <p className="text-xs text-muted-foreground mb-1">Amount Withdrawn</p>
          <p className="text-2xl font-bold text-teal tabular-nums">
            {formatIDRX(parseIDRXInput(amount))} IDRX
          </p>
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
          <h1 className="text-lg font-semibold text-foreground">Withdraw IDRX</h1>
          <p className="text-xs text-muted-foreground">Withdraw from your vault</p>
        </div>
      </div>

      {/* Network warning */}
      {isWrongNetwork && (
        <div className="bg-terracotta/10 border border-terracotta/30 rounded-xl p-3">
          <p className="text-sm text-terracotta">Please switch to Base network to withdraw</p>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Your Vault Balance</span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatIDRX(formattedBalance)} IDRX
          </span>
        </div>
      </div>

      {/* Amount Input */}
      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
        <label className="text-sm font-medium text-foreground">Amount to withdraw</label>
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

      {/* Info */}
      <div className="bg-cream border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground">
          Withdrawing will proportionally reduce your allocations across all strategies.
        </p>
      </div>

      {/* Action Button */}
      <div className="space-y-3">
        <button
          onClick={handleWithdraw}
          disabled={!isValidAmount() || isProcessing || isWrongNetwork || !isContractsDeployed}
          className="w-full py-4 bg-terracotta text-white rounded-xl font-medium disabled:opacity-50 active:scale-98 transition-transform flex items-center justify-center gap-2"
        >
          {isWithdrawing || isWithdrawConfirming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isWithdrawConfirming ? "Confirming..." : "Withdrawing..."}
            </>
          ) : (
            "Withdraw"
          )}
        </button>

        {/* Error display */}
        {withdrawError && (
          <p className="text-sm text-destructive text-center">{withdrawError.message}</p>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        Withdrawal may take a few minutes to process.
      </p>
    </div>
  );
}
