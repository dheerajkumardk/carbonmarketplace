// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// make it pausable
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// import required interfaces
import "./../Interface/IERC20.sol";
import "./../Interface/IERC721.sol";
import "./../Interface/IMintingFactory.sol";
import "./../AdminRole.sol";
import "./../Interface/ICarbonMembership.sol";

contract ExchangeCore is AdminRole, Pausable, ReentrancyGuard {
    using SafeMath for uint256;

    address public mintingFactory;
    address public ETH;
    address public carbonMembership;

    address public carbonFeeVault;

    uint256 public PRIMARY_MARKET_CARBON_ROYALTIES = 250; // 25%
    uint256 public PRIMARY_MARKET_CREATOR_ROYALTIES = 750; // 75%
    uint256 public BUYERS_PREMIUM_FEES = 25; // 2.5%
    uint256 public constant BaseFactorMax = 1025; // 102.5%

    //@dev ETH is an ERC20 token on polygon
    constructor(
        address _mintingFactory,
        address _eth,
        address _carbonMembership,
        address root
    ) AdminRole(root) {
        mintingFactory = _mintingFactory;
        ETH = _eth;
        carbonMembership = _carbonMembership;
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

    function executeOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer,
        address _seller,
        uint256 _amount,
        uint256 _auctionEndTime
    ) public onlyAdmin whenNotPaused nonReentrant {
        // Validating all the requirements
        require(_auctionEndTime > block.timestamp, "Auction has ended");
        require(
            !cancelledOrders[_buyer][_nftContract][_tokenId],
            "Order is cancelled"
        );
        address ERC721Factory = IERC721(_nftContract).getFactory();
        require(ERC721Factory == mintingFactory, "ERC721 Factory doesn't match with Exchange Factory");
        bool validSeller = validateSeller(_nftContract, _tokenId, _seller);
        bool validBuyer = validateBuyer(_buyer, _amount);

        if (validSeller && validBuyer) {
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

            uint256 totalCarbonFee;
            if (ICarbonMembership(carbonMembership).balanceOf(_buyer) >= 1) {
                totalCarbonFee = carbonRoyaltyFee;
            } else {
                totalCarbonFee = carbonTradeFee + carbonRoyaltyFee;
            }

            IERC20(ETH).transferFrom(_buyer, address(this), totalCarbonFee);

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
    ) public onlyAdmin whenNotPaused {
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
    ) public onlyAdmin whenNotPaused {
        require(
            cancelledOrders[_buyer][_nftContract][_tokenId],
            "Order was never cancelled"
        );
        cancelledOrders[_buyer][_nftContract][_tokenId] = false;
        emit OrderUncancelled(_nftContract, _tokenId, _buyer);
    }

    function setPRIMARY_MARKET_ROYALTIES_CARBON(uint256 _carbonRoyalties)
        public
        onlyAdmin
        whenNotPaused
    {
        PRIMARY_MARKET_CREATOR_ROYALTIES = 1000 - _carbonRoyalties;
        PRIMARY_MARKET_CARBON_ROYALTIES = _carbonRoyalties;
    }

    function redeemTotalFeesCollected() external onlyAdmin whenNotPaused {
        uint256 totalBalance = IERC20(ETH).balanceOf(address(this));
        IERC20(ETH).transfer(carbonFeeVault, totalBalance);
    }

    function updateFactory(address _factory) external onlyAdmin {
        mintingFactory = _factory;
    }

    function setCarbonFeeVaultAddress(address _carbonFeeVault)
        external
        onlyAdmin
    {
        require(_carbonFeeVault != address(0), "Vault address cannot be zero");
        carbonFeeVault = _carbonFeeVault;
    }

    function pause() public onlyAdmin {
        _pause();
    }

    function unpause() public onlyAdmin {
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
