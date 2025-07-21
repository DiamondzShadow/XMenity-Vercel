// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title CreatorIdentityNFT
 * @dev Soulbound NFT for verified creator identities
 * Non-transferable tokens that represent verified social media creators
 */
contract CreatorIdentityNFT is ERC721, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIdCounter;
    
    // Creator data stored in NFT
    struct CreatorProfile {
        string handle;
        string platform;
        uint256 initialFollowers;
        uint256 verificationTimestamp;
        string profileImageUrl;
        uint256 engagementScore;
        bool isActive;
    }
    
    mapping(uint256 => CreatorProfile) public creatorProfiles;
    mapping(address => uint256) public creatorToTokenId;
    mapping(address => bool) public hasMinted;
    
    // Authorization
    address public verificationContract;
    mapping(address => bool) public authorizedMinters;
    
    // Metadata
    string private _baseTokenURI;
    string private _contractMetadataURI;
    
    // Events
    event CreatorBadgeMinted(
        address indexed creator,
        uint256 indexed tokenId,
        string handle,
        string platform,
        uint256 followers
    );
    event ProfileUpdated(uint256 indexed tokenId, string field, string newValue);
    event MinterAuthorized(address indexed minter);
    event MinterDeauthorized(address indexed minter);
    
    // Modifiers
    modifier onlyAuthorizedMinter() {
        require(
            authorizedMinters[msg.sender] || 
            msg.sender == verificationContract ||
            msg.sender == owner(),
            "CreatorIdentityNFT: Not authorized minter"
        );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        address _verificationContract
    ) ERC721(_name, _symbol) {
        _baseTokenURI = _baseURI;
        verificationContract = _verificationContract;
        
        // Start token IDs at 1
        _tokenIdCounter.increment();
    }

    /**
     * @dev Mint identity NFT for a verified creator
     * @param _creator Creator's wallet address
     * @param _handle Social media handle
     * @param _platform Platform name (e.g., "twitter")
     * @param _initialFollowers Initial follower count
     * @param _profileImageUrl URL to creator's profile image
     * @param _engagementScore Engagement score from InsightIQ
     */
    function mintCreatorBadge(
        address _creator,
        string memory _handle,
        string memory _platform,
        uint256 _initialFollowers,
        string memory _profileImageUrl,
        uint256 _engagementScore
    ) external onlyAuthorizedMinter nonReentrant returns (uint256) {
        require(_creator != address(0), "CreatorIdentityNFT: Invalid creator address");
        require(!hasMinted[_creator], "CreatorIdentityNFT: Creator already has badge");
        require(bytes(_handle).length > 0, "CreatorIdentityNFT: Invalid handle");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Store creator profile data
        creatorProfiles[tokenId] = CreatorProfile({
            handle: _handle,
            platform: _platform,
            initialFollowers: _initialFollowers,
            verificationTimestamp: block.timestamp,
            profileImageUrl: _profileImageUrl,
            engagementScore: _engagementScore,
            isActive: true
        });
        
        // Update mappings
        creatorToTokenId[_creator] = tokenId;
        hasMinted[_creator] = true;
        
        // Mint the NFT
        _safeMint(_creator, tokenId);
        
        emit CreatorBadgeMinted(_creator, tokenId, _handle, _platform, _initialFollowers);
        return tokenId;
    }

    /**
     * @dev Batch mint badges for multiple creators
     * @param _creators Array of creator addresses
     * @param _handles Array of social handles
     * @param _platforms Array of platform names
     * @param _followersArray Array of initial follower counts
     * @param _profileImages Array of profile image URLs
     * @param _engagementScores Array of engagement scores
     */
    function batchMintBadges(
        address[] memory _creators,
        string[] memory _handles,
        string[] memory _platforms,
        uint256[] memory _followersArray,
        string[] memory _profileImages,
        uint256[] memory _engagementScores
    ) external onlyOwner returns (uint256[] memory) {
        require(_creators.length == _handles.length, "CreatorIdentityNFT: Array length mismatch");
        require(_creators.length == _platforms.length, "CreatorIdentityNFT: Array length mismatch");
        require(_creators.length == _followersArray.length, "CreatorIdentityNFT: Array length mismatch");
        require(_creators.length == _profileImages.length, "CreatorIdentityNFT: Array length mismatch");
        require(_creators.length == _engagementScores.length, "CreatorIdentityNFT: Array length mismatch");
        
        uint256[] memory tokenIds = new uint256[](_creators.length);
        
        for (uint256 i = 0; i < _creators.length; i++) {
            if (!hasMinted[_creators[i]] && _creators[i] != address(0)) {
                uint256 tokenId = _tokenIdCounter.current();
                _tokenIdCounter.increment();
                
                creatorProfiles[tokenId] = CreatorProfile({
                    handle: _handles[i],
                    platform: _platforms[i],
                    initialFollowers: _followersArray[i],
                    verificationTimestamp: block.timestamp,
                    profileImageUrl: _profileImages[i],
                    engagementScore: _engagementScores[i],
                    isActive: true
                });
                
                creatorToTokenId[_creators[i]] = tokenId;
                hasMinted[_creators[i]] = true;
                
                _safeMint(_creators[i], tokenId);
                tokenIds[i] = tokenId;
                
                emit CreatorBadgeMinted(_creators[i], tokenId, _handles[i], _platforms[i], _followersArray[i]);
            }
        }
        
        return tokenIds;
    }

    /**
     * @dev Update creator profile data (for metrics updates)
     * @param _tokenId Token ID to update
     * @param _profileImageUrl New profile image URL
     * @param _engagementScore New engagement score
     */
    function updateCreatorProfile(
        uint256 _tokenId,
        string memory _profileImageUrl,
        uint256 _engagementScore
    ) external onlyAuthorizedMinter {
        require(_exists(_tokenId), "CreatorIdentityNFT: Token does not exist");
        
        CreatorProfile storage profile = creatorProfiles[_tokenId];
        
        if (bytes(_profileImageUrl).length > 0) {
            profile.profileImageUrl = _profileImageUrl;
            emit ProfileUpdated(_tokenId, "profileImageUrl", _profileImageUrl);
        }
        
        if (_engagementScore > 0) {
            profile.engagementScore = _engagementScore;
            emit ProfileUpdated(_tokenId, "engagementScore", _engagementScore.toString());
        }
    }

    /**
     * @dev Deactivate a creator badge (emergency use)
     * @param _tokenId Token ID to deactivate
     */
    function deactivateBadge(uint256 _tokenId) external onlyOwner {
        require(_exists(_tokenId), "CreatorIdentityNFT: Token does not exist");
        creatorProfiles[_tokenId].isActive = false;
        emit ProfileUpdated(_tokenId, "isActive", "false");
    }

    /**
     * @dev Reactivate a creator badge
     * @param _tokenId Token ID to reactivate
     */
    function reactivateBadge(uint256 _tokenId) external onlyOwner {
        require(_exists(_tokenId), "CreatorIdentityNFT: Token does not exist");
        creatorProfiles[_tokenId].isActive = true;
        emit ProfileUpdated(_tokenId, "isActive", "true");
    }

    /**
     * @dev Get creator profile by token ID
     * @param _tokenId Token ID
     */
    function getCreatorProfile(uint256 _tokenId) external view returns (CreatorProfile memory) {
        require(_exists(_tokenId), "CreatorIdentityNFT: Token does not exist");
        return creatorProfiles[_tokenId];
    }

    /**
     * @dev Get token ID for a creator
     * @param _creator Creator address
     */
    function getCreatorTokenId(address _creator) external view returns (uint256) {
        require(hasMinted[_creator], "CreatorIdentityNFT: Creator has no badge");
        return creatorToTokenId[_creator];
    }

    /**
     * @dev Check if creator has a badge
     * @param _creator Creator address
     */
    function hasCreatorBadge(address _creator) external view returns (bool) {
        return hasMinted[_creator];
    }

    /**
     * @dev Generate on-chain SVG metadata for the NFT
     * @param _tokenId Token ID
     */
    function generateSVG(uint256 _tokenId) public view returns (string memory) {
        require(_exists(_tokenId), "CreatorIdentityNFT: Token does not exist");
        
        CreatorProfile memory profile = creatorProfiles[_tokenId];
        
        return string(abi.encodePacked(
            '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
            '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />',
            '</linearGradient>',
            '</defs>',
            '<rect width="400" height="400" fill="url(#bg)"/>',
            '<circle cx="200" cy="150" r="60" fill="white" opacity="0.2"/>',
            '<text x="200" y="250" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="white">',
            profile.handle,
            '</text>',
            '<text x="200" y="280" font-family="Arial" font-size="16" text-anchor="middle" fill="white" opacity="0.8">',
            'Verified Creator',
            '</text>',
            '<text x="200" y="310" font-family="Arial" font-size="14" text-anchor="middle" fill="white" opacity="0.6">',
            profile.platform,
            '</text>',
            '<text x="200" y="340" font-family="Arial" font-size="12" text-anchor="middle" fill="white" opacity="0.6">',
            profile.initialFollowers.toString(), ' followers',
            '</text>',
            '</svg>'
        ));
    }

    /**
     * @dev Generate JSON metadata for the NFT
     * @param _tokenId Token ID
     */
    function generateMetadata(uint256 _tokenId) public view returns (string memory) {
        require(_exists(_tokenId), "CreatorIdentityNFT: Token does not exist");
        
        CreatorProfile memory profile = creatorProfiles[_tokenId];
        
        return string(abi.encodePacked(
            '{"name":"Creator Badge #', _tokenId.toString(), '",',
            '"description":"Verified social media creator identity badge",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(generateSVG(_tokenId))), '",',
            '"attributes":[',
            '{"trait_type":"Handle","value":"', profile.handle, '"},',
            '{"trait_type":"Platform","value":"', profile.platform, '"},',
            '{"trait_type":"Initial Followers","value":', profile.initialFollowers.toString(), '},',
            '{"trait_type":"Engagement Score","value":', profile.engagementScore.toString(), '},',
            '{"trait_type":"Verification Date","value":', profile.verificationTimestamp.toString(), '},',
            '{"trait_type":"Active","value":', profile.isActive ? 'true' : 'false', '}',
            ']}'
        ));
    }

    /**
     * @dev Get token URI with on-chain metadata
     * @param _tokenId Token ID
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "CreatorIdentityNFT: Token does not exist");
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(generateMetadata(_tokenId)))
        ));
    }

    /**
     * @dev Authorize a minter
     * @param _minter Minter address
     */
    function authorizeMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "CreatorIdentityNFT: Invalid minter");
        authorizedMinters[_minter] = true;
        emit MinterAuthorized(_minter);
    }

    /**
     * @dev Deauthorize a minter
     * @param _minter Minter address
     */
    function deauthorizeMinter(address _minter) external onlyOwner {
        authorizedMinters[_minter] = false;
        emit MinterDeauthorized(_minter);
    }

    /**
     * @dev Set verification contract
     * @param _verificationContract New verification contract address
     */
    function setVerificationContract(address _verificationContract) external onlyOwner {
        verificationContract = _verificationContract;
    }

    /**
     * @dev Set base URI for metadata
     * @param _baseURI New base URI
     */
    function setBaseURI(string memory _baseURI) external onlyOwner {
        _baseTokenURI = _baseURI;
    }

    /**
     * @dev Get total supply of minted badges
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }

    /**
     * @dev Override transfer functions to make tokens soulbound (non-transferable)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        require(
            from == address(0) || to == address(0),
            "CreatorIdentityNFT: Soulbound tokens cannot be transferred"
        );
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Override approve functions to prevent approvals
     */
    function approve(address, uint256) public pure override {
        revert("CreatorIdentityNFT: Soulbound tokens cannot be approved");
    }

    /**
     * @dev Override setApprovalForAll to prevent approvals
     */
    function setApprovalForAll(address, bool) public pure override {
        revert("CreatorIdentityNFT: Soulbound tokens cannot be approved");
    }

    /**
     * @dev Override getApproved to always return zero address
     */
    function getApproved(uint256) public pure override returns (address) {
        return address(0);
    }

    /**
     * @dev Override isApprovedForAll to always return false
     */
    function isApprovedForAll(address, address) public pure override returns (bool) {
        return false;
    }
}