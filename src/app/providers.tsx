"use client";

import {
  ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "wagmi/chains";
import { wagmiConfig } from "@/lib/wagmi";
import { sdk } from "@farcaster/miniapp-sdk";

const queryClient = new QueryClient();

// Farcaster context - using generic type since SDK context is a Promise
interface FarcasterContextType {
  context: Awaited<typeof sdk.context> | null;
  isInMiniApp: boolean;
  isReady: boolean;
}

const FarcasterContext = createContext<FarcasterContextType>({
  context: null,
  isInMiniApp: false,
  isReady: false,
});

export function useFarcaster() {
  return useContext(FarcasterContext);
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [farcasterState, setFarcasterState] = useState<FarcasterContextType>({
    context: null,
    isInMiniApp: false,
    isReady: false,
  });

  useEffect(() => {
    const init = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error("SDK timeout")), 3000),
        );

        const inMiniApp = await Promise.race([
          sdk.isInMiniApp(),
          timeoutPromise,
        ]).catch(() => false);

        if (inMiniApp) {
          // Signal to the host that the app is ready IMMEDIATELY
          sdk.actions.ready();

          // Get context (don't await, just set it when ready)
          sdk.context
            .then((context) => {
              setFarcasterState({
                context,
                isInMiniApp: true,
                isReady: true,
              });
            })
            .catch(() => {
              setFarcasterState({
                context: null,
                isInMiniApp: true,
                isReady: true,
              });
            });
        } else {
          // Not in mini-app, still mark as ready for web preview
          setFarcasterState({
            context: null,
            isInMiniApp: false,
            isReady: true,
          });
        }
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error);
        setFarcasterState({
          context: null,
          isInMiniApp: false,
          isReady: true,
        });
      }
    };

    init();
  }, []);

  return (
    <FarcasterContext.Provider value={farcasterState}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <OnchainKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={base}
            config={{
              appearance: {
                name: "MeNabung",
                logo: "/icon.png",
                mode: "auto",
                theme: "default",
              },
              wallet: {
                display: "modal",
              },
            }}
          >
            {children}
          </OnchainKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </FarcasterContext.Provider>
  );
}
