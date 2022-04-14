// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// make it pausable
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// import required interfaces
import "./../Interface/IERC20.sol";
import "./../Interface/IERC721NFTContract.sol";
import "./../Interface/IMintingFactory.sol";
import "./../AdminRole.sol";
import "./../Interface/ICarbonMembership.sol";

contract ExchangeCore is AdminRole, Pausable, ReentrancyGuard {
    using SafeMath for uint256;

    address public mintingFactory;
    address public ETH;
    address public carbonMembership;

    address public carbonFeeVault;

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

    function validateSeller(
        address _nftContract,
        uint256 _tokenId,
        address _seller
    ) internal view returns (bool) {
        // check if he owns the token
        address tokenOwner = IERC721NFTContract(_nftContract).ownerOf(_tokenId);
        require(_seller == tokenOwner, "Seller does not owns the token");

        // check token approval
        address tokenApprovedAddress = IERC721NFTContract(_nftContract)
            .getApproved(_tokenId);

        require(
            tokenApprovedAddress == address(this) ||
                IERC721NFTContract(_nftContract).isApprovedForAll(
                    _seller,
                    address(this)
                ),
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
        uint256 _auctionEndTime,
        uint256 _mode
    ) public onlyAdmin whenNotPaused nonReentrant {
        // Validating all the requirements
        require(_auctionEndTime > block.timestamp, "Auction has ended");
        require(
            !cancelledOrders[_buyer][_nftContract][_tokenId],
            "Order is cancelled"
        );
        require(
            IERC721NFTContract(_nftContract).factory() == mintingFactory,
            "ERC721 Factory doesn't match with Exchange Factory"
        );
        require(_mode <= 2, "Invalid mode specified");
        bool validSeller = validateSeller(_nftContract, _tokenId, _seller);
        bool validBuyer = validateBuyer(_buyer, _amount);

        if (validSeller && validBuyer) {
            uint256 carbonRoyaltyFee;
            uint256 creatorRoyalties;

            if (_mode == 0) {
                // 90-10
                carbonRoyaltyFee = _amount.mul(100).div(BaseFactorMax);
                creatorRoyalties = _amount.mul(900).div(BaseFactorMax);
            } else if (_mode == 1) {
                // 60-40
                carbonRoyaltyFee = _amount.mul(400).div(BaseFactorMax);
                creatorRoyalties = _amount.mul(600).div(BaseFactorMax);
            } else {
                // 50-50
                carbonRoyaltyFee = _amount.mul(500).div(BaseFactorMax);
                creatorRoyalties = _amount.mul(500).div(BaseFactorMax);
            }
            // transfer Royalties to the exchange

            uint256 carbonTradeFee = _amount.mul(BUYERS_PREMIUM_FEES).div(
                BaseFactorMax
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
