// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./../Interface/ICollection.sol";
import "./../Interface/IMintingFactory.sol";
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
        uint8 mode
    );
    event OrderCancelled(address nftContract, uint256 tokenId, address buyer);
    event OrderUncancelled(address nftContract, uint256 tokenId, address buyer);
    event BuyerPremiumFeesSet(uint256 _feePercent);
    event MintingFactoryUpdate(address indexed _mintingFactory);
    event CharityWalletUpdate(address indexed _newCharity);

    uint256 public constant MAX_BASE_FACTOR = 1025; // 102.5%
    address public immutable WETH;

    // Address of minting factory
    address public mintingFactory;
    // Address of carbon membership
    address public carbonMembership;
    
    // Sets in 1000 decimal precision
    uint256 public buyerPremiumFees; // 2.5%
    // address of admin registry
    address public adminRegistry;
    // address of the charity wallet
    address public charity;

    // One who bids for an nft, can cancel it anytime before auction ends
    // cancelledOrders[userAddress][nftContract][nft_id] => returns bool
    // returns true if order is cancelled
    mapping(address => mapping(address => mapping(uint256 => bool)))
        public cancelledOrders;

    /**
     * @dev only addresses in admin registry can call this
     */
    modifier onlyAdmin() {
        require(
            IAdminRegistry(adminRegistry).isAdmin(msg.sender),
            "AdminRegistry: Restricted to admin."
        );
        _;
    }

    //@dev WETH is an ERC20 token on polygon
    // Sets the value for minting factory, eth, carbonMembership and root for the AdminRole
    /**
     * @notice Constructs the ExchangeCore
     *
     * @param _mintingFactory Address of MintingFactory contract
     * @param _weth Address of the wrapped ETH token
     * @param _carbonMembership Address of carbon membership contract
     */
    constructor(
        address _mintingFactory,
        address _weth,
        address _carbonMembership,
        address _adminRegistry,
        address _charity
    ) {
        mintingFactory = _mintingFactory;
        WETH = _weth;
        carbonMembership = _carbonMembership;
        buyerPremiumFees = 25;
        adminRegistry = _adminRegistry;
        require(
            _charity != address(0),
            "ExchangeCore: Zero address of charity"
        );
        charity = _charity;
    }

    /**
     * @dev
     * Executes the order, can be called by the admin only.
     * Checks and validates the order details before execution.
     * Calculates carbon and creator royalties, and then calling _executeOrder function
     * @param _nftContract - address of the nft contract which is on sale
     * @param _tokenId - token id of the token on sale
     * @param _buyer - address of the user who wishes to buy the NFT
     * @param _seller - address of the user who wishes to sell the NFT
     * @param _amount - the total price (in WETH) of the NFT
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
        uint8 _mode,
        bool _isCarbonMember
    ) external onlyAdmin whenNotPaused nonReentrant {
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
            ICollection(_nftContract).factory() == mintingFactory,
            "ExchangeCore: ERC721 Factory doesn't match with Exchange Factory"
        );
        require(_mode <= 3, "ExchangeCore: Invalid mode specified");
        _validateSeller(_nftContract, _tokenId, _seller);
        _validateBuyer(_buyer, _amount);

        uint256 carbonRoyaltyFee;
        uint256 creatorRoyalties;
        uint256 charityFees;

        if (_mode == 0) {
            // 75/25 split (TBC)
            carbonRoyaltyFee = _amount.mul(250).div(MAX_BASE_FACTOR);
            creatorRoyalties = _amount.mul(750).div(MAX_BASE_FACTOR);
        } else if (_mode == 1) {
            // 10/10/80 split (Charity)
            carbonRoyaltyFee = _amount.mul(800).div(MAX_BASE_FACTOR);
            creatorRoyalties = _amount.mul(100).div(MAX_BASE_FACTOR);
            charityFees = _amount.mul(100).div(MAX_BASE_FACTOR);
        } else if (_mode == 2) {
            // 50/50 split
            carbonRoyaltyFee = _amount.mul(500).div(MAX_BASE_FACTOR);
            creatorRoyalties = _amount.mul(500).div(MAX_BASE_FACTOR);
        } else {
            // 70/30 split (i.e. WeirdCore)
            carbonRoyaltyFee = _amount.mul(300).div(MAX_BASE_FACTOR);
            creatorRoyalties = _amount.mul(700).div(MAX_BASE_FACTOR);
        }

        uint256 totalCarbonFee;
        if (_isCarbonMember) {
            totalCarbonFee = carbonRoyaltyFee;
        } else {
            uint256 carbonTradeFee = _amount.mul(buyerPremiumFees).div(
                MAX_BASE_FACTOR
            );
            totalCarbonFee = carbonTradeFee + carbonRoyaltyFee;
        }

        _executeOrder(
            totalCarbonFee,
            creatorRoyalties,
            charityFees,
            _nftContract,
            _tokenId,
            _buyer,
            _seller,
            _mode
        );
    }

    /**
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
    ) external onlyAdmin whenNotPaused {
        require(
            !cancelledOrders[_buyer][_nftContract][_tokenId],
            "ExchangeCore: Order already cancelled"
        );

        cancelledOrders[_buyer][_nftContract][_tokenId] = true;
        emit OrderCancelled(_nftContract, _tokenId, _buyer);
    }

    /**
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
    ) external onlyAdmin whenNotPaused {
        require(
            cancelledOrders[_buyer][_nftContract][_tokenId],
            "ExchangeCore: Order was never cancelled"
        );
        cancelledOrders[_buyer][_nftContract][_tokenId] = false;
        emit OrderUncancelled(_nftContract, _tokenId, _buyer);
    }

    // @notice updates address of the minting factory
    // @param address of minting factory
    function updateFactory(address _factory) external onlyAdmin {
        mintingFactory = _factory;
        emit MintingFactoryUpdate(_factory);
    }

    // @notice updates Buyer's premium fees factor
    // @param buyers fee
    function setBuyerPremiumFees(uint256 _buyersFee)
        external
        onlyAdmin
    {
        buyerPremiumFees = _buyersFee;
        emit BuyerPremiumFeesSet(_buyersFee);
    }

    /**
     * @notice Sets the address of charity wallet
     * @param _newCharity address of the charity
     */
    function updateCharity(address _newCharity) external onlyAdmin {
        require(
            _newCharity != address(0),
            "ExchangeCore: Zero address of charity"
        );
        charity = _newCharity;

        emit CharityWalletUpdate(_newCharity);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    /**
     * @notice Used to get all the admins and access
     * @return memberCount number of admins and list of admin addresses
     */
    function getRoleMembers()
        external
        view
        returns (uint256, address[] memory)
    {
        return IAdminRegistry(adminRegistry).getRoleMembers();
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
        address tokenOwner = ICollection(_nftContract).ownerOf(_tokenId);
        require(
            _seller == tokenOwner,
            "ExchangeCore: Seller does not owns the token"
        );

        // check token approval
        address tokenApprovedAddress = ICollection(_nftContract)
            .getApproved(_tokenId);

        require(
            tokenApprovedAddress == address(this) ||
                ICollection(_nftContract).isApprovedForAll(
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
            IERC20(WETH).allowance(_buyer, address(this)) > _amount,
            "ExchangeCore: Allowance is less than the NFT's price."
        );
        require(
            IERC20(WETH).balanceOf(_buyer) > _amount,
            "ExchangeCore: Buyer doesn't have sufficient funds"
        );
        return true;
    }

    /**
     * @dev - Executes the order
     * transfers the NFT from the seller to the buyer
     * transfer WETH tokens (fees and royalties) to carbon
     * transfers WETH tokens (creator royalties) to the creator
     * update ownership of the NFT on chain in the minting factory contract
     * Emits the OrderExecuted event
     */
    function _executeOrder(
        uint256 _totalCarbonFee,
        uint256 _creatorRoyalties,
        uint256 _charityFees,
        address _nftContract,
        uint256 _tokenId,
        address _buyer,
        address _seller,
        uint8 _mode
    ) internal {
        address carbonFeeVault = IAdminRegistry(adminRegistry).getCarbonVault();
        IERC20(WETH).transferFrom(_buyer, carbonFeeVault, _totalCarbonFee);

        // transferring the amount to the seller
        if(_seller == mintingFactory){
            // check if the sale is primary market
            IERC20(WETH).transferFrom(_buyer, carbonFeeVault, _creatorRoyalties);
        } else {
            IERC20(WETH).transferFrom(_buyer, _seller, _creatorRoyalties);
        }

        if (_charityFees != 0) {
            IERC20(WETH).transferFrom(_buyer, charity, _charityFees);
        }

        // transferring the NFT to the buyer
        ICollection(_nftContract).transferFrom(
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

    /**
     * @dev adds the given address for the admin role
     * @param _account address of the user
     */
    function addAdmin(address _account) external {
        IAdminRegistry(adminRegistry).addAdmin(_account);
    }

    /**
     * @dev Removes the given address from the admin role
     * @param _account address of the user
     */
    function removeAdmin(address _account) external {
        IAdminRegistry(adminRegistry).removeAdmin(_account);
    }

    /**
     * @dev leaves the admin role
     */
    function leaveRole() external {
        IAdminRegistry(adminRegistry).leaveRole();
    }
}
