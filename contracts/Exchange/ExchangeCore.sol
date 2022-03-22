// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// make it ownable, pausable
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// import required interfaces
import "./../Interface/IERC20.sol";
import "./../Interface/IERC721.sol";
import "./../Interface/IMintingFactory.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ExchangeCore is Ownable, Pausable, ReentrancyGuard, AccessControl {
    using SafeMath for uint256;

    address public mintingFactory;
    address public ETH;

    uint256 public PRIMARY_MARKET_CARBON_ROYALTIES = 250; // 25%
    uint256 public PRIMARY_MARKET_CREATOR_ROYALTIES = 750; // 75%
    uint256 public BUYERS_PREMIUM_FEES = 25; // 2.5%
    uint256 public constant BaseFactorMax = 1025; // 102.5%

    bytes32 public constant DEFAULT_ADMIN = keccak256("DEFAULT_ADMIN");

    //@dev ETH is an ERC20 token on polygon
    constructor(address _mintingFactory, address _eth) {
        mintingFactory = _mintingFactory;
        ETH = _eth;

        _setupRole(DEFAULT_ADMIN, msg.sender);
    }

    // One who bids for an nft, can cancel it anytime before auction ends
    // cancelledOrders[userAddress][nftContract][nft_id] => returns bool
    // returns true if order is cancelled
    mapping(address => mapping(address => mapping(uint256 => bool)))
        public cancelledOrders;

    event OrderExecuted(
        address nftContract,
        uint256 tokenId,
        address oldOwner,
        address newOwner
    );

    event OrderCancelled(address nftContract, uint256 tokenId, address buyer);
    event OrderUncancelled(address nftContract, uint256 tokenId, address buyer);

    modifier onlyMember() {
        require(isMember(msg.sender), "Restricted to members.");
        _;
    }

    function isMember(address account) public view virtual returns (bool) {
        return hasRole(DEFAULT_ADMIN, account);
    }

    function addMember(address account) public virtual onlyMember {
        grantRole(DEFAULT_ADMIN, account);
    }

    /// @dev Remove oneself as a member of the community.
    function leaveRole() public virtual {
        renounceRole(DEFAULT_ADMIN, msg.sender);
    }

    function removeMember(address account) public virtual onlyMember {
        revokeRole(DEFAULT_ADMIN, account);
    }

    function validateSeller(
        address _nftContract,
        uint256 _tokenId,
        address _seller
    ) internal view returns (bool) {
        // check if he owns the token
        address tokenOwner = IERC721(_nftContract).ownerOf(_tokenId);
        require(_seller == tokenOwner, "Seller does not owns the token");

        // check token approval
        address tokenApprovedAddress = IERC721(_nftContract).getApproved(
            _tokenId
        );

        require(
            tokenApprovedAddress == address(this) ||
                IERC721(_nftContract).isApprovedForAll(_seller, address(this)),
            "Contract is not approved for this NFT"
        );

        return true;
    }

    function validateBuyer(address _buyer, uint256 _amount)
        internal
        view
        returns (bool)
    {
        require(
            IERC20(ETH).allowance(_buyer, address(this)) > _amount,
            "Allowance is less than the NFT's price."
        );
        require(
            IERC20(ETH).balanceOf(_buyer) > _amount,
            "Buyer doesn't have sufficient funds"
        );
        return true;
    }

    function validateAuctionTime(uint256 _auctionEndTime)
        internal
        view
        returns (bool)
    {
        require(_auctionEndTime > block.timestamp, "Auction has ended");
        return true;
    }

    function isCancelled(
        address _nftContract,
        uint256 _tokenId,
        address _buyer
    ) internal view returns (bool) {
        require(
            !cancelledOrders[_buyer][_nftContract][_tokenId],
            "Order is cancelled"
        );

        return true;
    }

    function executeOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer,
        address _seller,
        uint256 _amount,
        uint256 _auctionEndTime
    ) public onlyOwner onlyMember whenNotPaused nonReentrant {
        // Validating all the requirements
        bool validTime = validateAuctionTime(_auctionEndTime);
        bool validSeller = validateSeller(_nftContract, _tokenId, _seller);
        bool validBuyer = validateBuyer(_buyer, _amount);
        bool isCancel = isCancelled(_nftContract, _tokenId, _buyer);

        if (validTime && validSeller && validBuyer && !isCancel) {
            // transfer Royalties to the exchange
            uint256 carbonRoyaltyFee = _amount
                .mul(PRIMARY_MARKET_CARBON_ROYALTIES)
                .div(BaseFactorMax);
            uint256 carbonTradeFee = _amount.mul(BUYERS_PREMIUM_FEES).div(
                BaseFactorMax
            );
            uint256 creatorRoyalties = _amount
                .mul(PRIMARY_MARKET_CREATOR_ROYALTIES)
                .div(BaseFactorMax);

            uint256 totalFee = carbonRoyaltyFee + carbonTradeFee;

            IERC20(ETH).transferFrom(_buyer, address(this), totalFee);

            // transferring the amount to the seller
            IERC20(ETH).transferFrom(_buyer, _seller, creatorRoyalties);

            // transferring the NFT to the buyer
            IERC721(_nftContract).transferFrom(_seller, _buyer, _tokenId);
            // updating the NFT ownership in our Minting Factory
            IMintingFactory(mintingFactory).updateOwner(
                _nftContract,
                _tokenId,
                _buyer
            );

            emit OrderExecuted(_nftContract, _tokenId, _seller, _buyer);
        }
    }

    function cancelOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer
    ) public onlyOwner onlyMember whenNotPaused {
        require(
            !cancelledOrders[_buyer][_nftContract][_tokenId],
            "Order already cancelled"
        );

        cancelledOrders[_buyer][_nftContract][_tokenId] = true;
        emit OrderCancelled(_nftContract, _tokenId, _buyer);
    }

    function uncancelOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer
    ) public onlyOwner onlyMember whenNotPaused {
        require(
            cancelledOrders[_buyer][_nftContract][_tokenId],
            "Order was never cancelled"
        );
        cancelledOrders[_buyer][_nftContract][_tokenId] = false;
        emit OrderUncancelled(_nftContract, _tokenId, _buyer);
    }

    function setPRIMARY_MARKET_ROYALTIES_CARBON(uint256 _carbonRoyalties)
        public
        onlyOwner
        onlyMember
        whenNotPaused
    {
        require(_carbonRoyalties != 0, "Carbon Fee cannot be zero");
        PRIMARY_MARKET_CREATOR_ROYALTIES = 1000 - _carbonRoyalties;
        PRIMARY_MARKET_CARBON_ROYALTIES = _carbonRoyalties;
    }

    function updateOwner(address _newOwner)
        external
        onlyOwner
        onlyMember
        whenNotPaused
    {
        transferOwnership(_newOwner);
    }

    function RedeemTradingFees() external onlyOwner onlyMember whenNotPaused {
        uint256 totalBalance = IERC20(ETH).balanceOf(address(this));
        IERC20(ETH).transfer(owner(), totalBalance);
    }

    function pause() public onlyOwner onlyMember {
        _pause();
    }

    function unpause() public onlyOwner onlyMember {
        _unpause();
    }
}

// function=> placeOrder (nftCollection, tokenId)
//   primary market - nft's listing price -. min price bid, auction time in web2
//      approve weth amt to exchange contract
// function=> putOnAuction (nftCollection, tokenId)
//      approve nft to exchange contract
// function executeOrder(nftCollection, tokenId, buyer, amt)
//      transfer bid amt to seller
//      transfer nft to buyer
//      who will pay Gas Fee ??    ***
//      update nft owner in Minting Factory
//      Takes Marketplace fee  (First time : Auction fee)

// place Order => sell order / buy order (nftCollection, tokenId)
// =>
// approve (amt to Exchange)  // require => min amt limit  => auctionTime
//
// validation => signature, buyer address, auctionTime
// => calls execute order(signature) internal fn
//      => update owner of NFT in Minting Factory (Interface)
//      => Royalties distribution
