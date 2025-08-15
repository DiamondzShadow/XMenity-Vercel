"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit"
import { ThemeProvider } from "@/components/theme-provider"
import { config } from "@/lib/wagmi-config"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={{
              lightMode: lightTheme({
                accentColor: "#7c3aed",
                accentColorForeground: "white",
                borderRadius: "medium",
                fontStack: "system",
              }),
              darkMode: darkTheme({
                accentColor: "#7c3aed",
                accentColorForeground: "white",
                borderRadius: "medium",
                fontStack: "system",
              }),
            }}
            showRecentTransactions={true}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}
