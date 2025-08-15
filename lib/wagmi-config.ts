import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { arbitrum, arbitrumSepolia } from "wagmi/chains"

export const config = getDefaultConfig({
  appName: "XMenity Tube",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "your-project-id",
  chains: [arbitrumSepolia, arbitrum],
  ssr: true,
})
