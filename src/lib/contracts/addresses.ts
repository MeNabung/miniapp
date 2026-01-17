import { base } from "wagmi/chains";

/**
 * Contract addresses for MeNabung protocol on Base mainnet
 */

export const IDRX_ADDRESS =
  "0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22" as const;

// Deployed contract addresses on Base mainnet
export const CONTRACT_ADDRESSES = {
  [base.id]: {
    idrx: IDRX_ADDRESS,
    vault: "0x6313640DCF1f30449b80867fFa6Ec2dA112B6Ae8" as const,
    thetanutsAdapter: "0xcAf11Df29AE619D5D5ea0BAFdf28Bc77e375D572" as const,
    aerodromeAdapter: "0x37400c08d59EE6e4Ab600FB7508EEd17ca9157FA" as const,
    stakingAdapter: "0x2dbEF1A046f86a78C014a9FeD5e694CD2a070e19" as const,
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;

export function getContractAddress(
  chainId: number,
  contract: keyof (typeof CONTRACT_ADDRESSES)[typeof base.id],
): `0x${string}` {
  const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return addresses[contract];
}

export function isContractDeployed(chainId: number): boolean {
  return chainId in CONTRACT_ADDRESSES;
}
