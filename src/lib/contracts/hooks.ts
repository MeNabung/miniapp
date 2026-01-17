'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { base } from 'wagmi/chains';
import { ERC20_ABI, MENABUNG_VAULT_ABI } from './abis';
import { getContractAddress, isContractDeployed, IDRX_ADDRESS } from './addresses';

// IDRX has 2 decimals (Indonesian Rupiah)
const IDRX_DECIMALS = 2;

/**
 * Hook to get IDRX balance of an address
 */
export function useIDRXBalance(address?: `0x${string}`) {
  const chainId = useChainId();

  return useReadContract({
    address: IDRX_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: base.id,
    query: {
      enabled: !!address && chainId === base.id,
    },
  });
}

/**
 * Hook to get IDRX allowance for the vault
 */
export function useIDRXAllowance(owner?: `0x${string}`) {
  const chainId = useChainId();
  const vaultAddress = isContractDeployed(chainId)
    ? getContractAddress(chainId, 'vault')
    : undefined;

  return useReadContract({
    address: IDRX_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner && vaultAddress ? [owner, vaultAddress] : undefined,
    chainId: base.id,
    query: {
      enabled: !!owner && !!vaultAddress && chainId === base.id,
    },
  });
}

/**
 * Hook to approve IDRX spending by the vault
 */
export function useApproveIDRX() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = async (amount: string) => {
    if (!isContractDeployed(chainId)) {
      throw new Error('Contracts not deployed on this network');
    }

    const vaultAddress = getContractAddress(chainId, 'vault');
    const amountInWei = parseUnits(amount, IDRX_DECIMALS);

    writeContract({
      address: IDRX_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [vaultAddress, amountInWei],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to deposit IDRX into the vault
 */
export function useDeposit() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = async (amount: string) => {
    if (!isContractDeployed(chainId)) {
      throw new Error('Contracts not deployed on this network');
    }

    const vaultAddress = getContractAddress(chainId, 'vault');
    const amountInWei = parseUnits(amount, IDRX_DECIMALS);

    writeContract({
      address: vaultAddress,
      abi: MENABUNG_VAULT_ABI,
      functionName: 'deposit',
      args: [amountInWei],
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to set user's strategy allocation
 */
export function useSetStrategy() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setStrategy = async (options: number, lp: number, staking: number) => {
    if (!isContractDeployed(chainId)) {
      throw new Error('Contracts not deployed on this network');
    }

    if (options + lp + staking !== 100) {
      throw new Error('Allocations must sum to 100');
    }

    const vaultAddress = getContractAddress(chainId, 'vault');

    writeContract({
      address: vaultAddress,
      abi: MENABUNG_VAULT_ABI,
      functionName: 'setStrategy',
      args: [BigInt(options), BigInt(lp), BigInt(staking)],
    });
  };

  return {
    setStrategy,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to get user's position in the vault
 */
export function useUserPosition(userAddress?: `0x${string}`) {
  const chainId = useChainId();
  const vaultAddress = isContractDeployed(chainId)
    ? getContractAddress(chainId, 'vault')
    : undefined;

  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: MENABUNG_VAULT_ABI,
    functionName: 'getUserPosition',
    args: userAddress ? [userAddress] : undefined,
    chainId: base.id,
    query: {
      enabled: !!userAddress && !!vaultAddress && chainId === base.id,
    },
  });

  const position = data ? {
    totalDeposited: formatUnits(data[0], IDRX_DECIMALS),
    optionsAllocation: Number(data[1]),
    lpAllocation: Number(data[2]),
    stakingAllocation: Number(data[3]),
  } : null;

  return {
    position,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get user's total balance (with yield)
 */
export function useUserTotalBalance(userAddress?: `0x${string}`) {
  const chainId = useChainId();
  const vaultAddress = isContractDeployed(chainId)
    ? getContractAddress(chainId, 'vault')
    : undefined;

  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: MENABUNG_VAULT_ABI,
    functionName: 'getUserTotalBalance',
    args: userAddress ? [userAddress] : undefined,
    chainId: base.id,
    query: {
      enabled: !!userAddress && !!vaultAddress && chainId === base.id,
    },
  });

  return {
    balance: data ? formatUnits(data, IDRX_DECIMALS) : '0',
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get breakdown of user's position by strategy
 */
export function usePositionBreakdown(userAddress?: `0x${string}`) {
  const chainId = useChainId();
  const vaultAddress = isContractDeployed(chainId)
    ? getContractAddress(chainId, 'vault')
    : undefined;

  const { data, isLoading, error, refetch } = useReadContract({
    address: vaultAddress,
    abi: MENABUNG_VAULT_ABI,
    functionName: 'getPositionBreakdown',
    args: userAddress ? [userAddress] : undefined,
    chainId: base.id,
    query: {
      enabled: !!userAddress && !!vaultAddress && chainId === base.id,
    },
  });

  const breakdown = data ? {
    optionsValue: formatUnits(data[0], IDRX_DECIMALS),
    lpValue: formatUnits(data[1], IDRX_DECIMALS),
    stakingValue: formatUnits(data[2], IDRX_DECIMALS),
  } : null;

  return {
    breakdown,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to withdraw from the vault
 */
export function useWithdraw() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = async (amount: string) => {
    if (!isContractDeployed(chainId)) {
      throw new Error('Contracts not deployed on this network');
    }

    const vaultAddress = getContractAddress(chainId, 'vault');
    const amountInWei = parseUnits(amount, IDRX_DECIMALS);

    writeContract({
      address: vaultAddress,
      abi: MENABUNG_VAULT_ABI,
      functionName: 'withdraw',
      args: [amountInWei],
    });
  };

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to rebalance user's positions
 */
export function useRebalance() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const rebalance = async () => {
    if (!isContractDeployed(chainId)) {
      throw new Error('Contracts not deployed on this network');
    }

    const vaultAddress = getContractAddress(chainId, 'vault');

    writeContract({
      address: vaultAddress,
      abi: MENABUNG_VAULT_ABI,
      functionName: 'rebalance',
      args: [],
    });
  };

  return {
    rebalance,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Helper to format IDRX amounts for display
 */
export function formatIDRX(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Helper to parse IDRX input (handles comma as thousands separator)
 */
export function parseIDRXInput(input: string): string {
  // Remove commas and spaces
  return input.replace(/[,\s]/g, '');
}

export { IDRX_DECIMALS };
