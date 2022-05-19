// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./../Interface/IERC721NFTContract.sol";
import "./../Interface/IMintingFactory.sol";
// import "./../AdminRole.sol";
import "./../Interface/ICarbonMembership.sol";

import "./../Interface/IAdminRegistry.sol";

contract ExchangeCore is Pausable, ReentrancyGuard {
    using SafeMath for uint256;

    event OrderExecuted(
        address indexed nftContract,
        uint256 tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 totalCarbonRoyalties,
        uint256 creatorRoyalties,
        uint256 mode
    );
    event OrderCancelled(address nftContract, uint256 tokenId, address buyer);
    event OrderUncancelled(address nftContract, uint256 tokenId, address buyer);
    event CarbonFeeVaultSet(address carbonFeeVault);
    event BuyerPremiumFeesSet(uint256 _feePercent);
    event MintingFactoryUpdate(address indexed _mintingFactory);

    uint256 public constant MAX_BASE_FACTOR = 1025; // 102.5%
    address public immutable ETH;

    // Address of minting factory
    address public mintingFactory;
    // Address of carbon membership
    address public carbonMembership;
    // Address of carbon fee vault
    address public carbonFeeVault;
    // Sets in 1000 decimal precision
    uint256 public buyerPremiumFees; // 2.5%

    address public adminRegistry;

    // One who bids for an nft, can cancel it anytime before auction ends
    // cancelledOrders[userAddress][nftContract][nft_id] => returns bool
    // returns true if order is cancelled
    mapping(address => mapping(address => mapping(uint256 => bool)))
        public cancelledOrders;

    //@dev ETH is an ERC20 token on polygon
    // Sets the value for minting factory, eth, carbonMembership and root for the AdminRole
    /**
     * @notice Constructs the ExchangeCore
     *
     * @param _mintingFactory Address of MintingFactory contract
     * @param _eth Address of the wrapped ETH token
     * @param _carbonMembership Address of carbon membership contract
     */
    constructor(
        address _mintingFactory,
        address _eth,
        address _carbonMembership,
        address _adminRegistry
    ) {
        mintingFactory = _mintingFactory;
        ETH = _eth;
        carbonMembership = _carbonMembership;
        buyerPremiumFees = 25;
        adminRegistry = _adminRegistry;
    }


    modifier onlyAdminRegistry() {
        require(IAdminRegistry(adminRegistry).isAdmin(msg.sender), "AdminRegistry: Restricted to admin.");
        _;
    }

    /*
     * @dev
     * Executes the order, can be called by the admin only.
     * Checks and validates the order details before execution.
     * Calculates carbon and creator royalties, and then calling _executeOrder function
     * @param _nftContract - address of the nft contract which is on sale
     * @param _tokenId - token id of the token on sale
     * @param _buyer - address of the user who wishes to buy the NFT
     * @param _seller - address of the user who wishes to sell the NFT
     * @param _amount - the total price (in ETH) of the NFT
     * @param _auctionEndTime - time when the auction will end
     * @param _mode - Mode represents how the royalties for the NFT will be distributed between  the creator and carbon
     */
    function executeOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer,
        address _seller,
        uint256 _amount,
        uint256 _auctionEndTime,
        uint256 _mode
    ) external onlyAdminRegistry whenNotPaused nonReentrant {
        // Validating all the requirements
        require(
            _auctionEndTime > block.timestamp,
            "ExchangeCore: Auction has ended"
        );
        require(
            !cancelledOrders[_buyer][_nftContract][_tokenId],
            "ExchangeCore: Order is cancelled"
        );
        require(
            IERC721NFTContract(_nftContract).factory() == mintingFactory,
            "ExchangeCore: ERC721 Factory doesn't match with Exchange Factory"
        );
        require(_mode <= 2, "Invalid mode specified");
        bool validSeller = _validateSeller(_nftContract, _tokenId, _seller);
        bool validBuyer = _validateBuyer(_buyer, _amount);

        if (validSeller && validBuyer) {
            uint256 carbonRoyaltyFee;
            uint256 creatorRoyalties;

            if (_mode == 0) {
                // 90-10
                carbonRoyaltyFee = _amount.mul(100).div(MAX_BASE_FACTOR);
                creatorRoyalties = _amount.mul(900).div(MAX_BASE_FACTOR);
            } else if (_mode == 1) {
                // 60-40
                carbonRoyaltyFee = _amount.mul(400).div(MAX_BASE_FACTOR);
                creatorRoyalties = _amount.mul(600).div(MAX_BASE_FACTOR);
            } else {
                // 50-50
                carbonRoyaltyFee = _amount.mul(500).div(MAX_BASE_FACTOR);
                creatorRoyalties = _amount.mul(500).div(MAX_BASE_FACTOR);
            }
            // transfer Royalties to the exchange

            uint256 carbonTradeFee = _amount.mul(buyerPremiumFees).div(
                MAX_BASE_FACTOR
            );

            uint256 totalCarbonFee;
            if (ICarbonMembership(carbonMembership).balanceOf(_buyer) >= 1) {
                totalCarbonFee = carbonRoyaltyFee;
            } else {
                totalCarbonFee = carbonTradeFee + carbonRoyaltyFee;
            }

            _executeOrder(
                totalCarbonFee,
                creatorRoyalties,
                _nftContract,
                _tokenId,
                _buyer,
                _seller,
                _mode
            );
        }
    }

    /*
     * @notice - Cancels the order for the buyer when he places bid for any NFT on sale
     * @param _nftContract - address of the nft contract
     * @param _tokenId - token id of the nft that was on sale
     * @param _buyer - address of the user whose order is to be cancelled
     * Emits an event, OrderCancelled
     */
    function cancelOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer
    ) external onlyAdminRegistry whenNotPaused {
        require(
            !cancelledOrders[_buyer][_nftContract][_tokenId],
            "ExchangeCore: Order already cancelled"
        );

        cancelledOrders[_buyer][_nftContract][_tokenId] = true;
        emit OrderCancelled(_nftContract, _tokenId, _buyer);
    }

    /*
     * @notice - Uncancels the order for the buyer who had earlier cancelled his order
     * @param _nftContract - address of the nft contract
     * @param _tokenId - token id of the nft that was on sale
     * @param _buyer - address of the user whose order is to be uncancelled
     * Emits an event, OrderUncancelled
     */
    function uncancelOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer
    ) external onlyAdminRegistry whenNotPaused {
        require(
            cancelledOrders[_buyer][_nftContract][_tokenId],
            "ExchangeCore: Order was never cancelled"
        );
        cancelledOrders[_buyer][_nftContract][_tokenId] = false;
        emit OrderUncancelled(_nftContract, _tokenId, _buyer);
    }

    // @notice updates address of the minting factory
    function updateFactory(address _factory) external onlyAdminRegistry {
        mintingFactory = _factory;
        emit MintingFactoryUpdate(_factory);
    }

    // @notice updates address of the carbon fee vault
    function setCarbonFeeVaultAddress(address _carbonFeeVault)
        external
        onlyAdminRegistry
    {
        require(
            _carbonFeeVault != address(0),
            "ExchangeCore: Vault address cannot be zero"
        );
        carbonFeeVault = _carbonFeeVault;
        emit CarbonFeeVaultSet(_carbonFeeVault);
    }

    // @notice updates Buyer's premium fees factor
    function setBuyerPremiumFees(uint256 _buyersFee) external onlyAdminRegistry {
        buyerPremiumFees = _buyersFee;
        emit BuyerPremiumFeesSet(_buyersFee);
    }

    function pause() external onlyAdminRegistry {
        _pause();
    }

    function unpause() external onlyAdminRegistry {
        _unpause();
    }

    /**
     * @notice Used to get all the admins and access
     */
    function getRoleMembers()
        external
        view
        returns (uint256, address[] memory)
    {
        bytes32 DEFAULT_ADMIN_ROLE = keccak256("DEFAULT_ADMIN_ROLE");

        uint256 roleMemberCount = IAdminRegistry(adminRegistry).getRoleMemberCount(DEFAULT_ADMIN_ROLE);
        address[] memory roleMembers = new address[](roleMemberCount);

        for (uint256 index = 0; index < roleMemberCount; index++) {
            roleMembers[index] = IAdminRegistry(adminRegistry).getRoleMember(DEFAULT_ADMIN_ROLE, index);
        }

        return (roleMemberCount, roleMembers);
    }

    /**
     * @dev Validates the seller of the NFT by checking if the user address owns the token and had approved the exchange to transfer it on its behalf
     *
     * @param _nftContract address of the NFT contract user intends to sell
     * @param _tokenId token id of the NFT on sale
     * @param _seller address of the user who wishes to sell his NFTs
     */
    function _validateSeller(
        address _nftContract,
        uint256 _tokenId,
        address _seller
    ) internal view returns (bool) {
        // check if he owns the token
        address tokenOwner = IERC721NFTContract(_nftContract).ownerOf(_tokenId);
        require(
            _seller == tokenOwner,
            "ExchangeCore: Seller does not owns the token"
        );

        // check token approval
        address tokenApprovedAddress = IERC721NFTContract(_nftContract)
            .getApproved(_tokenId);

        require(
            tokenApprovedAddress == address(this) ||
                IERC721NFTContract(_nftContract).isApprovedForAll(
                    _seller,
                    address(this)
                ),
            "ExchangeCore: Contract is not approved for this NFT"
        );

        return true;
    }

    // @dev
    // Validates the buyer if he has enough tokens in his wallet to buy the NFT and also if he has approved the tokens for transfer to the exchange
    // @param _buyer - address of the user who places bids to buy the NFT
    // @param _amount - amount of tokens the NFT costs
    function _validateBuyer(address _buyer, uint256 _amount)
        internal
        view
        returns (bool)
    {
        require(
            IERC20(ETH).allowance(_buyer, address(this)) > _amount,
            "ExchangeCore: Allowance is less than the NFT's price."
        );
        require(
            IERC20(ETH).balanceOf(_buyer) > _amount,
            "ExchangeCore: Buyer doesn't have sufficient funds"
        );
        return true;
    }

    /*
     * @dev - Executes the order
     * transfers the NFT from the seller to the buyer
     * transfer ETH tokens (fees and royalties) to carbon
     * transfers ETH tokens (creator royalties) to the creator
     * update ownership of the NFT on chain in the minting factory contract
     * Emits the OrderExecuted event
     */
    function _executeOrder(
        uint256 _totalCarbonFee,
        uint256 _creatorRoyalties,
        address _nftContract,
        uint256 _tokenId,
        address _buyer,
        address _seller,
        uint256 _mode
    ) internal {
        IERC20(ETH).transferFrom(_buyer, carbonFeeVault, _totalCarbonFee);

        // transferring the amount to the seller
        IERC20(ETH).transferFrom(_buyer, _seller, _creatorRoyalties);

        // transferring the NFT to the buyer
        IERC721NFTContract(_nftContract).transferFrom(
            _seller,
            _buyer,
            _tokenId
        );
        // updating the NFT ownership in our Minting Factory
        IMintingFactory(mintingFactory).updateOwner(
            _nftContract,
            _tokenId,
            _buyer
        );

        emit OrderExecuted(
            _nftContract,
            _tokenId,
            _seller,
            _buyer,
            _totalCarbonFee,
            _creatorRoyalties,
            _mode
        );
    }

    function addAdminToRegistry(address _account) external {
        IAdminRegistry(adminRegistry).addAdmin(_account);
    }

    function removeAdminFromRegistry(address _account) external {
        IAdminRegistry(adminRegistry).removeAdmin(_account);
    }

    function leaveFromAdminRegistry() external {
        IAdminRegistry(adminRegistry).leaveRole();
    }
}
