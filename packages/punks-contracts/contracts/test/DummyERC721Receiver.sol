// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';

contract DummyERC721Receiver is IERC721Receiver {
    event Received(uint256 tokenId, bytes data);

    function onERC721Received(
        address /* operator */,
        address /* from */,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        emit Received(tokenId, data);
        return IERC721Receiver.onERC721Received.selector;
    }
}
