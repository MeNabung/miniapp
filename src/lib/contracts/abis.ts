/**
 * Contract ABIs for MeNabung protocol
 *
 * These ABIs are extracted from the Solidity contracts.
 * After compiling with Foundry, you can also get these from:
 * contracts/out/MeNabungVault.sol/MeNabungVault.json
 */

// Standard ERC20 ABI (for IDRX token)
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

// MeNabungVault ABI
export const MENABUNG_VAULT_ABI = [
  // Read functions
  {
    name: 'idrx',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'positions',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalDeposited', type: 'uint256' },
      { name: 'optionsAllocation', type: 'uint256' },
      { name: 'lpAllocation', type: 'uint256' },
      { name: 'stakingAllocation', type: 'uint256' },
      { name: 'lastUpdateTime', type: 'uint256' },
    ],
  },
  {
    name: 'getUserTotalBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getUserPosition',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalDeposited', type: 'uint256' },
      { name: 'optionsAlloc', type: 'uint256' },
      { name: 'lpAlloc', type: 'uint256' },
      { name: 'stakingAlloc', type: 'uint256' },
    ],
  },
  {
    name: 'getPositionBreakdown',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'optionsValue', type: 'uint256' },
      { name: 'lpValue', type: 'uint256' },
      { name: 'stakingValue', type: 'uint256' },
    ],
  },
  {
    name: 'thetanutsAdapter',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'aerodromeAdapter',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'stakingAdapter',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  // Write functions
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'setStrategy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'optionsPercent', type: 'uint256' },
      { name: 'lpPercent', type: 'uint256' },
      { name: 'stakingPercent', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'rebalance',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // Events
  {
    name: 'Deposited',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Withdrawn',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'StrategySet',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'options', type: 'uint256', indexed: false },
      { name: 'lp', type: 'uint256', indexed: false },
      { name: 'staking', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Rebalanced',
    type: 'event',
    inputs: [{ name: 'user', type: 'address', indexed: true }],
  },
] as const;

// IAdapter ABI (for reading adapter balances)
export const ADAPTER_ABI = [
  {
    name: 'getBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'token',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;
