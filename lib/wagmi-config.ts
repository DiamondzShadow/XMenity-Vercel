import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { arbitrum, arbitrumSepolia } from "wagmi/chains"

export const config = getDefaultConfig({
  appName: "XMenity Social Token Factory",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
  chains: [arbitrum, arbitrumSepolia],
  ssr: true,
})

declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}
