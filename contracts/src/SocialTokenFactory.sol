// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CreatorToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title SocialTokenFactory
 * @dev Factory contract to deploy CreatorToken contracts for verified social media creators
 * Integrates with InsightIQ verification and manages the deployment process
 */
contract SocialTokenFactory is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // Token tracking
    address[] public deployedTokens;
    mapping(address => address) public creatorToToken; // creator address => token address
    mapping(address => bool) public isVerifiedCreator;
    mapping(address => CreatorData) public creatorData;
    
    // Fee management
    uint256 public deploymentFee;
    address public feeRecipient;
    
    // Verification system
    address public verificationOracle;
    mapping(string => address) public handleToCreator; // social handle => creator address
    
    struct CreatorData {
        string handle;
        string platform; // "twitter", "instagram", etc.
        uint256 initialFollowers;
        uint256 verificationTimestamp;
        bool isVerified;
    }
    
    struct TokenConfig {
        string name;
        string symbol;
        uint256 tokensPerFollower;
        uint256 tokensPerPost;
        uint256 maxSupply; // 0 for unlimited
    }

    // Events
    event TokenCreated(
        address indexed creator,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 initialFollowers
    );
    event CreatorVerified(
        address indexed creator,
        string handle,
        string platform,
        uint256 followers
    );
    event VerificationOracleUpdated(address indexed oldOracle, address indexed newOracle);
    event DeploymentFeeUpdated(uint256 oldFee, uint256 newFee);

    // Modifiers
    modifier onlyVerifiedCreator() {
        require(isVerifiedCreator[msg.sender], "SocialTokenFactory: Not a verified creator");
        _;
    }
    
    modifier onlyOracle() {
        require(msg.sender == verificationOracle, "SocialTokenFactory: Not authorized oracle");
        _;
    }

    /**
     * @dev Constructor
     * @param _verificationOracle Address of the verification oracle
     * @param _deploymentFee Fee to deploy a token (in wei)
     * @param _feeRecipient Address to receive deployment fees
     */
    constructor(
        address _verificationOracle,
        uint256 _deploymentFee,
        address _feeRecipient
    ) {
        verificationOracle = _verificationOracle;
        deploymentFee = _deploymentFee;
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Verify a creator through InsightIQ data
     * @param _creator Creator's wallet address
     * @param _handle Social media handle (e.g. "@alice")
     * @param _platform Platform name (e.g. "twitter")
     * @param _initialFollowers Initial follower count from InsightIQ
     */
    function verifyCreator(
        address _creator,
        string memory _handle,
        string memory _platform,
        uint256 _initialFollowers
    ) external onlyOracle {
        require(_creator != address(0), "SocialTokenFactory: Invalid creator address");
        require(bytes(_handle).length > 0, "SocialTokenFactory: Invalid handle");
        require(!isVerifiedCreator[_creator], "SocialTokenFactory: Already verified");
        
        // Store creator data
        creatorData[_creator] = CreatorData({
            handle: _handle,
            platform: _platform,
            initialFollowers: _initialFollowers,
            verificationTimestamp: block.timestamp,
            isVerified: true
        });
        
        isVerifiedCreator[_creator] = true;
        handleToCreator[_handle] = _creator;
        
        emit CreatorVerified(_creator, _handle, _platform, _initialFollowers);
    }

    /**
     * @dev Create a new social token for a verified creator
     * @param _config Token configuration parameters
     */
    function createToken(TokenConfig memory _config) external payable onlyVerifiedCreator nonReentrant {
        require(creatorToToken[msg.sender] == address(0), "SocialTokenFactory: Token already exists");
        require(msg.value >= deploymentFee, "SocialTokenFactory: Insufficient deployment fee");
        require(bytes(_config.name).length > 0, "SocialTokenFactory: Invalid token name");
        require(bytes(_config.symbol).length > 0, "SocialTokenFactory: Invalid token symbol");
        
        CreatorData memory creator = creatorData[msg.sender];
        
        // Deploy new CreatorToken
        CreatorToken newToken = new CreatorToken(
            _config.name,
            _config.symbol,
            msg.sender,
            creator.initialFollowers,
            _config.tokensPerFollower,
            _config.tokensPerPost,
            _config.maxSupply
        );
        
        address tokenAddress = address(newToken);
        
        // Update mappings
        deployedTokens.push(tokenAddress);
        creatorToToken[msg.sender] = tokenAddress;
        
        // Transfer deployment fee
        if (deploymentFee > 0 && feeRecipient != address(0)) {
            payable(feeRecipient).transfer(deploymentFee);
        }
        
        // Refund excess payment
        if (msg.value > deploymentFee) {
            payable(msg.sender).transfer(msg.value.sub(deploymentFee));
        }
        
        emit TokenCreated(
            msg.sender,
            tokenAddress,
            _config.name,
            _config.symbol,
            creator.initialFollowers
        );
    }

    /**
     * @dev Batch create tokens for multiple creators (admin only)
     * @param _creators Array of creator addresses
     * @param _configs Array of token configurations
     */
    function batchCreateTokens(
        address[] memory _creators,
        TokenConfig[] memory _configs
    ) external onlyOwner {
        require(_creators.length == _configs.length, "SocialTokenFactory: Array length mismatch");
        
        for (uint256 i = 0; i < _creators.length; i++) {
            address creator = _creators[i];
            TokenConfig memory config = _configs[i];
            
            require(isVerifiedCreator[creator], "SocialTokenFactory: Creator not verified");
            require(creatorToToken[creator] == address(0), "SocialTokenFactory: Token already exists");
            
            CreatorData memory creatorInfo = creatorData[creator];
            
            CreatorToken newToken = new CreatorToken(
                config.name,
                config.symbol,
                creator,
                creatorInfo.initialFollowers,
                config.tokensPerFollower,
                config.tokensPerPost,
                config.maxSupply
            );
            
            address tokenAddress = address(newToken);
            deployedTokens.push(tokenAddress);
            creatorToToken[creator] = tokenAddress;
            
            emit TokenCreated(
                creator,
                tokenAddress,
                config.name,
                config.symbol,
                creatorInfo.initialFollowers
            );
        }
    }

    /**
     * @dev Get token address for a creator
     * @param _creator Creator address
     */
    function getCreatorToken(address _creator) external view returns (address) {
        return creatorToToken[_creator];
    }

    /**
     * @dev Get creator by social handle
     * @param _handle Social media handle
     */
    function getCreatorByHandle(string memory _handle) external view returns (address) {
        return handleToCreator[_handle];
    }

    /**
     * @dev Get all deployed tokens
     */
    function getAllTokens() external view returns (address[] memory) {
        return deployedTokens;
    }

    /**
     * @dev Get total number of deployed tokens
     */
    function getTokenCount() external view returns (uint256) {
        return deployedTokens.length;
    }

    /**
     * @dev Get tokens by creator addresses
     * @param _creators Array of creator addresses
     */
    function getTokensByCreators(address[] memory _creators) external view returns (address[] memory) {
        address[] memory tokens = new address[](_creators.length);
        for (uint256 i = 0; i < _creators.length; i++) {
            tokens[i] = creatorToToken[_creators[i]];
        }
        return tokens;
    }

    /**
     * @dev Get creator data
     * @param _creator Creator address
     */
    function getCreatorData(address _creator) external view returns (
        string memory handle,
        string memory platform,
        uint256 initialFollowers,
        uint256 verificationTimestamp,
        bool isVerified,
        address tokenAddress
    ) {
        CreatorData memory data = creatorData[_creator];
        return (
            data.handle,
            data.platform,
            data.initialFollowers,
            data.verificationTimestamp,
            data.isVerified,
            creatorToToken[_creator]
        );
    }

    /**
     * @dev Update verification oracle (only owner)
     * @param _newOracle New oracle address
     */
    function setVerificationOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "SocialTokenFactory: Invalid oracle address");
        address oldOracle = verificationOracle;
        verificationOracle = _newOracle;
        emit VerificationOracleUpdated(oldOracle, _newOracle);
    }

    /**
     * @dev Update deployment fee (only owner)
     * @param _newFee New deployment fee in wei
     */
    function setDeploymentFee(uint256 _newFee) external onlyOwner {
        uint256 oldFee = deploymentFee;
        deploymentFee = _newFee;
        emit DeploymentFeeUpdated(oldFee, _newFee);
    }

    /**
     * @dev Update fee recipient (only owner)
     * @param _newRecipient New fee recipient address
     */
    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "SocialTokenFactory: Invalid recipient");
        feeRecipient = _newRecipient;
    }

    /**
     * @dev Remove creator verification (only owner, emergency use)
     * @param _creator Creator to remove verification
     */
    function removeCreatorVerification(address _creator) external onlyOwner {
        require(isVerifiedCreator[_creator], "SocialTokenFactory: Creator not verified");
        
        CreatorData memory data = creatorData[_creator];
        delete handleToCreator[data.handle];
        delete creatorData[_creator];
        isVerifiedCreator[_creator] = false;
    }

    /**
     * @dev Emergency pause for token creation (only owner)
     */
    bool public paused = false;
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }
    
    modifier whenNotPaused() {
        require(!paused, "SocialTokenFactory: Contract is paused");
        _;
    }

    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "SocialTokenFactory: No balance to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Check if a creator is verified (for interface compatibility)
     * @param _creator Creator address
     */
    function getVerifiedCreatorStatus(address _creator) external view returns (bool) {
        return isVerifiedCreator[_creator];
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}