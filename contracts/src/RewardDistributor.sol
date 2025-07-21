// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title RewardDistributor
 * @dev Handles distribution of creator tokens to followers and community members
 * Supports both direct airdrops and merkle tree-based claims
 */
contract RewardDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Distribution campaign structure
    struct Campaign {
        address creator;
        address token;
        uint256 totalAmount;
        uint256 distributedAmount;
        uint256 startTime;
        uint256 endTime;
        bytes32 merkleRoot;
        bool isActive;
        string description;
    }

    // Individual reward claim
    struct Reward {
        address recipient;
        uint256 amount;
        uint256 campaignId;
        bool claimed;
        uint256 claimTimestamp;
        string reason; // "engagement", "milestone", "referral", "loyalty"
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => bool)) public hasClaimed; // campaignId => recipient => claimed
    mapping(address => uint256[]) public creatorCampaigns; // creator => campaign IDs
    mapping(address => uint256[]) public recipientRewards; // recipient => reward IDs
    mapping(uint256 => Reward) public rewards;

    uint256 public campaignCounter;
    uint256 public rewardCounter;

    // Fee structure
    uint256 public distributionFee; // Fee in basis points (100 = 1%)
    address public feeRecipient;

    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        address indexed token,
        uint256 totalAmount,
        bytes32 merkleRoot
    );
    event RewardDistributed(
        uint256 indexed campaignId,
        address indexed recipient,
        uint256 amount,
        string reason
    );
    event RewardClaimed(
        uint256 indexed campaignId,
        address indexed recipient,
        uint256 amount
    );
    event CampaignUpdated(uint256 indexed campaignId, bool isActive);

    constructor(uint256 _distributionFee, address _feeRecipient) {
        distributionFee = _distributionFee;
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Create a new reward distribution campaign
     * @param _token Token contract address
     * @param _totalAmount Total amount to distribute
     * @param _duration Campaign duration in seconds
     * @param _merkleRoot Merkle root for eligible recipients (empty for direct distribution)
     * @param _description Campaign description
     */
    function createCampaign(
        address _token,
        uint256 _totalAmount,
        uint256 _duration,
        bytes32 _merkleRoot,
        string memory _description
    ) external nonReentrant returns (uint256) {
        require(_token != address(0), "RewardDistributor: Invalid token address");
        require(_totalAmount > 0, "RewardDistributor: Invalid amount");
        require(_duration > 0, "RewardDistributor: Invalid duration");

        // Transfer tokens to this contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _totalAmount);

        uint256 campaignId = campaignCounter++;
        
        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            token: _token,
            totalAmount: _totalAmount,
            distributedAmount: 0,
            startTime: block.timestamp,
            endTime: block.timestamp.add(_duration),
            merkleRoot: _merkleRoot,
            isActive: true,
            description: _description
        });

        creatorCampaigns[msg.sender].push(campaignId);

        emit CampaignCreated(campaignId, msg.sender, _token, _totalAmount, _merkleRoot);
        return campaignId;
    }

    /**
     * @dev Distribute tokens directly to multiple recipients
     * @param _campaignId Campaign ID
     * @param _recipients Array of recipient addresses
     * @param _amounts Array of token amounts
     * @param _reasons Array of distribution reasons
     */
    function batchDistribute(
        uint256 _campaignId,
        address[] memory _recipients,
        uint256[] memory _amounts,
        string[] memory _reasons
    ) external nonReentrant {
        require(_recipients.length == _amounts.length, "RewardDistributor: Array length mismatch");
        require(_recipients.length == _reasons.length, "RewardDistributor: Array length mismatch");
        
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator == msg.sender, "RewardDistributor: Not campaign creator");
        require(campaign.isActive, "RewardDistributor: Campaign not active");
        require(block.timestamp >= campaign.startTime, "RewardDistributor: Campaign not started");
        require(block.timestamp <= campaign.endTime, "RewardDistributor: Campaign ended");

        uint256 totalToDistribute = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalToDistribute = totalToDistribute.add(_amounts[i]);
        }

        require(
            campaign.distributedAmount.add(totalToDistribute) <= campaign.totalAmount,
            "RewardDistributor: Exceeds campaign allocation"
        );

        // Calculate fee
        uint256 fee = totalToDistribute.mul(distributionFee).div(10000);
        uint256 netAmount = totalToDistribute.sub(fee);

        // Update campaign
        campaign.distributedAmount = campaign.distributedAmount.add(totalToDistribute);

        // Distribute to recipients
        for (uint256 i = 0; i < _recipients.length; i++) {
            address recipient = _recipients[i];
            uint256 amount = _amounts[i];
            string memory reason = _reasons[i];

            // Create reward record
            uint256 rewardId = rewardCounter++;
            rewards[rewardId] = Reward({
                recipient: recipient,
                amount: amount,
                campaignId: _campaignId,
                claimed: true, // Direct distribution is immediately claimed
                claimTimestamp: block.timestamp,
                reason: reason
            });

            recipientRewards[recipient].push(rewardId);

            // Calculate recipient's share of net amount
            uint256 recipientAmount = amount.sub(amount.mul(distributionFee).div(10000));

            // Transfer tokens
            IERC20(campaign.token).safeTransfer(recipient, recipientAmount);

            emit RewardDistributed(_campaignId, recipient, amount, reason);
        }

        // Transfer fee to fee recipient
        if (fee > 0 && feeRecipient != address(0)) {
            IERC20(campaign.token).safeTransfer(feeRecipient, fee);
        }
    }

    /**
     * @dev Claim rewards using merkle proof
     * @param _campaignId Campaign ID
     * @param _amount Amount to claim
     * @param _reason Reason for reward
     * @param _merkleProof Merkle proof
     */
    function claimReward(
        uint256 _campaignId,
        uint256 _amount,
        string memory _reason,
        bytes32[] calldata _merkleProof
    ) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "RewardDistributor: Campaign not active");
        require(block.timestamp >= campaign.startTime, "RewardDistributor: Campaign not started");
        require(block.timestamp <= campaign.endTime, "RewardDistributor: Campaign ended");
        require(!hasClaimed[_campaignId][msg.sender], "RewardDistributor: Already claimed");

        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, _amount, _reason));
        require(
            MerkleProof.verify(_merkleProof, campaign.merkleRoot, leaf),
            "RewardDistributor: Invalid proof"
        );

        require(
            campaign.distributedAmount.add(_amount) <= campaign.totalAmount,
            "RewardDistributor: Exceeds campaign allocation"
        );

        // Mark as claimed
        hasClaimed[_campaignId][msg.sender] = true;
        campaign.distributedAmount = campaign.distributedAmount.add(_amount);

        // Create reward record
        uint256 rewardId = rewardCounter++;
        rewards[rewardId] = Reward({
            recipient: msg.sender,
            amount: _amount,
            campaignId: _campaignId,
            claimed: true,
            claimTimestamp: block.timestamp,
            reason: _reason
        });

        recipientRewards[msg.sender].push(rewardId);

        // Calculate fee and net amount
        uint256 fee = _amount.mul(distributionFee).div(10000);
        uint256 netAmount = _amount.sub(fee);

        // Transfer tokens
        IERC20(campaign.token).safeTransfer(msg.sender, netAmount);

        // Transfer fee
        if (fee > 0 && feeRecipient != address(0)) {
            IERC20(campaign.token).safeTransfer(feeRecipient, fee);
        }

        emit RewardClaimed(_campaignId, msg.sender, _amount);
    }

    /**
     * @dev Emergency distribution for a single recipient (creator only)
     * @param _campaignId Campaign ID
     * @param _recipient Recipient address
     * @param _amount Amount to distribute
     * @param _reason Distribution reason
     */
    function emergencyDistribute(
        uint256 _campaignId,
        address _recipient,
        uint256 _amount,
        string memory _reason
    ) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator == msg.sender, "RewardDistributor: Not campaign creator");
        require(campaign.isActive, "RewardDistributor: Campaign not active");
        require(
            campaign.distributedAmount.add(_amount) <= campaign.totalAmount,
            "RewardDistributor: Exceeds campaign allocation"
        );

        campaign.distributedAmount = campaign.distributedAmount.add(_amount);

        // Create reward record
        uint256 rewardId = rewardCounter++;
        rewards[rewardId] = Reward({
            recipient: _recipient,
            amount: _amount,
            campaignId: _campaignId,
            claimed: true,
            claimTimestamp: block.timestamp,
            reason: _reason
        });

        recipientRewards[_recipient].push(rewardId);

        // Calculate fee and net amount
        uint256 fee = _amount.mul(distributionFee).div(10000);
        uint256 netAmount = _amount.sub(fee);

        // Transfer tokens
        IERC20(campaign.token).safeTransfer(_recipient, netAmount);

        // Transfer fee
        if (fee > 0 && feeRecipient != address(0)) {
            IERC20(campaign.token).safeTransfer(feeRecipient, fee);
        }

        emit RewardDistributed(_campaignId, _recipient, _amount, _reason);
    }

    /**
     * @dev Update campaign status
     * @param _campaignId Campaign ID
     * @param _isActive New active status
     */
    function updateCampaignStatus(uint256 _campaignId, bool _isActive) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(
            campaign.creator == msg.sender || msg.sender == owner(),
            "RewardDistributor: Not authorized"
        );

        campaign.isActive = _isActive;
        emit CampaignUpdated(_campaignId, _isActive);
    }

    /**
     * @dev Withdraw remaining tokens from campaign (creator only)
     * @param _campaignId Campaign ID
     */
    function withdrawRemainingTokens(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator == msg.sender, "RewardDistributor: Not campaign creator");
        require(
            block.timestamp > campaign.endTime || !campaign.isActive,
            "RewardDistributor: Campaign still active"
        );

        uint256 remainingAmount = campaign.totalAmount.sub(campaign.distributedAmount);
        require(remainingAmount > 0, "RewardDistributor: No tokens to withdraw");

        campaign.distributedAmount = campaign.totalAmount; // Mark as fully distributed

        IERC20(campaign.token).safeTransfer(msg.sender, remainingAmount);
    }

    /**
     * @dev Get campaign information
     * @param _campaignId Campaign ID
     */
    function getCampaign(uint256 _campaignId) external view returns (Campaign memory) {
        return campaigns[_campaignId];
    }

    /**
     * @dev Get campaigns created by a creator
     * @param _creator Creator address
     */
    function getCreatorCampaigns(address _creator) external view returns (uint256[] memory) {
        return creatorCampaigns[_creator];
    }

    /**
     * @dev Get rewards for a recipient
     * @param _recipient Recipient address
     */
    function getRecipientRewards(address _recipient) external view returns (uint256[] memory) {
        return recipientRewards[_recipient];
    }

    /**
     * @dev Check if recipient has claimed from campaign
     * @param _campaignId Campaign ID
     * @param _recipient Recipient address
     */
    function hasClaimedFromCampaign(uint256 _campaignId, address _recipient) external view returns (bool) {
        return hasClaimed[_campaignId][_recipient];
    }

    /**
     * @dev Get total number of campaigns
     */
    function getTotalCampaigns() external view returns (uint256) {
        return campaignCounter;
    }

    /**
     * @dev Get total number of rewards
     */
    function getTotalRewards() external view returns (uint256) {
        return rewardCounter;
    }

    /**
     * @dev Set distribution fee (only owner)
     * @param _distributionFee New fee in basis points
     */
    function setDistributionFee(uint256 _distributionFee) external onlyOwner {
        require(_distributionFee <= 1000, "RewardDistributor: Fee too high"); // Max 10%
        distributionFee = _distributionFee;
    }

    /**
     * @dev Set fee recipient (only owner)
     * @param _feeRecipient New fee recipient address
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Emergency token recovery (only owner)
     * @param _token Token address
     * @param _amount Amount to recover
     */
    function emergencyRecoverToken(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}