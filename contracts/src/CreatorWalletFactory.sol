// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title CreatorWallet
 * @dev Simple smart contract wallet for creators
 * Allows creators to execute transactions and manage their assets
 */
contract CreatorWallet {
    address public immutable owner;
    
    event TransactionExecuted(address indexed to, uint256 value, bytes data, bool success);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "CreatorWallet: Not owner");
        _;
    }
    
    constructor(address _owner) {
        owner = _owner;
    }
    
    /**
     * @dev Execute a transaction from this wallet
     * @param _to Target address
     * @param _value Amount of ETH to send
     * @param _data Transaction data
     */
    function execute(address _to, uint256 _value, bytes calldata _data) external onlyOwner returns (bool success) {
        (success,) = _to.call{value: _value}(_data);
        emit TransactionExecuted(_to, _value, _data, success);
        return success;
    }
    
    /**
     * @dev Execute multiple transactions in batch
     * @param _to Array of target addresses
     * @param _values Array of ETH amounts
     * @param _data Array of transaction data
     */
    function batchExecute(
        address[] calldata _to,
        uint256[] calldata _values,
        bytes[] calldata _data
    ) external onlyOwner returns (bool[] memory successes) {
        require(_to.length == _values.length && _values.length == _data.length, "CreatorWallet: Array length mismatch");
        
        successes = new bool[](_to.length);
        for (uint256 i = 0; i < _to.length; i++) {
            (successes[i],) = _to[i].call{value: _values[i]}(_data[i]);
            emit TransactionExecuted(_to[i], _values[i], _data[i], successes[i]);
        }
        
        return successes;
    }
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {}
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {}
}

/**
 * @title CreatorWalletFactory
 * @dev Factory to deploy smart contract wallets for verified creators
 * Only creates wallets when explicitly requested by the user
 */
contract CreatorWalletFactory is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    
    // Wallet tracking
    mapping(address => address) public creatorToWallet; // creator => wallet address
    mapping(address => bool) public isCreatorWallet; // wallet => is creator wallet
    address[] public deployedWallets;
    
    // Access control
    mapping(address => bool) public authorizedCreators;
    address public verificationContract; // SocialTokenFactory contract
    
    // Events
    event WalletDeployed(address indexed creator, address indexed walletAddress);
    event CreatorAuthorized(address indexed creator);
    event CreatorDeauthorized(address indexed creator);
    event VerificationContractUpdated(address indexed oldContract, address indexed newContract);
    
    // Modifiers
    modifier onlyAuthorizedCreator() {
        require(
            authorizedCreators[msg.sender] || 
            (verificationContract != address(0) && _isVerifiedCreator(msg.sender)),
            "CreatorWalletFactory: Not authorized creator"
        );
        _;
    }
    
    constructor() {}
    
    /**
     * @dev Create a smart wallet for the caller (creator)
     * Only creates if explicitly called by verified creator
     */
    function createWallet() external onlyAuthorizedCreator nonReentrant returns (address) {
        require(creatorToWallet[msg.sender] == address(0), "CreatorWalletFactory: Wallet already exists");
        
        // Deploy new wallet with creator as owner
        CreatorWallet newWallet = new CreatorWallet(msg.sender);
        address walletAddress = address(newWallet);
        
        // Update mappings
        creatorToWallet[msg.sender] = walletAddress;
        isCreatorWallet[walletAddress] = true;
        deployedWallets.push(walletAddress);
        
        emit WalletDeployed(msg.sender, walletAddress);
        return walletAddress;
    }
    
    /**
     * @dev Create wallet for a specific creator (admin only)
     * @param _creator Creator address
     */
    function createWalletFor(address _creator) external onlyOwner returns (address) {
        require(_creator != address(0), "CreatorWalletFactory: Invalid creator");
        require(creatorToWallet[_creator] == address(0), "CreatorWalletFactory: Wallet already exists");
        require(
            authorizedCreators[_creator] || 
            (verificationContract != address(0) && _isVerifiedCreator(_creator)),
            "CreatorWalletFactory: Creator not authorized"
        );
        
        CreatorWallet newWallet = new CreatorWallet(_creator);
        address walletAddress = address(newWallet);
        
        creatorToWallet[_creator] = walletAddress;
        isCreatorWallet[walletAddress] = true;
        deployedWallets.push(walletAddress);
        
        emit WalletDeployed(_creator, walletAddress);
        return walletAddress;
    }
    
    /**
     * @dev Batch create wallets for multiple creators (admin only)
     * @param _creators Array of creator addresses
     */
    function batchCreateWallets(address[] memory _creators) external onlyOwner returns (address[] memory) {
        address[] memory wallets = new address[](_creators.length);
        
        for (uint256 i = 0; i < _creators.length; i++) {
            address creator = _creators[i];
            require(creator != address(0), "CreatorWalletFactory: Invalid creator");
            require(creatorToWallet[creator] == address(0), "CreatorWalletFactory: Wallet already exists");
            
            CreatorWallet newWallet = new CreatorWallet(creator);
            address walletAddress = address(newWallet);
            
            creatorToWallet[creator] = walletAddress;
            isCreatorWallet[walletAddress] = true;
            deployedWallets.push(walletAddress);
            
            wallets[i] = walletAddress;
            emit WalletDeployed(creator, walletAddress);
        }
        
        return wallets;
    }
    
    /**
     * @dev Get wallet address for a creator
     * @param _creator Creator address
     */
    function getCreatorWallet(address _creator) external view returns (address) {
        return creatorToWallet[_creator];
    }
    
    /**
     * @dev Check if an address is a creator wallet
     * @param _wallet Wallet address to check
     */
    function isWalletForCreator(address _wallet) external view returns (bool) {
        return isCreatorWallet[_wallet];
    }
    
    /**
     * @dev Get all deployed wallets
     */
    function getAllWallets() external view returns (address[] memory) {
        return deployedWallets;
    }
    
    /**
     * @dev Get total number of deployed wallets
     */
    function getWalletCount() external view returns (uint256) {
        return deployedWallets.length;
    }
    
    /**
     * @dev Get wallets for multiple creators
     * @param _creators Array of creator addresses
     */
    function getWalletsForCreators(address[] memory _creators) external view returns (address[] memory) {
        address[] memory wallets = new address[](_creators.length);
        for (uint256 i = 0; i < _creators.length; i++) {
            wallets[i] = creatorToWallet[_creators[i]];
        }
        return wallets;
    }
    
    /**
     * @dev Authorize a creator to create wallets
     * @param _creator Creator address
     */
    function authorizeCreator(address _creator) external onlyOwner {
        require(_creator != address(0), "CreatorWalletFactory: Invalid creator");
        authorizedCreators[_creator] = true;
        emit CreatorAuthorized(_creator);
    }
    
    /**
     * @dev Batch authorize creators
     * @param _creators Array of creator addresses
     */
    function batchAuthorizeCreators(address[] memory _creators) external onlyOwner {
        for (uint256 i = 0; i < _creators.length; i++) {
            require(_creators[i] != address(0), "CreatorWalletFactory: Invalid creator");
            authorizedCreators[_creators[i]] = true;
            emit CreatorAuthorized(_creators[i]);
        }
    }
    
    /**
     * @dev Deauthorize a creator
     * @param _creator Creator address
     */
    function deauthorizeCreator(address _creator) external onlyOwner {
        authorizedCreators[_creator] = false;
        emit CreatorDeauthorized(_creator);
    }
    
    /**
     * @dev Set verification contract address
     * @param _verificationContract Address of SocialTokenFactory or similar
     */
    function setVerificationContract(address _verificationContract) external onlyOwner {
        address oldContract = verificationContract;
        verificationContract = _verificationContract;
        emit VerificationContractUpdated(oldContract, _verificationContract);
    }
    
    /**
     * @dev Check if creator is verified through the verification contract
     * @param _creator Creator address
     */
    function _isVerifiedCreator(address _creator) internal view returns (bool) {
        if (verificationContract == address(0)) return false;
        
        // Call the verification contract to check if creator is verified
        try ISocialTokenFactory(verificationContract).getVerifiedCreatorStatus(_creator) returns (bool verified) {
            return verified;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Check if creator is authorized (either manually or through verification)
     * @param _creator Creator address
     */
    function isAuthorizedCreator(address _creator) external view returns (bool) {
        return authorizedCreators[_creator] || 
               (verificationContract != address(0) && _isVerifiedCreator(_creator));
    }
}

/**
 * @title ISocialTokenFactory
 * @dev Interface for the SocialTokenFactory contract
 */
interface ISocialTokenFactory {
    function getVerifiedCreatorStatus(address _creator) external view returns (bool);
}