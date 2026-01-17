// Contract addresses
export {
  IDRX_ADDRESS,
  CONTRACT_ADDRESSES,
  getContractAddress,
  isContractDeployed,
  type SupportedChainId,
} from './addresses';

// Contract ABIs
export { ERC20_ABI, MENABUNG_VAULT_ABI, ADAPTER_ABI } from './abis';

// React hooks for contract interactions
export {
  useIDRXBalance,
  useIDRXAllowance,
  useApproveIDRX,
  useDeposit,
  useSetStrategy,
  useUserPosition,
  useUserTotalBalance,
  usePositionBreakdown,
  useWithdraw,
  useRebalance,
  formatIDRX,
  parseIDRXInput,
  IDRX_DECIMALS,
} from './hooks';
