const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Configuration
  const DEPLOYMENT_FEE = ethers.utils.parseEther("0.001"); // 0.001 ETH
  const DISTRIBUTION_FEE = 250; // 2.5% in basis points
  const VERIFICATION_ORACLE = deployer.address; // Initially set to deployer

  // 1. Deploy SocialTokenFactory
  console.log("\n1. Deploying SocialTokenFactory...");
  const SocialTokenFactory = await ethers.getContractFactory("SocialTokenFactory");
  const socialTokenFactory = await SocialTokenFactory.deploy(
    VERIFICATION_ORACLE,
    DEPLOYMENT_FEE,
    deployer.address // fee recipient
  );
  await socialTokenFactory.deployed();
  console.log("SocialTokenFactory deployed to:", socialTokenFactory.address);

  // 2. Deploy CreatorWalletFactory
  console.log("\n2. Deploying CreatorWalletFactory...");
  const CreatorWalletFactory = await ethers.getContractFactory("CreatorWalletFactory");
  const creatorWalletFactory = await CreatorWalletFactory.deploy();
  await creatorWalletFactory.deployed();
  console.log("CreatorWalletFactory deployed to:", creatorWalletFactory.address);

  // 3. Deploy CreatorIdentityNFT
  console.log("\n3. Deploying CreatorIdentityNFT...");
  const CreatorIdentityNFT = await ethers.getContractFactory("CreatorIdentityNFT");
  const creatorIdentityNFT = await CreatorIdentityNFT.deploy(
    "XMenity Creator Badge",
    "XMCB",
    "https://api.xmenity.com/metadata/", // Base URI
    socialTokenFactory.address
  );
  await creatorIdentityNFT.deployed();
  console.log("CreatorIdentityNFT deployed to:", creatorIdentityNFT.address);

  // 4. Deploy RewardDistributor
  console.log("\n4. Deploying RewardDistributor...");
  const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
  const rewardDistributor = await RewardDistributor.deploy(
    DISTRIBUTION_FEE,
    deployer.address // fee recipient
  );
  await rewardDistributor.deployed();
  console.log("RewardDistributor deployed to:", rewardDistributor.address);

  // 5. Configure contracts
  console.log("\n5. Configuring contracts...");

  // Set verification contract in CreatorWalletFactory
  await creatorWalletFactory.setVerificationContract(socialTokenFactory.address);
  console.log("✓ Set verification contract in CreatorWalletFactory");

  // Authorize CreatorIdentityNFT as minter in SocialTokenFactory (if needed)
  // This would be done through additional functions or admin controls

  // 6. Deploy a sample CreatorToken for testing (optional)
  console.log("\n6. Deploying sample CreatorToken...");
  const CreatorToken = await ethers.getContractFactory("CreatorToken");
  const sampleToken = await CreatorToken.deploy(
    "XMenity Test Token",
    "XMTEST",
    deployer.address,
    1000, // initial followers
    1, // 1 token per follower
    10, // 10 tokens per post
    ethers.utils.parseEther("1000000") // max supply: 1M tokens
  );
  await sampleToken.deployed();
  console.log("Sample CreatorToken deployed to:", sampleToken.address);

  // 7. Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      SocialTokenFactory: socialTokenFactory.address,
      CreatorWalletFactory: creatorWalletFactory.address,
      CreatorIdentityNFT: creatorIdentityNFT.address,
      RewardDistributor: rewardDistributor.address,
      SampleCreatorToken: sampleToken.address,
    },
    configuration: {
      deploymentFee: DEPLOYMENT_FEE.toString(),
      distributionFee: DISTRIBUTION_FEE,
      verificationOracle: VERIFICATION_ORACLE,
    },
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentFile}`);

  // 8. Verify contracts (if on public network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n8. Contract verification info:");
    console.log("Run these commands to verify contracts on Etherscan/Arbiscan:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${socialTokenFactory.address} "${VERIFICATION_ORACLE}" "${DEPLOYMENT_FEE}" "${deployer.address}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${creatorWalletFactory.address}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${creatorIdentityNFT.address} "XMenity Creator Badge" "XMCB" "https://api.xmenity.com/metadata/" "${socialTokenFactory.address}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${rewardDistributor.address} "${DISTRIBUTION_FEE}" "${deployer.address}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${sampleToken.address} "XMenity Test Token" "XMTEST" "${deployer.address}" "1000" "1" "10" "${ethers.utils.parseEther("1000000")}"`);
  }

  console.log("\n✅ Deployment completed successfully!");
  console.log("\nContract Addresses:");
  console.log("===================");
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });

  console.log("\nNext Steps:");
  console.log("1. Update your frontend environment variables with these contract addresses");
  console.log("2. Configure the oracle service to interact with these contracts");
  console.log("3. Set up InsightIQ integration with the verification oracle");
  console.log("4. Test the complete flow: verify creator → create wallet → deploy token → distribute rewards");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });