// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title CreatorToken
 * @dev ERC20 token for social media creators with milestone-based minting/burning
 * Each creator gets their own token with custom name, symbol, and milestone logic
 */
contract CreatorToken is ERC20, Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // Milestone tracking
    uint256 public lastFollowerCount;
    uint256 public tokensPerFollower;
    uint256 public lastPostCount;
    uint256 public tokensPerPost;
    
    // Oracle and authorization
    address public oracle;
    address public immutable creator;
    
    // Token parameters
    uint256 public maxSupply;
    bool public hasMintingCap;
    
    // Milestone thresholds
    struct Milestone {
        uint256 threshold;
        uint256 rewardAmount;
        bool achieved;
        uint256 achievedAt;
    }
    
    mapping(uint256 => Milestone) public milestones;
    uint256 public milestoneCount;
    
    // Events
    event FollowerCountUpdated(uint256 oldCount, uint256 newCount, uint256 tokensMinted);
    event PostCountUpdated(uint256 oldCount, uint256 newCount, uint256 tokensMinted);
    event MilestoneAchieved(uint256 milestoneId, uint256 threshold, uint256 reward);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event TokensBurned(address indexed account, uint256 amount, string reason);
    
    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == oracle, "CreatorToken: Not authorized oracle");
        _;
    }
    
    modifier onlyCreatorOrOracle() {
        require(msg.sender == creator || msg.sender == oracle, "CreatorToken: Not authorized");
        _;
    }

    /**
     * @dev Constructor for CreatorToken
     * @param _name Token name (e.g. "AliceCoin")
     * @param _symbol Token symbol (e.g. "ALICE")
     * @param _creator Address of the creator who owns this token
     * @param _initialFollowerCount Initial follower count from InsightIQ
     * @param _tokensPerFollower Tokens to mint per new follower
     * @param _tokensPerPost Tokens to mint per new post
     * @param _maxSupply Maximum token supply (0 for unlimited)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _creator,
        uint256 _initialFollowerCount,
        uint256 _tokensPerFollower,
        uint256 _tokensPerPost,
        uint256 _maxSupply
    ) ERC20(_name, _symbol) {
        creator = _creator;
        oracle = msg.sender; // Factory deploys, so factory is initial oracle
        lastFollowerCount = _initialFollowerCount;
        tokensPerFollower = _tokensPerFollower;
        tokensPerPost = _tokensPerPost;
        maxSupply = _maxSupply;
        hasMintingCap = _maxSupply > 0;
        
        // Transfer ownership to creator
        _transferOwnership(_creator);
    }

    /**
     * @dev Update follower count and mint tokens based on increase
     * @param _newCount New follower count from InsightIQ oracle
     */
    function updateFollowerCount(uint256 _newCount) external onlyOracle nonReentrant {
        require(_newCount >= lastFollowerCount, "CreatorToken: Followers cannot decrease");
        
        if (_newCount > lastFollowerCount) {
            uint256 increase = _newCount.sub(lastFollowerCount);
            uint256 tokensToMint = increase.mul(tokensPerFollower);
            
            if (hasMintingCap) {
                require(totalSupply().add(tokensToMint) <= maxSupply, "CreatorToken: Exceeds max supply");
            }
            
            _mint(creator, tokensToMint);
            emit FollowerCountUpdated(lastFollowerCount, _newCount, tokensToMint);
        }
        
        lastFollowerCount = _newCount;
        _checkMilestones(_newCount);
    }

    /**
     * @dev Update post count and mint tokens based on new posts
     * @param _newCount New post count from InsightIQ oracle
     */
    function updatePostCount(uint256 _newCount) external onlyOracle nonReentrant {
        require(_newCount >= lastPostCount, "CreatorToken: Posts cannot decrease");
        
        if (_newCount > lastPostCount) {
            uint256 increase = _newCount.sub(lastPostCount);
            uint256 tokensToMint = increase.mul(tokensPerPost);
            
            if (hasMintingCap) {
                require(totalSupply().add(tokensToMint) <= maxSupply, "CreatorToken: Exceeds max supply");
            }
            
            _mint(creator, tokensToMint);
            emit PostCountUpdated(lastPostCount, _newCount, tokensToMint);
        }
        
        lastPostCount = _newCount;
    }

    /**
     * @dev Add a new milestone threshold
     * @param _threshold Follower count threshold
     * @param _rewardAmount Token reward for achieving milestone
     */
    function addMilestone(uint256 _threshold, uint256 _rewardAmount) external onlyCreatorOrOracle {
        milestones[milestoneCount] = Milestone({
            threshold: _threshold,
            rewardAmount: _rewardAmount,
            achieved: false,
            achievedAt: 0
        });
        milestoneCount++;
    }

    /**
     * @dev Check and process milestone achievements
     * @param _currentFollowers Current follower count
     */
    function _checkMilestones(uint256 _currentFollowers) internal {
        for (uint256 i = 0; i < milestoneCount; i++) {
            Milestone storage milestone = milestones[i];
            if (!milestone.achieved && _currentFollowers >= milestone.threshold) {
                milestone.achieved = true;
                milestone.achievedAt = block.timestamp;
                
                if (hasMintingCap) {
                    require(totalSupply().add(milestone.rewardAmount) <= maxSupply, "CreatorToken: Milestone exceeds max supply");
                }
                
                _mint(creator, milestone.rewardAmount);
                emit MilestoneAchieved(i, milestone.threshold, milestone.rewardAmount);
            }
        }
    }

    /**
     * @dev Burn tokens from creator's balance (for metric decreases)
     * @param _amount Amount of tokens to burn
     * @param _reason Reason for burning (e.g., "follower_decrease")
     */
    function burnTokens(uint256 _amount, string memory _reason) external onlyCreatorOrOracle {
        require(balanceOf(creator) >= _amount, "CreatorToken: Insufficient balance to burn");
        _burn(creator, _amount);
        emit TokensBurned(creator, _amount, _reason);
    }

    /**
     * @dev Update oracle address (only creator can do this)
     * @param _newOracle New oracle address
     */
    function setOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "CreatorToken: Invalid oracle address");
        address oldOracle = oracle;
        oracle = _newOracle;
        emit OracleUpdated(oldOracle, _newOracle);
    }

    /**
     * @dev Update minting parameters (only creator)
     * @param _tokensPerFollower New tokens per follower rate
     * @param _tokensPerPost New tokens per post rate
     */
    function updateMintingRates(uint256 _tokensPerFollower, uint256 _tokensPerPost) external onlyOwner {
        tokensPerFollower = _tokensPerFollower;
        tokensPerPost = _tokensPerPost;
    }

    /**
     * @dev Get milestone information
     * @param _milestoneId Milestone ID
     */
    function getMilestone(uint256 _milestoneId) external view returns (
        uint256 threshold,
        uint256 rewardAmount,
        bool achieved,
        uint256 achievedAt
    ) {
        require(_milestoneId < milestoneCount, "CreatorToken: Invalid milestone ID");
        Milestone memory milestone = milestones[_milestoneId];
        return (milestone.threshold, milestone.rewardAmount, milestone.achieved, milestone.achievedAt);
    }

    /**
     * @dev Get current token metrics
     */
    function getTokenMetrics() external view returns (
        uint256 _totalSupply,
        uint256 _lastFollowerCount,
        uint256 _lastPostCount,
        uint256 _tokensPerFollower,
        uint256 _tokensPerPost,
        uint256 _maxSupply,
        address _creator,
        address _oracle
    ) {
        return (
            totalSupply(),
            lastFollowerCount,
            lastPostCount,
            tokensPerFollower,
            tokensPerPost,
            maxSupply,
            creator,
            oracle
        );
    }

    /**
     * @dev Override decimals to use 18 (standard)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}