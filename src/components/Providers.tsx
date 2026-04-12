"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ogNewton } from "@/lib/wagmi";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create both configs inside the component so they are never shared across
  // different Privy sessions (avoids stale connector state from a previous login).
  const [wagmiConfig] = useState(() =>
    createConfig({
      chains: [ogNewton],
      transports: { [ogNewton.id]: http("https://evmrpc-testnet.0g.ai") },
    })
  );

  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          // Don't serve stale data across account switches
          staleTime: 10_000,
          gcTime: 60_000,
        },
      },
    })
  );

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#38bdf8",
        },
        loginMethods: ["email", "google", "wallet"],
        defaultChain: ogNewton,
        supportedChains: [ogNewton],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
