import { createThirdwebClient, getContract } from "thirdweb";
import { arbitrum } from "thirdweb/chains";

// Thirdweb client configuration
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export const chain = arbitrum;

// Contract Addresses (these would be set from deployment)
export const CONTRACT_ADDRESSES = {
  SOCIAL_TOKEN_FACTORY: process.env.NEXT_PUBLIC_SOCIAL_TOKEN_FACTORY_ADDRESS || "",
  CREATOR_WALLET_FACTORY: process.env.NEXT_PUBLIC_CREATOR_WALLET_FACTORY_ADDRESS || "",
  CREATOR_IDENTITY_NFT: process.env.NEXT_PUBLIC_CREATOR_IDENTITY_NFT_ADDRESS || "",
  REWARD_DISTRIBUTOR: process.env.NEXT_PUBLIC_REWARD_DISTRIBUTOR_ADDRESS || "",
};

// Contract instances
export const socialTokenFactory = getContract({
  client,
  chain,
  address: CONTRACT_ADDRESSES.SOCIAL_TOKEN_FACTORY,
});

export const creatorWalletFactory = getContract({
  client,
  chain,
  address: CONTRACT_ADDRESSES.CREATOR_WALLET_FACTORY,
});

export const creatorIdentityNFT = getContract({
  client,
  chain,
  address: CONTRACT_ADDRESSES.CREATOR_IDENTITY_NFT,
});

export const rewardDistributor = getContract({
  client,
  chain,
  address: CONTRACT_ADDRESSES.REWARD_DISTRIBUTOR,
});

// ABIs
export const SOCIAL_TOKEN_FACTORY_ABI = [
  // Creator verification
  "function verifyCreator(address _creator, string memory _handle, string memory _platform, uint256 _initialFollowers) external",
  "function getVerifiedCreatorStatus(address _creator) external view returns (bool)",
  "function getCreatorData(address _creator) external view returns (string memory handle, string memory platform, uint256 initialFollowers, uint256 verificationTimestamp, bool isVerified, address tokenAddress)",
  
  // Token creation
  "function createToken((string name, string symbol, uint256 tokensPerFollower, uint256 tokensPerPost, uint256 maxSupply) memory _config) external payable",
  "function getCreatorToken(address _creator) external view returns (address)",
  "function getAllTokens() external view returns (address[] memory)",
  "function getTokenCount() external view returns (uint256)",
  
  // Creator management
  "function getCreatorByHandle(string memory _handle) external view returns (address)",
  "function removeCreatorVerification(address _creator) external",
  
  // Admin functions
  "function setVerificationOracle(address _newOracle) external",
  "function setDeploymentFee(uint256 _newFee) external",
  "function deploymentFee() external view returns (uint256)",
  
  // Events
  "event TokenCreated(address indexed creator, address indexed tokenAddress, string name, string symbol, uint256 initialFollowers)",
  "event CreatorVerified(address indexed creator, string handle, string platform, uint256 followers)",
];

export const CREATOR_TOKEN_ABI = [
  // ERC20 Standard
  "function name() external view returns (string memory)",
  "function symbol() external view returns (string memory)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  
  // Creator Token Specific
  "function creator() external view returns (address)",
  "function oracle() external view returns (address)",
  "function lastFollowerCount() external view returns (uint256)",
  "function tokensPerFollower() external view returns (uint256)",
  "function lastPostCount() external view returns (uint256)",
  "function tokensPerPost() external view returns (uint256)",
  "function maxSupply() external view returns (uint256)",
  "function hasMintingCap() external view returns (bool)",
  
  // Milestone management
  "function addMilestone(uint256 _threshold, uint256 _rewardAmount) external",
  "function getMilestone(uint256 _milestoneId) external view returns (uint256 threshold, uint256 rewardAmount, bool achieved, uint256 achievedAt)",
  "function milestoneCount() external view returns (uint256)",
  
  // Oracle functions
  "function updateFollowerCount(uint256 _newCount) external",
  "function updatePostCount(uint256 _newCount) external",
  "function setOracle(address _newOracle) external",
  
  // Token management
  "function burnTokens(uint256 _amount, string memory _reason) external",
  "function updateMintingRates(uint256 _tokensPerFollower, uint256 _tokensPerPost) external",
  "function getTokenMetrics() external view returns (uint256 _totalSupply, uint256 _lastFollowerCount, uint256 _lastPostCount, uint256 _tokensPerFollower, uint256 _tokensPerPost, uint256 _maxSupply, address _creator, address _oracle)",
  
  // Events
  "event FollowerCountUpdated(uint256 oldCount, uint256 newCount, uint256 tokensMinted)",
  "event PostCountUpdated(uint256 oldCount, uint256 newCount, uint256 tokensMinted)",
  "event MilestoneAchieved(uint256 milestoneId, uint256 threshold, uint256 reward)",
  "event TokensBurned(address indexed account, uint256 amount, string reason)",
];

export const CREATOR_WALLET_FACTORY_ABI = [
  // Wallet creation
  "function createWallet() external returns (address)",
  "function createWalletFor(address _creator) external returns (address)",
  "function batchCreateWallets(address[] memory _creators) external returns (address[] memory)",
  
  // Wallet queries
  "function getCreatorWallet(address _creator) external view returns (address)",
  "function isWalletForCreator(address _wallet) external view returns (bool)",
  "function getAllWallets() external view returns (address[] memory)",
  "function getWalletCount() external view returns (uint256)",
  "function getWalletsForCreators(address[] memory _creators) external view returns (address[] memory)",
  
  // Authorization
  "function authorizeCreator(address _creator) external",
  "function batchAuthorizeCreators(address[] memory _creators) external",
  "function deauthorizeCreator(address _creator) external",
  "function isAuthorizedCreator(address _creator) external view returns (bool)",
  "function setVerificationContract(address _verificationContract) external",
  
  // Events
  "event WalletDeployed(address indexed creator, address indexed walletAddress)",
  "event CreatorAuthorized(address indexed creator)",
];

export const CREATOR_WALLET_ABI = [
  "function owner() external view returns (address)",
  "function execute(address _to, uint256 _value, bytes calldata _data) external returns (bool success)",
  "function batchExecute(address[] calldata _to, uint256[] calldata _values, bytes[] calldata _data) external returns (bool[] memory successes)",
  
  "event TransactionExecuted(address indexed to, uint256 value, bytes data, bool success)",
];

export const CREATOR_IDENTITY_NFT_ABI = [
  // ERC721 Standard
  "function balanceOf(address owner) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function totalSupply() external view returns (uint256)",
  
  // Creator Identity Specific
  "function mintCreatorBadge(address _creator, string memory _handle, string memory _platform, uint256 _initialFollowers, string memory _profileImageUrl, uint256 _engagementScore) external returns (uint256)",
  "function batchMintBadges(address[] memory _creators, string[] memory _handles, string[] memory _platforms, uint256[] memory _followersArray, string[] memory _profileImages, uint256[] memory _engagementScores) external returns (uint256[] memory)",
  
  // Profile management
  "function getCreatorProfile(uint256 _tokenId) external view returns ((string handle, string platform, uint256 initialFollowers, uint256 verificationTimestamp, string profileImageUrl, uint256 engagementScore, bool isActive))",
  "function getCreatorTokenId(address _creator) external view returns (uint256)",
  "function hasCreatorBadge(address _creator) external view returns (bool)",
  "function updateCreatorProfile(uint256 _tokenId, string memory _profileImageUrl, uint256 _engagementScore) external",
  
  // Badge management
  "function deactivateBadge(uint256 _tokenId) external",
  "function reactivateBadge(uint256 _tokenId) external",
  
  // Metadata
  "function generateSVG(uint256 _tokenId) external view returns (string memory)",
  "function generateMetadata(uint256 _tokenId) external view returns (string memory)",
  
  // Authorization
  "function authorizeMinter(address _minter) external",
  "function deauthorizeMinter(address _minter) external",
  
  // Events
  "event CreatorBadgeMinted(address indexed creator, uint256 indexed tokenId, string handle, string platform, uint256 followers)",
  "event ProfileUpdated(uint256 indexed tokenId, string field, string newValue)",
];

export const REWARD_DISTRIBUTOR_ABI = [
  // Campaign management
  "function createCampaign(address _token, uint256 _totalAmount, uint256 _duration, bytes32 _merkleRoot, string memory _description) external returns (uint256)",
  "function getCampaign(uint256 _campaignId) external view returns ((address creator, address token, uint256 totalAmount, uint256 distributedAmount, uint256 startTime, uint256 endTime, bytes32 merkleRoot, bool isActive, string description))",
  "function updateCampaignStatus(uint256 _campaignId, bool _isActive) external",
  "function withdrawRemainingTokens(uint256 _campaignId) external",
  
  // Distribution
  "function batchDistribute(uint256 _campaignId, address[] memory _recipients, uint256[] memory _amounts, string[] memory _reasons) external",
  "function emergencyDistribute(uint256 _campaignId, address _recipient, uint256 _amount, string memory _reason) external",
  "function claimReward(uint256 _campaignId, uint256 _amount, string memory _reason, bytes32[] calldata _merkleProof) external",
  
  // Queries
  "function getCreatorCampaigns(address _creator) external view returns (uint256[] memory)",
  "function getRecipientRewards(address _recipient) external view returns (uint256[] memory)",
  "function hasClaimedFromCampaign(uint256 _campaignId, address _recipient) external view returns (bool)",
  "function getTotalCampaigns() external view returns (uint256)",
  "function getTotalRewards() external view returns (uint256)",
  
  // Fee management
  "function distributionFee() external view returns (uint256)",
  "function setDistributionFee(uint256 _distributionFee) external",
  "function setFeeRecipient(address _feeRecipient) external",
  
  // Events
  "event CampaignCreated(uint256 indexed campaignId, address indexed creator, address indexed token, uint256 totalAmount, bytes32 merkleRoot)",
  "event RewardDistributed(uint256 indexed campaignId, address indexed recipient, uint256 amount, string reason)",
  "event RewardClaimed(uint256 indexed campaignId, address indexed recipient, uint256 amount)",
];

// Type definitions
export interface TokenConfig {
  name: string;
  symbol: string;
  tokensPerFollower: bigint;
  tokensPerPost: bigint;
  maxSupply: bigint;
}

export interface CreatorData {
  handle: string;
  platform: string;
  initialFollowers: bigint;
  verificationTimestamp: bigint;
  isVerified: boolean;
  tokenAddress: string;
}

export interface CreatorProfile {
  handle: string;
  platform: string;
  initialFollowers: bigint;
  verificationTimestamp: bigint;
  profileImageUrl: string;
  engagementScore: bigint;
  isActive: boolean;
}

export interface Campaign {
  creator: string;
  token: string;
  totalAmount: bigint;
  distributedAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  merkleRoot: string;
  isActive: boolean;
  description: string;
}

export interface Milestone {
  threshold: bigint;
  rewardAmount: bigint;
  achieved: boolean;
  achievedAt: bigint;
}

export interface TokenMetrics {
  totalSupply: bigint;
  lastFollowerCount: bigint;
  lastPostCount: bigint;
  tokensPerFollower: bigint;
  tokensPerPost: bigint;
  maxSupply: bigint;
  creator: string;
  oracle: string;
}

// Helper function to get contract instance for any CreatorToken
export function getCreatorTokenContract(address: string) {
  return getContract({
    client,
    chain,
    address,
  });
}

// Helper function to get contract instance for any CreatorWallet
export function getCreatorWalletContract(address: string) {
  return getContract({
    client,
    chain,
    address,
  });
}