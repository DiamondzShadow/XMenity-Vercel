'use client';

import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { shortenAddress, isValidAddress } from '@/lib/web3';

interface User {
  id: string;
  walletAddress: string;
  displayName?: string;
  isVerified: boolean;
  twitterUsername?: string;
  profileImage?: string;
}

interface WalletConnectProps {
  onAuthenticated?: (user: User, token: string) => void;
  className?: string;
}

export function WalletConnect({ onAuthenticated, className }: WalletConnectProps) {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessage, isPending: isSigningMessage } = useSignMessage();
  
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check for existing authentication on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user_data');
    
    if (storedToken && storedUser && isConnected) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        onAuthenticated?.(parsedUser, storedToken);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
  }, [isConnected, onAuthenticated]);

  // Clear state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setUser(null);
      setToken(null);
      setError(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }, [isConnected]);

  const handleAuthenticate = async () => {
    if (!address || !isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isValidAddress(address)) {
      setError('Invalid wallet address');
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      // Step 1: Get nonce from server
      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }

      const { nonce } = await nonceResponse.json();

      // Step 2: Create SIWE message
      const message = `Welcome to XMenity Social Token Factory!

This request will not trigger a blockchain transaction or cost any gas fees.

Your authentication status will reset after 7 days.

Wallet address: ${address}
Nonce: ${nonce}`;

      // Step 3: Sign message
      const signature = await signMessage({ message });

      // Step 4: Verify signature with server
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const { token: authToken, user: userData } = await verifyResponse.json();

      // Step 5: Store authentication data
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user_data', JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      onAuthenticated?.(userData, authToken);

      toast.success('Successfully authenticated!');
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    toast.success('Wallet disconnected');
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <div className={className}>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== 'loading';
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === 'authenticated');

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <Button
                        onClick={openConnectModal}
                        className="bg-purple-600 hover:bg-purple-700"
                        size="lg"
                      >
                        <Wallet className="mr-2 h-5 w-5" />
                        Connect Wallet
                      </Button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <Button
                        onClick={openChainModal}
                        variant="destructive"
                        size="lg"
                      >
                        Wrong Network
                      </Button>
                    );
                  }

                  return null;
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    );
  }

  if (isConnected && !user) {
    return (
      <div className={className}>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              Sign a message to authenticate your wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium">Connected:</span>
              <div className="flex items-center gap-2">
                <code className="text-sm">{shortenAddress(address!)}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleAuthenticate}
                disabled={isAuthenticating || isSigningMessage}
                className="flex-1"
              >
                {isAuthenticating || isSigningMessage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSigningMessage ? 'Signing...' : 'Authenticating...'}
                  </>
                ) : (
                  'Sign Message'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isAuthenticating}
              >
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user && token) {
    return (
      <div className={className}>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-purple-600" />
                  </div>
                )}
                {user.displayName || shortenAddress(user.walletAddress)}
              </div>
              {user.isVerified && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Verified
                </Badge>
              )}
            </CardTitle>
            {user.twitterUsername && (
              <CardDescription>@{user.twitterUsername}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium">Wallet:</span>
              <div className="flex items-center gap-2">
                <code className="text-sm">{shortenAddress(address!)}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://arbiscan.io/address/${address}`, '_blank')}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="w-full"
            >
              Disconnect
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}