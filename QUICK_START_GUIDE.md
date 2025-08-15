# Quick Start Guide: TokenFactory & ModularToken Integration

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+
- Private key for contract interactions
- Access to Custom Arbitrum RPC (Chain ID: 150179125)

## 📋 Step 1: Environment Setup

```bash
# Clone or create your project
mkdir creator-token-app && cd creator-token-app
npm init -y

# Install dependencies
npm install @thirdweb-dev/sdk ethers dotenv
npm install -D typescript @types/node

# Create environment file
cat > .env << 'EOF'
PRIVATE_KEY=your_private_key_here
CUSTOM_ARB_RPC_URL=your_rpc_url_here
JWT_SECRET=your_jwt_secret_here
INSIGHT_IQ_API_KEY=your_insight_iq_key_here
EOF
```

## 📋 Step 2: Contract Addresses & ABI

```typescript
// config/contracts.ts
export const CONTRACTS = {
  FACTORY_ADDRESS: '0x477B1D346a477FD3190da45c29F226f33D09Dc93',
  SAMPLE_TOKEN: '0x7f2BFF3ecF09B430f01271A892b1dB4C533F568E',
  CHAIN_ID: 150179125,
} as const;

// Copy ModularToken ABI from /workspace/abi/ModularToken.json
export const MODULAR_TOKEN_ABI = [...]; // Use the generated ABI
```

## 📋 Step 3: Basic Contract Interaction

### A. Read Contract State
```typescript
// examples/readContract.ts
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { CONTRACTS, MODULAR_TOKEN_ABI } from '../config/contracts';

async function getTokenMetrics() {
  const sdk = new ThirdwebSDK({
    name: "Custom Arbitrum",
    chainId: CONTRACTS.CHAIN_ID,
    rpc: [process.env.CUSTOM_ARB_RPC_URL!],
  });

  const token = await sdk.getContract(CONTRACTS.SAMPLE_TOKEN, MODULAR_TOKEN_ABI);
  
  // Get all metrics
  const [names, values, thresholds, multipliers] = await token.call("getMetrics");
  
  console.log("📊 Current Metrics:");
  names.forEach((name: string, i: number) => {
    console.log(`  ${name}: ${values[i]} (next threshold: ${thresholds[i][0]})`);
  });
  
  // Get token info
  const name = await token.call("name");
  const symbol = await token.call("symbol");
  const totalSupply = await token.call("totalSupply");
  
  console.log(`\n🪙 Token: ${name} (${symbol})`);
  console.log(`   Total Supply: ${totalSupply.toString()}`);
}

getTokenMetrics().catch(console.error);
```

### B. Update Metrics (Creator Only)
```typescript
// examples/updateMetrics.ts
import { ThirdwebSDK } from "@thirdweb-dev/sdk";

async function updateCreatorMetrics() {
  const sdk = ThirdwebSDK.fromPrivateKey(
    process.env.PRIVATE_KEY!,
    {
      name: "Custom Arbitrum", 
      chainId: 150179125,
      rpc: [process.env.CUSTOM_ARB_RPC_URL!],
    }
  );

  const token = await sdk.getContract(CONTRACTS.SAMPLE_TOKEN, MODULAR_TOKEN_ABI);
  
  try {
    // Update followers to trigger next reward threshold
    console.log("📈 Updating followers to 6000...");
    const tx1 = await token.call("updateMetricValue", ["followers", 6000]);
    console.log(`   Transaction: ${tx1.receipt.transactionHash}`);
    
    // Update engagement rate
    console.log("📈 Updating engagement rate to 7...");
    const tx2 = await token.call("updateMetricValue", ["engagement_rate", 7]);
    console.log(`   Transaction: ${tx2.receipt.transactionHash}`);
    
    console.log("✅ Metrics updated successfully!");
    
  } catch (error) {
    console.error("❌ Error updating metrics:", error);
  }
}

updateCreatorMetrics().catch(console.error);
```

### C. Claim Rewards
```typescript
// examples/claimRewards.ts
async function claimAvailableRewards() {
  const sdk = ThirdwebSDK.fromPrivateKey(process.env.PRIVATE_KEY!, { /* config */ });
  const token = await sdk.getContract(CONTRACTS.SAMPLE_TOKEN, MODULAR_TOKEN_ABI);
  
  const metrics = ['followers', 'engagement_rate', 'reach'];
  
  for (const metric of metrics) {
    try {
      console.log(`🎁 Attempting to claim reward for ${metric}...`);
      const tx = await token.call("claimReward", [metric]);
      console.log(`   ✅ Success! Transaction: ${tx.receipt.transactionHash}`);
    } catch (error) {
      console.log(`   ⏭️  No reward available for ${metric}`);
    }
  }
}

claimAvailableRewards().catch(console.error);
```

## 📋 Step 4: Deploy New Token Through Factory

```typescript
// examples/deployToken.ts
async function deployNewToken() {
  const sdk = ThirdwebSDK.fromPrivateKey(process.env.PRIVATE_KEY!, { /* config */ });
  const factory = await sdk.getContract(CONTRACTS.FACTORY_ADDRESS);
  
  const deployParams = {
    name: "My Creator Token",
    symbol: "MCT", 
    initialSupply: "1000000000000000000000000", // 1M tokens (18 decimals)
    metricNames: ["followers", "engagement_rate", "reach"],
    thresholds: [1000, 5000, 10000, 3, 5, 8, 100000, 500000, 1000000],
    multipliers: [1, 2, 3, 1, 2, 3, 2, 4, 6],
    creator: "0x1FEF4cd069E711cFeC93247671Ad41a17D97eDF4", // Your address
    creatorData: "0x4d79206e65772063726561746f7220646174612021" // "My new creator data!"
  };
  
  try {
    console.log("🚀 Deploying new ModularToken...");
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
    
    // Extract new token address from events
    const events = tx.receipt.events || [];
    const deployEvent = events.find((e: any) => e.event === 'ModularTokenDeployed');
    const newTokenAddress = deployEvent?.args?.tokenAddress;
    
    console.log("✅ Token deployed successfully!");
    console.log(`   Address: ${newTokenAddress}`);
    console.log(`   Transaction: ${tx.receipt.transactionHash}`);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
  }
}

deployNewToken().catch(console.error);
```

## 📋 Step 5: React Component Example

```tsx
// components/TokenDashboard.tsx
import { useState, useEffect } from 'react';
import { ThirdwebSDK } from "@thirdweb-dev/sdk";

interface Metric {
  name: string;
  value: number;
  nextThreshold: number;
  canClaim: boolean;
}

export function TokenDashboard({ tokenAddress }: { tokenAddress: string }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [tokenAddress]);

  const loadMetrics = async () => {
    try {
      const sdk = new ThirdwebSDK({
        name: "Custom Arbitrum",
        chainId: 150179125,
        rpc: [process.env.NEXT_PUBLIC_RPC_URL!],
      });

      const token = await sdk.getContract(tokenAddress, MODULAR_TOKEN_ABI);
      const [names, values, thresholds] = await token.call("getMetrics");
      
      const formattedMetrics = names.map((name: string, i: number) => ({
        name,
        value: parseInt(values[i]),
        nextThreshold: parseInt(thresholds[i][0] || 0),
        canClaim: parseInt(values[i]) >= parseInt(thresholds[i][0] || 0)
      }));

      setMetrics(formattedMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (metricName: string) => {
    try {
      // This would typically be done through your backend API
      console.log(`Claiming reward for ${metricName}...`);
      // Call your backend API that handles the claim
      await fetch('/api/claim-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress, metricName })
      });
      
      loadMetrics(); // Refresh after claiming
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  if (loading) return <div>Loading metrics...</div>;

  return (
    <div className="token-dashboard">
      <h2>Creator Token Dashboard</h2>
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div key={metric.name} className="metric-card">
            <h3>{metric.name.replace('_', ' ').toUpperCase()}</h3>
            <div className="metric-value">{metric.value.toLocaleString()}</div>
            <div className="metric-threshold">
              Next: {metric.nextThreshold.toLocaleString()}
            </div>
            {metric.canClaim && (
              <button 
                onClick={() => claimReward(metric.name)}
                className="claim-button"
              >
                🎁 Claim Reward
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 📋 Step 6: Test Everything

```bash
# Run the examples
npx ts-node examples/readContract.ts
npx ts-node examples/updateMetrics.ts  
npx ts-node examples/claimRewards.ts
npx ts-node examples/deployToken.ts
```

## 🔧 Available Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "read-metrics": "ts-node examples/readContract.ts",
    "update-metrics": "ts-node examples/updateMetrics.ts", 
    "claim-rewards": "ts-node examples/claimRewards.ts",
    "deploy-token": "ts-node examples/deployToken.ts",
    "dev": "next dev",
    "build": "next build"
  }
}
```

## 🚨 Important Notes

### Security
- ⚠️ **Never expose private keys** in frontend code
- ✅ **Use backend APIs** for sensitive operations (metric updates, deployments)
- ✅ **Validate JWT tokens** before contract interactions
- ✅ **Rate limit** deployment endpoints

### Gas Optimization
- 💡 **Batch operations** when possible
- 💡 **Estimate gas** before transactions
- 💡 **Monitor gas prices** on your network

### Production Checklist
- [ ] Environment variables configured
- [ ] Backend API secured with JWT
- [ ] InsightIQ integration tested
- [ ] Frontend error handling implemented
- [ ] Transaction monitoring set up
- [ ] Block explorer integration added

## 🔗 Useful Commands

```bash
# Check token balance
cast call 0x7f2BFF3ecF09B430f01271A892b1dB4C533F568E "balanceOf(address)" YOUR_ADDRESS --rpc-url custom_arb

# Get current metrics
cast call 0x7f2BFF3ecF09B430f01271A892b1dB4C533F568E "getMetrics()" --rpc-url custom_arb

# Monitor events
cast logs --address 0x7f2BFF3ecF09B430f01271A892b1dB4C533F568E --rpc-url custom_arb
```

## 🆘 Troubleshooting

### Common Issues
1. **Transaction Fails**: Check gas limits and network connectivity
2. **ABI Errors**: Ensure you're using the correct ABI from the deployed contract
3. **Access Denied**: Verify you're using the correct creator address
4. **Network Issues**: Confirm RPC URL and chain ID are correct

### Get Help
- 📖 Review the full integration guide: `INTEGRATION_ARCHITECTURE.md`
- 🔍 Check contract test results: `CONTRACT_TEST_ANALYSIS.md`  
- 📊 View deployment details: `TOKEN_FACTORY_DEPLOYMENT.md`

---
*Ready to build the creator economy! 🚀*