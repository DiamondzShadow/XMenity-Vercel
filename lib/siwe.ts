import { SiweMessage } from 'siwe';
import { randomBytes } from 'crypto';

export interface SiweSession {
  nonce: string;
  address?: string;
  chainId?: number;
  issuedAt?: string;
  expirationTime?: string;
}

export interface VerifyResult {
  success: boolean;
  address?: string;
  error?: string;
}

export class SiweService {
  private static instance: SiweService;
  private activeSessions: Map<string, SiweSession> = new Map();

  private constructor() {}

  public static getInstance(): SiweService {
    if (!SiweService.instance) {
      SiweService.instance = new SiweService();
    }
    return SiweService.instance;
  }

  /**
   * Generate a new nonce for SIWE challenge
   */
  generateNonce(): string {
    const nonce = randomBytes(32).toString('hex');
    
    // Store nonce with expiration (10 minutes)
    const session: SiweSession = {
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    };
    
    this.activeSessions.set(nonce, session);
    
    // Cleanup expired nonces
    this.cleanupExpiredSessions();
    
    return nonce;
  }

  /**
   * Create a SIWE message for the user to sign
   */
  createMessage(params: {
    address: string;
    chainId: number;
    nonce: string;
    domain?: string;
    uri?: string;
    statement?: string;
  }): SiweMessage {
    const {
      address,
      chainId,
      nonce,
      domain = typeof window !== 'undefined' ? window.location.host : 'localhost',
      uri = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      statement = 'Sign in to access your social token dashboard and verify your wallet ownership.'
    } = params;

    return new SiweMessage({
      domain,
      address,
      statement,
      uri,
      version: '1',
      chainId,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });
  }

  /**
   * Verify a signed SIWE message
   */
  async verifyMessage(params: {
    message: string;
    signature: string;
    nonce: string;
  }): Promise<VerifyResult> {
    try {
      const { message, signature, nonce } = params;
      
      // Check if nonce exists and is valid
      const session = this.activeSessions.get(nonce);
      if (!session) {
        return {
          success: false,
          error: 'Invalid or expired nonce'
        };
      }

      // Parse and verify the message
      const siweMessage = new SiweMessage(message);
      const verificationResult = await siweMessage.verify({ signature });

      if (!verificationResult.success) {
        return {
          success: false,
          error: 'Invalid signature'
        };
      }

      // Update session with verified address
      session.address = siweMessage.address;
      session.chainId = siweMessage.chainId;
      this.activeSessions.set(nonce, session);

      return {
        success: true,
        address: siweMessage.address
      };

    } catch (error) {
      console.error('SIWE verification error:', error);
      return {
        success: false,
        error: 'Verification failed'
      };
    }
  }

  /**
   * Get session by nonce
   */
  getSession(nonce: string): SiweSession | undefined {
    return this.activeSessions.get(nonce);
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    
    for (const [nonce, session] of this.activeSessions.entries()) {
      if (session.expirationTime && new Date(session.expirationTime) < now) {
        this.activeSessions.delete(nonce);
      }
    }
  }

  /**
   * Clear a specific session
   */
  clearSession(nonce: string): void {
    this.activeSessions.delete(nonce);
  }

  /**
   * Check if an address is currently authenticated
   */
  isAuthenticated(address: string): boolean {
    for (const session of this.activeSessions.values()) {
      if (session.address?.toLowerCase() === address.toLowerCase()) {
        // Check if session is still valid
        if (session.expirationTime && new Date(session.expirationTime) > new Date()) {
          return true;
        }
      }
    }
    return false;
  }
}

export const siweService = SiweService.getInstance();