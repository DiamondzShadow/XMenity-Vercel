'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useDisconnect, useConnect } from 'wagmi';
import { SiweMessage } from 'siwe';
import { siweService } from '@/lib/siwe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, CheckCircle, AlertCircle } from 'lucide-react';

interface WalletConnectProps {
  onVerified?: (address: string) => void;
  platformUserId?: string;
  platformUsername?: string;
  className?: string;
}

export function WalletConnect({ 
  onVerified, 
  platformUserId, 
  platformUsername,
  className 
}: WalletConnectProps) {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors, error: connectError } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);

  // Check if we're on the correct network (Arbitrum)
  const isCorrectNetwork = chainId === 42161;

  useEffect(() => {
    // Reset verification state when wallet changes
    if (address) {
      setVerified(false);
      setError(null);
    }
  }, [address]);

  const generateNonce = async (): Promise<string> => {
    try {
      const response = await fetch('/api/siwe/nonce');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate nonce');
      }
      
      return data.nonce;
    } catch (error) {
      console.error('Error generating nonce:', error);
      throw new Error('Failed to generate authentication nonce');
    }
  };

  const signInWithEthereum = async () => {
    if (!address || !isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate nonce
      const newNonce = await generateNonce();
      setNonce(newNonce);

      // Create SIWE message
      const message = siweService.createMessage({
        address,
        chainId: chainId || 42161,
        nonce: newNonce,
        statement: 'Sign in to verify your wallet ownership and access your social token dashboard.'
      });

      // Sign the message
      const signature = await signMessageAsync({
        message: message.prepareMessage()
      });

      // Verify with backend
      const verifyResponse = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.prepareMessage(),
          signature,
          nonce: newNonce,
          platformUserId,
          platformUsername
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Verification failed');
      }

      setVerified(true);
      onVerified?.(address);

    } catch (error: any) {
      console.error('SIWE error:', error);
      setError(error.message || 'Failed to sign in with Ethereum');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (connector: any) => {
    try {
      setError(null);
      await connect({ connector });
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setVerified(false);
    setError(null);
    setNonce(null);
  };

  if (isConnected && verified) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Wallet Verified
          </CardTitle>
          <CardDescription>
            Successfully connected and verified: {address?.slice(0, 6)}...{address?.slice(-4)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isCorrectNetwork && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please switch to Arbitrum network for the best experience.
                </AlertDescription>
              </Alert>
            )}
            <Button variant="outline" onClick={handleDisconnect} className="w-full">
              Disconnect Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isConnected && !verified) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Verify Wallet Ownership
          </CardTitle>
          <CardDescription>
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            <br />
            Please sign a message to verify ownership.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isCorrectNetwork && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You're connected to the wrong network. Please switch to Arbitrum.
                </AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={signInWithEthereum}
                disabled={loading || !isCorrectNetwork}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  'Sign Message'
                )}
              </Button>
              <Button variant="outline" onClick={handleDisconnect} className="w-full">
                Disconnect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </CardTitle>
        <CardDescription>
          Connect your Web3 wallet to get started with social tokens.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {connectError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{connectError.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                variant="outline"
                className="w-full justify-start"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="mr-2 h-4 w-4" />
                )}
                Connect with {connector.name}
              </Button>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              By connecting your wallet, you agree to sign a message to verify ownership.
              This is secure and doesn't cost any gas fees.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}