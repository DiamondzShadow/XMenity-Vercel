'use client';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { arbitrum } from 'wagmi/chains';
import { ThirdwebProvider } from 'thirdweb/react';
import { client } from '@/lib/web3';

import '@rainbow-me/rainbowkit/styles.css';

// Wagmi configuration
const config = getDefaultConfig({
  appName: 'XMenity Social Token Factory',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'fallback-project-id',
  chains: [arbitrum],
  ssr: true,
});

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RainbowKitProvider
            theme={{
              lightMode: {
                ...getDefaultConfig({}).theme,
                colors: {
                  accentColor: '#7c3aed',
                  accentColorForeground: 'white',
                  actionButtonBorder: 'transparent',
                  actionButtonBorderMobile: 'transparent',
                  actionButtonSecondaryBackground: 'rgba(124, 58, 237, 0.1)',
                  closeButton: '#7c3aed',
                  closeButtonBackground: 'rgba(124, 58, 237, 0.1)',
                  connectButtonBackground: '#7c3aed',
                  connectButtonBackgroundError: '#ef4444',
                  connectButtonInnerBackground: 'linear-gradient(0deg, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.2))',
                  connectButtonText: 'white',
                  connectButtonTextError: 'white',
                  connectionIndicator: '#10b981',
                  downloadBottomCardBackground: 'linear-gradient(126deg, rgba(124, 58, 237, 0.1) 9.49%, rgba(124, 58, 237, 0.2) 71.04%), #ffffff',
                  downloadTopCardBackground: 'linear-gradient(126deg, rgba(124, 58, 237, 0.1) 9.49%, rgba(124, 58, 237, 0.2) 71.04%), #ffffff',
                  error: '#ef4444',
                  generalBorder: 'rgba(124, 58, 237, 0.1)',
                  generalBorderDim: 'rgba(124, 58, 237, 0.05)',
                  menuItemBackground: 'rgba(124, 58, 237, 0.05)',
                  modalBackdrop: 'rgba(0, 0, 0, 0.5)',
                  modalBackground: '#ffffff',
                  modalBorder: 'rgba(124, 58, 237, 0.1)',
                  modalText: '#1f2937',
                  modalTextDim: '#6b7280',
                  modalTextSecondary: '#374151',
                  profileAction: 'rgba(124, 58, 237, 0.1)',
                  profileActionHover: 'rgba(124, 58, 237, 0.2)',
                  profileForeground: '#ffffff',
                  selectedOptionBorder: '#7c3aed',
                  standby: '#fbbf24',
                },
              },
              darkMode: {
                ...getDefaultConfig({}).theme,
                colors: {
                  accentColor: '#8b5cf6',
                  accentColorForeground: 'white',
                  actionButtonBorder: 'transparent',
                  actionButtonBorderMobile: 'transparent',
                  actionButtonSecondaryBackground: 'rgba(139, 92, 246, 0.1)',
                  closeButton: '#8b5cf6',
                  closeButtonBackground: 'rgba(139, 92, 246, 0.1)',
                  connectButtonBackground: '#8b5cf6',
                  connectButtonBackgroundError: '#ef4444',
                  connectButtonInnerBackground: 'linear-gradient(0deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.2))',
                  connectButtonText: 'white',
                  connectButtonTextError: 'white',
                  connectionIndicator: '#10b981',
                  downloadBottomCardBackground: 'linear-gradient(126deg, rgba(139, 92, 246, 0.1) 9.49%, rgba(139, 92, 246, 0.2) 71.04%), #1f2937',
                  downloadTopCardBackground: 'linear-gradient(126deg, rgba(139, 92, 246, 0.1) 9.49%, rgba(139, 92, 246, 0.2) 71.04%), #1f2937',
                  error: '#ef4444',
                  generalBorder: 'rgba(139, 92, 246, 0.2)',
                  generalBorderDim: 'rgba(139, 92, 246, 0.1)',
                  menuItemBackground: 'rgba(139, 92, 246, 0.1)',
                  modalBackdrop: 'rgba(0, 0, 0, 0.7)',
                  modalBackground: '#1f2937',
                  modalBorder: 'rgba(139, 92, 246, 0.2)',
                  modalText: '#f9fafb',
                  modalTextDim: '#d1d5db',
                  modalTextSecondary: '#e5e7eb',
                  profileAction: 'rgba(139, 92, 246, 0.1)',
                  profileActionHover: 'rgba(139, 92, 246, 0.2)',
                  profileForeground: '#1f2937',
                  selectedOptionBorder: '#8b5cf6',
                  standby: '#fbbf24',
                },
              },
            }}
            showRecentTransactions={true}
            appInfo={{
              appName: 'XMenity Social Token Factory',
              learnMoreUrl: 'https://docs.xmenity.com',
            }}
          >
            <ThirdwebProvider>
              {children}
            </ThirdwebProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}