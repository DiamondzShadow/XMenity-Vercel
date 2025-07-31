import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "XMenity Social Token Factory",
    template: "%s | XMenity"
  },
  description: "A comprehensive platform for X (Twitter) creators to launch their own community tokens on Arbitrum, powered by InsightIQ verification and milestone-based tokenomics.",
  keywords: [
    "social tokens",
    "web3",
    "twitter",
    "blockchain",
    "arbitrum",
    "thirdweb",
    "creators",
    "tokenomics",
    "cryptocurrency"
  ],
  authors: [
    {
      name: "DiamondzShadow",
      url: "https://github.com/DiamondzShadow"
    }
  ],
  creator: "DiamondzShadow",
  publisher: "XMenity",
  metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    title: "XMenity Social Token Factory",
    description: "Launch your own community tokens on Arbitrum with milestone-based tokenomics",
    siteName: "XMenity",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "XMenity Social Token Factory"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "XMenity Social Token Factory",
    description: "Launch your own community tokens on Arbitrum with milestone-based tokenomics",
    images: ["/og-image.jpg"],
    creator: "@XMenityTube"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION_ID,
  },
  category: "technology",
  classification: "Web3 Platform",
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any"
      },
      {
        url: "/icon-16x16.png",
        sizes: "16x16",
        type: "image/png"
      },
      {
        url: "/icon-32x32.png",
        sizes: "32x32",
        type: "image/png"
      }
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180"
      }
    ]
  },
    generator: 'v0.dev'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://arb1.arbitrum.io" />
        <link rel="dns-prefetch" href="https://api.thirdweb.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">
              {children}
            </div>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
