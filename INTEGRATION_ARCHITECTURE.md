# TokenFactory Integration Architecture Guide

## Overview
This guide provides a complete integration strategy for your deployed TokenFactory and ModularToken contracts using off-chain verification with JWT/InsightIQ and Thirdweb SDK.

## 🏗️ Architecture Overview

### Deployed Contracts
- **TokenFactory**: `0x477B1D346a477FD3190da45c29F226f33D09Dc93`
- **ModularToken**: `0x7f2BFF3ecF09B430f01271A892b1dB4C533F568E`
- **Chain**: 150179125 (Custom Arbitrum)

### Security Flow (Recommended)
\`\`\`
Frontend → Backend API → InsightIQ Verification → Contract Deployment
   ↓           ↓               ↓                        ↓
  JWT      Validation    Metrics Fetch           TokenFactory.deploy
\`\`\`

## 🔐 1. Off-Chain Verification Strategy

### A. JWT & InsightIQ Integration Pipeline

\`\`\`mermaid
graph LR
    A[Creator Frontend] -->|JWT Token| B[Backend API]
    B -->|Verify JWT| C[JWT Validation]
    B -->|Fetch Metrics| D[InsightIQ API]
    C -->|Valid?| E[Authorized]
    D -->|Creator Data| E
    E -->|Deploy Contract| F[TokenFactory]
    F -->|Return Address| B
    B -->|Success Response| A
\`\`\`

### B. Backend Security Checklist
- ✅ **JWT Validation**: Decode, verify signature, check expiration
- ✅ **InsightIQ Verification**: Validate creator status and metrics
- ✅ **Rate Limiting**: Prevent spam deployments
- ✅ **Address Whitelisting**: Optional contract-level access control
- ✅ **Audit Logging**: Track all deployment attempts

## 🛠️ 2. Contract ABI and TypeScript Integration

### A. Extract ABIs from Your Deployed Contracts

\`\`\`bash
# Generate ABI files
forge inspect TokenFactory abi > abi/TokenFactory.json
forge inspect ModularToken abi > abi/ModularToken.json

# Generate TypeScript interfaces
forge inspect TokenFactory abi | jq > src/abi/TokenFactory.ts
forge inspect ModularToken abi | jq > src/abi/ModularToken.ts
\`\`\`

### B. TypeScript Interface Generation

\`\`\`typescript
// types/contracts.ts
export interface MetricConfig {
  name: string;
  thresholds: number[];
  multipliers: number[];
}

export interface CreatorMetrics {
  followers: number;
  engagement_rate: number;
  reach: number;
  influence_score: number;
  authenticity_score: number;
  growth_rate: number;
}

export interface TokenDeploymentParams {
  name: string;
  symbol: string;
  initialSupply: bigint;
  metricNames: string[];
  thresholds: number[];
  multipliers: number[];
  creator: string;
  creatorData: string;
}
\`\`\`

## 🚀 3. Backend Implementation (Node.js/Next.js)

### A. Environment Configuration

\`\`\`typescript
// config/contracts.ts
export const CONTRACTS = {
  FACTORY_ADDRESS: '0x477B1D346a477FD3190da45c29F226f33D09Dc93',
  SAMPLE_TOKEN: '0x7f2BFF3ecF09B430f01271A892b1dB4C533F568E',
  CHAIN_ID: 150179125,
  RPC_URL: process.env.CUSTOM_ARB_RPC_URL,
  PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY,
} as const;
\`\`\`

### B. Backend API Route (`/api/tokens/deploy`)

\`\`\`typescript
// pages/api/tokens/deploy.ts (Next.js) or routes/tokens.ts (Express)
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import jwt from 'jsonwebtoken';
import { TokenFactory } from '../../../abi/TokenFactory';

interface DeployRequest {
  tokenName: string;
  tokenSymbol: string;
  initialSupply: string;
  creatorData?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. JWT Validation
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const creatorAddress = decoded.walletAddress;
    const insightIQId = decoded.insightIQId;

    // 2. InsightIQ Verification
    const creatorMetrics = await verifyCreatorWithInsightIQ(insightIQId);
    if (!creatorMetrics.verified) {
      return res.status(403).json({ error: 'Creator not verified with InsightIQ' });
    }

    // 3. Prepare Contract Parameters
    const deployParams = await prepareContractParameters(
      req.body,
      creatorAddress,
      creatorMetrics
    );

    // 4. Deploy via Thirdweb SDK
    const sdk = ThirdwebSDK.fromPrivateKey(
      process.env.DEPLOYER_PRIVATE_KEY!,
      {
        name: "Custom Arbitrum",
        chainId: 150179125,
        rpc: [process.env.CUSTOM_ARB_RPC_URL!],
      }
    );

    const factory = await sdk.getContract(CONTRACTS.FACTORY_ADDRESS, TokenFactory);
    
    const tx = await factory.call("deployModularToken", [
      deployParams.name,
      deployParams.symbol,
      deployParams.initialSupply,
      deployParams.metricNames,
      deployParams.thresholds,
      deployParams.multipliers,
      deployParams.creator,
      deployParams.creatorData
    ]);

    // 5. Extract new token address from events
    const newTokenAddress = extractTokenAddressFromEvent(tx.receipt);

    // 6. Store deployment record
    await storeDeploymentRecord({
      creatorAddress,
      tokenAddress: newTokenAddress,
      transactionHash: tx.receipt.transactionHash,
      deployedAt: new Date()
    });

    res.status(200).json({
      success: true,
      tokenAddress: newTokenAddress,
      transactionHash: tx.receipt.transactionHash,
      blockNumber: tx.receipt.blockNumber
    });

  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({ 
      error: 'Deployment failed',
      details: error.message 
    });
  }
}

// Helper Functions
async function verifyCreatorWithInsightIQ(insightIQId: string) {
  // Implement InsightIQ API verification
  const response = await fetch(`${process.env.INSIGHT_IQ_API}/creators/${insightIQId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.INSIGHT_IQ_API_KEY}`,
    }
  });
  
  if (!response.ok) {
    return { verified: false };
  }
  
  const data = await response.json();
  return {
    verified: true,
    metrics: {
      followers: data.followers,
      engagement_rate: Math.floor(data.engagement_rate * 100), // Convert to basis points
      reach: data.reach,
      influence_score: data.influence_score,
      authenticity_score: data.authenticity_score,
      growth_rate: Math.floor(data.growth_rate * 100)
    }
  };
}

async function prepareContractParameters(
  body: DeployRequest, 
  creatorAddress: string, 
  metrics: any
): Promise<TokenDeploymentParams> {
  return {
    name: body.tokenName,
    symbol: body.tokenSymbol,
    initialSupply: BigInt(body.initialSupply || '100000000000000000000000000'), // 100M tokens
    metricNames: ['followers', 'engagement_rate', 'reach', 'influence_score', 'authenticity_score', 'growth_rate'],
    thresholds: [1000, 5000, 10000, 3, 5, 8, 100000, 500000, 1000000, 60, 70, 80, 70, 80, 90, 5, 10, 15],
    multipliers: [1, 2, 3, 1, 2, 3, 2, 4, 6, 3, 5, 7, 2, 4, 6, 2, 3, 4],
    creator: creatorAddress,
    creatorData: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(body.creatorData || `Creator: ${creatorAddress}`))
  };
}
\`\`\`

### C. Frontend Integration (React/Next.js)

\`\`\`typescript
// components/TokenDeployment.tsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface TokenForm {
  name: string;
  symbol: string;
  initialSupply: string;
  creatorData: string;
}

export function TokenDeployment() {
  const { token } = useAuth(); // Your JWT token
  const [form, setForm] = useState<TokenForm>({
    name: '',
    symbol: '',
    initialSupply: '100000000',
    creatorData: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const deployToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tokens/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed');
      }

      setResult(data);
      
      // Optional: Redirect to token dashboard
      // router.push(`/tokens/${data.tokenAddress}`);
      
    } catch (error) {
      console.error('Deployment error:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="token-deployment">
      <h2>Deploy Your Creator Token</h2>
      
      <form onSubmit={(e) => { e.preventDefault(); deployToken(); }}>
        <input
          placeholder="Token Name (e.g., 'Creator Token')"
          value={form.name}
          onChange={(e) => setForm({...form, name: e.target.value})}
          required
        />
        
        <input
          placeholder="Symbol (e.g., 'CRTR')"
          value={form.symbol}
          onChange={(e) => setForm({...form, symbol: e.target.value.toUpperCase()})}
          required
        />
        
        <input
          placeholder="Initial Supply (tokens)"
          type="number"
          value={form.initialSupply}
          onChange={(e) => setForm({...form, initialSupply: e.target.value})}
          required
        />
        
        <textarea
          placeholder="Creator description (optional)"
          value={form.creatorData}
          onChange={(e) => setForm({...form, creatorData: e.target.value})}
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Deploying...' : 'Deploy Token'}
        </button>
      </form>

      {result && (
        <div className="deployment-success">
          <h3>✅ Token Deployed Successfully!</h3>
          <p><strong>Address:</strong> {result.tokenAddress}</p>
          <p><strong>Transaction:</strong> {result.transactionHash}</p>
          <a 
            href={`https://your-explorer.com/tx/${result.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  );
}
\`\`\`

## 🔧 4. Thirdweb SDK Integration Examples

### A. Contract Interaction Service

\`\`\`typescript
// services/contractService.ts
import { ThirdwebSDK, SmartContract } from "@thirdweb-dev/sdk";
import { ModularToken, TokenFactory } from '../abi';

export class ContractService {
  private sdk: ThirdwebSDK;
  
  constructor(privateKey?: string) {
    this.sdk = ThirdwebSDK.fromPrivateKey(
      privateKey || process.env.PRIVATE_KEY!,
      {
        name: "Custom Arbitrum",
        chainId: 150179125,
        rpc: [process.env.CUSTOM_ARB_RPC_URL!],
      }
    );
  }

  // Get ModularToken contract instance
  async getModularToken(address: string): Promise<SmartContract> {
    return await this.sdk.getContract(address, ModularToken);
  }

  // Get TokenFactory contract instance
  async getTokenFactory(): Promise<SmartContract> {
    return await this.sdk.getContract(CONTRACTS.FACTORY_ADDRESS, TokenFactory);
  }

  // Deploy new token through factory
  async deployToken(params: TokenDeploymentParams) {
    const factory = await this.getTokenFactory();
    
    const tx = await factory.call("deployModularToken", [
      params.name,
      params.symbol,
      params.initialSupply,
      params.metricNames,
      params.thresholds,
      params.multipliers,
      params.creator,
      params.creatorData
    ]);

    return {
      transactionHash: tx.receipt.transactionHash,
      tokenAddress: this.extractTokenAddressFromEvent(tx.receipt),
      blockNumber: tx.receipt.blockNumber
    };
  }

  // Update creator metrics (backend only)
  async updateMetrics(tokenAddress: string, metricName: string, value: number) {
    const token = await this.getModularToken(tokenAddress);
    
    const tx = await token.call("updateMetricValue", [metricName, value]);
    return tx.receipt.transactionHash;
  }

  // Claim rewards
  async claimReward(tokenAddress: string, metricName: string) {
    const token = await this.getModularToken(tokenAddress);
    
    const tx = await token.call("claimReward", [metricName]);
    return {
      transactionHash: tx.receipt.transactionHash,
      // Parse reward amount from events if needed
    };
  }

  // Query contract state
  async getTokenMetrics(tokenAddress: string) {
    const token = await this.getModularToken(tokenAddress);
    
    const [names, values, thresholds, multipliers] = await token.call("getMetrics");
    
    return names.map((name: string, index: number) => ({
      name,
      currentValue: values[index],
      thresholds: thresholds[index],
      multipliers: multipliers[index]
    }));
  }

  async getCreatorTokens(creatorAddress: string) {
    const factory = await this.getTokenFactory();
    return await factory.call("getDeployedTokens", [creatorAddress]);
  }

  private extractTokenAddressFromEvent(receipt: any): string {
    // Parse ModularTokenDeployed event to get new token address
    const event = receipt.events?.find(
      (e: any) => e.event === 'ModularTokenDeployed'
    );
    return event?.args?.tokenAddress || '';
  }
}
\`\`\`

### B. React Hooks for Contract Interaction

\`\`\`typescript
// hooks/useContract.ts
import { useState, useEffect } from 'react';
import { ContractService } from '../services/contractService';

export function useTokenMetrics(tokenAddress: string) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const contractService = new ContractService();
        const data = await contractService.getTokenMetrics(tokenAddress);
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tokenAddress) {
      fetchMetrics();
    }
  }, [tokenAddress]);

  return { metrics, loading, refetch: fetchMetrics };
}

export function useCreatorTokens(creatorAddress: string) {
  const [tokens, setTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const contractService = new ContractService();
        const data = await contractService.getCreatorTokens(creatorAddress);
        setTokens(data);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    if (creatorAddress) {
      fetchTokens();
    }
  }, [creatorAddress]);

  return { tokens, loading };
}
\`\`\`

## 🔒 5. Security Best Practices

### A. JWT Configuration
\`\`\`typescript
// utils/jwt.ts
import jwt from 'jsonwebtoken';

export function verifyCreatorJWT(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Validate required fields
    if (!decoded.walletAddress || !decoded.insightIQId) {
      throw new Error('Invalid token payload');
    }
    
    // Check expiration
    if (decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    return { valid: true, data: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
\`\`\`

### B. Rate Limiting & Access Control
\`\`\`typescript
// middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const deploymentLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Max 5 deployments per day per IP
  message: 'Too many deployment attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Optional: Contract-level whitelist
export async function addBackendToWhitelist(contractAddress: string) {
  const token = await getModularToken(contractAddress);
  // If your contract has access control
  await token.call("grantRole", [DEPLOYER_ROLE, process.env.BACKEND_ADDRESS]);
}
\`\`\`

## 🧪 6. Testing Strategy

### A. Integration Tests
\`\`\`typescript
// tests/integration.test.ts
import { ContractService } from '../services/contractService';

describe('Token Deployment Integration', () => {
  const contractService = new ContractService(process.env.TEST_PRIVATE_KEY);

  test('Should deploy token with valid parameters', async () => {
    const params = {
      name: 'Test Creator Token',
      symbol: 'TCT',
      initialSupply: BigInt('1000000000000000000000000'),
      // ... other params
    };

    const result = await contractService.deployToken(params);
    
    expect(result.tokenAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.transactionHash).toBeTruthy();
  });

  test('Should update metrics and claim rewards', async () => {
    const tokenAddress = 'YOUR_TEST_TOKEN_ADDRESS';
    
    // Update followers
    await contractService.updateMetrics(tokenAddress, 'followers', 1500);
    
    // Claim reward
    const claimResult = await contractService.claimReward(tokenAddress, 'followers');
    expect(claimResult.transactionHash).toBeTruthy();
  });
});
\`\`\`

### B. Frontend Testing
\`\`\`typescript
// Use tools like React Testing Library with mock API responses
// Mock the `/api/tokens/deploy` endpoint for E2E tests
\`\`\`

## 📝 7. Summary Checklist

| Component | Status | Notes |
|-----------|--------|-------|
| ✅ Contract Deployment | Complete | Factory & ModularToken deployed |
| ✅ ABI Generation | Ready | Use `forge inspect` output |
| ✅ Backend API Security | Designed | JWT + InsightIQ verification |
| ✅ Thirdweb Integration | Planned | SDK examples provided |
| ✅ Frontend Components | Designed | React deployment form |
| ✅ Testing Strategy | Outlined | Integration & unit tests |
| ⏳ Production Deploy | Pending | Environment setup needed |

## 🚀 Next Steps

1. **Set up environment variables** for production
2. **Implement InsightIQ API integration** with your specific endpoints
3. **Deploy backend API** with proper JWT validation
4. **Test full flow** from frontend to contract deployment
5. **Add monitoring & analytics** for deployment tracking
6. **Set up block explorer integration** for transaction viewing

---
*Architecture designed for Chain ID 150179125 with security-first approach*
