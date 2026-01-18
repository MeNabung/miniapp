"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import {
  Wallet as WalletComponent,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Identity,
  Avatar,
  Name,
  Address,
} from "@coinbase/onchainkit/identity";
import {
  Wallet,
  TrendingUp,
  Plus,
  Minus,
  RefreshCw,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  useIDRXBalance,
  useUserPosition,
  useUserTotalBalance,
  usePositionBreakdown,
  formatIDRX,
  isContractDeployed,
} from "@/lib/contracts";

// Strategy APY rates
const STRATEGY_APYS = { options: 8, lp: 12, staking: 15 };

// Strategy info
const STRATEGIES = [
  { id: "options", name: "Options", color: "bg-teal" },
  { id: "lp", name: "LP", color: "bg-gold" },
  { id: "staking", name: "Staking", color: "bg-terracotta" },
];

// Growth stages
function getGrowthStage(totalValue: number): number {
  if (totalValue < 10) return 1;
  if (totalValue < 100) return 2;
  if (totalValue < 500) return 3;
  if (totalValue < 1000) return 4;
  return 5;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Contract hooks
  const { data: idrxBalance } = useIDRXBalance(address);
  const { position } = useUserPosition(address);
  const { balance: vaultBalance } = useUserTotalBalance(address);
  const { breakdown } = usePositionBreakdown(address);

  const contractsDeployed = isContractDeployed(chainId);
  const hasDeposits = position && parseFloat(position.totalDeposited) > 0;

  // Calculate portfolio data
  const portfolioData = useMemo(() => {
    if (!contractsDeployed || !hasDeposits || !position) {
      return null;
    }

    const totalValue = parseFloat(vaultBalance);
    const optionsApy = (position.optionsAllocation / 100) * STRATEGY_APYS.options;
    const lpApy = (position.lpAllocation / 100) * STRATEGY_APYS.lp;
    const stakingApy = (position.stakingAllocation / 100) * STRATEGY_APYS.staking;
    const weightedApy = optionsApy + lpApy + stakingApy;

    return {
      totalValue,
      weightedApy: weightedApy.toFixed(1),
      allocations: {
        options: position.optionsAllocation,
        lp: position.lpAllocation,
        staking: position.stakingAllocation,
      },
      values: breakdown
        ? {
            options: parseFloat(breakdown.optionsValue),
            lp: parseFloat(breakdown.lpValue),
            staking: parseFloat(breakdown.stakingValue),
          }
        : {
            options: (totalValue * position.optionsAllocation) / 100,
            lp: (totalValue * position.lpAllocation) / 100,
            staking: (totalValue * position.stakingAllocation) / 100,
          },
    };
  }, [contractsDeployed, hasDeposits, position, vaultBalance, breakdown]);

  const growthStage = portfolioData ? getGrowthStage(portfolioData.totalValue) : 1;

  // Format IDRX balance
  const formattedIDRXBalance = useMemo(() => {
    if (idrxBalance) {
      return formatIDRX(Number(idrxBalance) / 100);
    }
    return "0";
  }, [idrxBalance]);

  // If not connected
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-teal/10 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-teal" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Connect Wallet
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Connect your wallet to view your portfolio
        </p>
        <ConnectWallet />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header with Wallet Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Portfolio</h1>
          <p className="text-xs text-muted-foreground">Track your growth</p>
        </div>
        <WalletComponent>
          <ConnectWallet className="!p-0 !bg-transparent !shadow-none">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-xl">
              <Identity address={address} className="!bg-transparent !p-0">
                <Avatar className="w-6 h-6" />
              </Identity>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Wallet</p>
                <p className="text-sm font-medium tabular-nums">
                  {formattedIDRXBalance} IDRX
                </p>
              </div>
            </div>
          </ConnectWallet>
          <WalletDropdown className="!min-w-[200px]">
            <Identity address={address} className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </WalletComponent>
      </div>

      {/* Main Balance Card */}
      {portfolioData ? (
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
              <p className="text-3xl font-bold text-teal tabular-nums">
                {formatIDRX(portfolioData.totalValue)}
              </p>
              <p className="text-xs text-muted-foreground">IDRX</p>
            </div>
            <div className="flex items-center gap-1 bg-teal/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 text-teal" />
              <span className="text-xs font-medium text-teal">
                +{portfolioData.weightedApy}% APY
              </span>
            </div>
          </div>

          {/* Allocation Progress */}
          <div className="h-2 bg-cream rounded-full overflow-hidden flex">
            {STRATEGIES.map((strategy) => {
              const allocation =
                portfolioData.allocations[
                  strategy.id as keyof typeof portfolioData.allocations
                ];
              if (allocation === 0) return null;
              return (
                <div
                  key={strategy.id}
                  className={`${strategy.color} h-full`}
                  style={{ width: `${allocation}%` }}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-between mt-3 text-xs">
            {STRATEGIES.map((strategy) => {
              const allocation =
                portfolioData.allocations[
                  strategy.id as keyof typeof portfolioData.allocations
                ];
              return (
                <div key={strategy.id} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${strategy.color}`} />
                  <span className="text-muted-foreground">
                    {strategy.name} {allocation}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cream flex items-center justify-center">
            <Plus className="w-6 h-6 text-teal" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            No deposits yet
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Start growing your IDRX
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
          >
            <Sparkles className="w-4 h-4" />
            Get Started
          </Link>
        </div>
      )}

      {/* Strategy Cards */}
      {portfolioData && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">Strategies</h2>
          {STRATEGIES.map((strategy) => {
            const allocation =
              portfolioData.allocations[
                strategy.id as keyof typeof portfolioData.allocations
              ];
            const value =
              portfolioData.values[
                strategy.id as keyof typeof portfolioData.values
              ];
            const apy = STRATEGY_APYS[strategy.id as keyof typeof STRATEGY_APYS];

            return (
              <div
                key={strategy.id}
                className="bg-white border border-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${strategy.color} flex items-center justify-center`}
                    >
                      <span className="text-white text-sm font-medium">
                        {allocation}%
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {strategy.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {apy}% APY
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {formatIDRX(value)}
                    </p>
                    <p className="text-xs text-muted-foreground">IDRX</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Growth Stage */}
      {portfolioData && (
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground">
              Growth Stage
            </h2>
            <span className="text-xs text-muted-foreground">
              Level {growthStage}/5
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((stage) => (
              <div
                key={stage}
                className={`flex-1 h-2 rounded-full ${
                  stage <= growthStage ? "bg-teal" : "bg-cream"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {growthStage < 5 ? "Keep growing!" : "Flourishing!"}
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/deposit"
          className="flex flex-col items-center gap-2 py-4 bg-white border border-border rounded-xl active:bg-cream transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-teal" />
          </div>
          <span className="text-xs font-medium text-foreground">Deposit</span>
        </Link>
        <Link
          href="/withdraw"
          className="flex flex-col items-center gap-2 py-4 bg-white border border-border rounded-xl active:bg-cream transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <Minus className="w-5 h-5 text-gold-dark" />
          </div>
          <span className="text-xs font-medium text-foreground">Withdraw</span>
        </Link>
        <button
          onClick={() => alert("Rebalance coming soon!")}
          className="flex flex-col items-center gap-2 py-4 bg-white border border-border rounded-xl active:bg-cream transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-terracotta" />
          </div>
          <span className="text-xs font-medium text-foreground">Rebalance</span>
        </button>
      </div>

      {/* AI Advisor CTA */}
      <Link
        href="/chat"
        className="flex items-center justify-between p-4 bg-teal rounded-xl text-white active:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">Need advice?</p>
            <p className="text-xs opacity-80">Chat with AI advisor</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 opacity-80" />
      </Link>
    </div>
  );
}
