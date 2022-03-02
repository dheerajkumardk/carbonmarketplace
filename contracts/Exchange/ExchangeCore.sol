// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// make it ownable, pausable
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// import required interfaces
import "./../Interface/IERC20.sol";
import "./../Interface/IERC721.sol";
import "./../Interface/IMintingFactory.sol";

contract ExchangeCore is Ownable, Pausable {
    using SafeMath for uint256;

    address public mintingFactory;
    address public ETH;

    uint256 public tradingFeeFactor = 500; // 5%
    uint256 public constant BaseFactorMax = 10000; // 100%

    //@dev ETH is an ERC20 token on polygon
    constructor(address _mintingFactory, address _eth) {
        mintingFactory = _mintingFactory;
        ETH = _eth;
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
            tokenApprovedAddress == address(this),
            "Contract is not approved for this NFT"
        );

        return true;
    }

    function validateBuyer(address _buyer, uint256 _amount)
        internal view
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

    function executeOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer,
        address _seller,
        uint256 _amount,
        uint256 _auctionEndTime
    ) public onlyOwner whenNotPaused {
        // Validating all the requirements
        bool validTime = validateAuctionTime(_auctionEndTime);
        bool validSeller = validateSeller(_nftContract, _tokenId, _seller);
        bool validBuyer = validateBuyer(_buyer, _amount);
        bool isCancel = cancelledOrders[_buyer][_nftContract][_tokenId];

        if(validTime && validSeller && validBuyer && !isCancel){
            // transfer tradingFee to the exchange
            uint256 fee = _amount.mul(tradingFeeFactor).div(BaseFactorMax);
            IERC20(ETH).transferFrom(_buyer, address(this), fee);

            // transferring the amount to the seller
            uint256 transferableAmt = _amount - fee;
            IERC20(ETH).transferFrom(_buyer, _seller, transferableAmt);

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
    ) public onlyOwner {
        cancelledOrders[_buyer][_nftContract][_tokenId] = true;
        emit OrderCancelled(_nftContract, _tokenId, _buyer);
    }

    function uncancelOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer
    ) public onlyOwner {
        require(cancelledOrders[_buyer][_nftContract][_tokenId], "Order was never cancelled");
        cancelledOrders[_buyer][_nftContract][_tokenId] = false;
        emit OrderUncancelled(_nftContract, _tokenId, _buyer);
    }

    function setTradingFeeFactor(uint256 _tradingFeeFactor) public onlyOwner {
        require(_tradingFeeFactor != 0, "Fee cannot be zero");
        tradingFeeFactor = _tradingFeeFactor;
    }

    function updateOwner(address _newOwner) external onlyOwner {
        transferOwnership(_newOwner);
    }

    function RedeemTradingFees() external onlyOwner {
        uint256 totalBalance = IERC20(ETH).balanceOf(address(this));
        IERC20(ETH).transfer(owner(), totalBalance);
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
