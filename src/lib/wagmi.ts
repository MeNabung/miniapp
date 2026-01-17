"use client";

import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: "MeNabung",
      preference: "smartWalletOnly",
    }),
    injected(),
  ],
  ssr: true,
  transports: {
    [base.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
