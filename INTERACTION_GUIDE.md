# ModularToken & TokenFactory Interaction Guide

## Contract Addresses
- **TokenFactory**: `0x477B1D346a477FD3190da45c29F226f33D09Dc93`
- **ModularToken**: `0x7f2BFF3ecF09B430f01271A892b1dB4C533F568E`
- **Chain ID**: 150179125 (Custom Arbitrum)

## Quick Setup
```bash
export PRIVATE_KEY="your_private_key"
export RPC_URL="custom_arb"
export TOKEN_ADDRESS="0x7f2BFF3ecF09B430f01271A892b1dB4C533F568E"
export FACTORY_ADDRESS="0x477B1D346a477FD3190da45c29F226f33D09Dc93"
export CREATOR_ADDRESS="0x1FEF4cd069E711cFeC93247671Ad41a17D97eDF4"
```

## 🔍 Reading Contract State

### 1. Get All Metrics Information
```bash
# Get complete metrics configuration
cast call $TOKEN_ADDRESS "getMetrics()" --rpc-url $RPC_URL
```

### 2. Get Individual Metric Names
```bash
# Get metric by index (0-5)
cast call $TOKEN_ADDRESS "metricNames(uint256)" 0 --rpc-url $RPC_URL
cast call $TOKEN_ADDRESS "metricNames(uint256)" 1 --rpc-url $RPC_URL
# ... etc for indices 2-5
```

### 3. Get Metric Values and Configuration
```bash
# Get specific metric data (returns name and current value)
cast call $TOKEN_ADDRESS "metrics(string)" "followers" --rpc-url $RPC_URL
cast call $TOKEN_ADDRESS "metrics(string)" "engagement_rate" --rpc-url $RPC_URL
cast call $TOKEN_ADDRESS "metrics(string)" "reach" --rpc-url $RPC_URL
cast call $TOKEN_ADDRESS "metrics(string)" "influence_score" --rpc-url $RPC_URL
cast call $TOKEN_ADDRESS "metrics(string)" "authenticity_score" --rpc-url $RPC_URL
cast call $TOKEN_ADDRESS "metrics(string)" "growth_rate" --rpc-url $RPC_URL
```

### 4. Check Creator Information
```bash
# Get creator data
cast call $TOKEN_ADDRESS "creatorData()" --rpc-url $RPC_URL

# Check last claimed threshold for specific metric
cast call $TOKEN_ADDRESS "lastClaimedThreshold(address,string)" $CREATOR_ADDRESS "followers" --rpc-url $RPC_URL
```

### 5. Check Token Information
```bash
# Get token balance
cast call $TOKEN_ADDRESS "balanceOf(address)" $CREATOR_ADDRESS --rpc-url $RPC_URL

# Get total supply
cast call $TOKEN_ADDRESS "totalSupply()" --rpc-url $RPC_URL

# Get token name and symbol
cast call $TOKEN_ADDRESS "name()" --rpc-url $RPC_URL
cast call $TOKEN_ADDRESS "symbol()" --rpc-url $RPC_URL
```

## ✏️ Updating Contract State (Creator Only)

### 1. Update Metric Values
```bash
# Update followers count
cast send $TOKEN_ADDRESS \
    "updateMetricValue(string,uint256)" \
    "followers" 2500 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY

# Update engagement rate (percentage * 100, e.g., 7.5% = 750)
cast send $TOKEN_ADDRESS \
    "updateMetricValue(string,uint256)" \
    "engagement_rate" 750 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY

# Update reach
cast send $TOKEN_ADDRESS \
    "updateMetricValue(string,uint256)" \
    "reach" 150000 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY
```

### 2. Claim Rewards
```bash
# Claim rewards for followers milestone
cast send $TOKEN_ADDRESS \
    "claimReward(string)" \
    "followers" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY

# Claim rewards for other metrics
cast send $TOKEN_ADDRESS \
    "claimReward(string)" \
    "engagement_rate" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY
```

### 3. Update Creator Metadata
```bash
# Update creator data (hex-encoded string)
cast send $TOKEN_ADDRESS \
    "updateCreatorData(bytes)" \
    0x557064617465642063726561746f722064617461 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY
```

## 🏭 TokenFactory Operations

### 1. Deploy New ModularToken
```bash
# Deploy a new token through the factory
cast send $FACTORY_ADDRESS \
    "deployModularToken(string,string,uint256,string[],uint256[],uint256[],address,bytes)" \
    "My Creator Token" \
    "MCT" \
    1000000000000000000000000 \
    '["followers","engagement_rate","reach"]' \
    '[1000,5000,10000,3,5,8,100000,500000,1000000]' \
    '[1,2,3,1,2,3,2,4,6]' \
    $CREATOR_ADDRESS \
    0x4d79206e65772063726561746f7220646174612020202020202020202020202020 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY
```

### 2. Get Deployed Tokens
```bash
# Get tokens deployed by a specific creator
cast call $FACTORY_ADDRESS "getDeployedTokens(address)" $CREATOR_ADDRESS --rpc-url $RPC_URL
```

## 💸 Token Transfer Operations

### 1. Transfer Tokens
```bash
# Transfer tokens to another address
cast send $TOKEN_ADDRESS \
    "transfer(address,uint256)" \
    0xRecipientAddress \
    1000000000000000000000 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY
```

### 2. Approve and TransferFrom
```bash
# Approve spender
cast send $TOKEN_ADDRESS \
    "approve(address,uint256)" \
    0xSpenderAddress \
    1000000000000000000000 \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY

# Check allowance
cast call $TOKEN_ADDRESS "allowance(address,address)" $CREATOR_ADDRESS 0xSpenderAddress --rpc-url $RPC_URL
```

## 📊 Metric Threshold Reference

### Current Thresholds Configuration:

| Metric | Threshold 1 | Threshold 2 | Threshold 3 | Multiplier 1 | Multiplier 2 | Multiplier 3 |
|--------|-------------|-------------|-------------|--------------|--------------|--------------|
| followers | 1,000 | 5,000 | 10,000 | 1x | 2x | 3x |
| engagement_rate | 3 | 5 | 8 | 1x | 2x | 3x |
| reach | 100,000 | 500,000 | 1,000,000 | 2x | 4x | 6x |
| influence_score | 60 | 70 | 80 | 3x | 5x | 7x |
| authenticity_score | 70 | 80 | 90 | 2x | 4x | 6x |
| growth_rate | 5 | 10 | 15 | 2x | 3x | 4x |

### Reward Calculation:
**Reward Amount = Base Reward (1000 tokens) × Multiplier**

## 🔥 Batch Operations Script

### Check All Metric Values
```bash
#!/bin/bash
echo "=== Current Metric Values ==="
for metric in "followers" "engagement_rate" "reach" "influence_score" "authenticity_score" "growth_rate"; do
    echo "📊 $metric:"
    cast call $TOKEN_ADDRESS "metrics(string)" "$metric" --rpc-url $RPC_URL
done
```

### Update Multiple Metrics
```bash
#!/bin/bash
echo "=== Updating Multiple Metrics ==="

# Update followers
cast send $TOKEN_ADDRESS "updateMetricValue(string,uint256)" "followers" 6000 --rpc-url $RPC_URL --private-key $PRIVATE_KEY

# Update engagement rate
cast send $TOKEN_ADDRESS "updateMetricValue(string,uint256)" "engagement_rate" 6 --rpc-url $RPC_URL --private-key $PRIVATE_KEY

# Update reach
cast send $TOKEN_ADDRESS "updateMetricValue(string,uint256)" "reach" 600000 --rpc-url $RPC_URL --private-key $PRIVATE_KEY

echo "✅ All metrics updated!"
```

### Claim All Available Rewards
```bash
#!/bin/bash
echo "=== Claiming All Available Rewards ==="
for metric in "followers" "engagement_rate" "reach" "influence_score" "authenticity_score" "growth_rate"; do
    echo "🎁 Attempting to claim reward for $metric..."
    cast send $TOKEN_ADDRESS "claimReward(string)" "$metric" --rpc-url $RPC_URL --private-key $PRIVATE_KEY
done
```

## 🛡️ Security Best Practices

1. **Private Key Management**: Never expose your private key in scripts or logs
2. **Access Control**: Only the creator can update metrics and claim rewards
3. **Threshold Verification**: Always check current metric values before claiming
4. **Gas Estimation**: Use `--gas-estimate` flag for complex operations
5. **Transaction Verification**: Always verify transaction success in block explorer

## 🔍 Debugging & Monitoring

### Monitor Events
```bash
# Watch for metric updates
cast logs --address $TOKEN_ADDRESS --rpc-url $RPC_URL

# Watch for reward claims
cast logs --address $TOKEN_ADDRESS --rpc-url $RPC_URL
```

### Check Transaction Status
```bash
# Check specific transaction
cast tx 0xTransactionHash --rpc-url $RPC_URL
```

### Estimate Gas
```bash
# Estimate gas for metric update
cast estimate $TOKEN_ADDRESS "updateMetricValue(string,uint256)" "followers" 2000 --rpc-url $RPC_URL
```

---
*Interactive guide for Chain ID 150179125 contracts*