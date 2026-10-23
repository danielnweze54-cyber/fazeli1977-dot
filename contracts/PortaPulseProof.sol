// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PortaPulseProof {
    address public immutable owner;
    uint256 public pulseCount;

    event Pulse(address indexed sender, uint256 indexed count);

    constructor() {
        owner = msg.sender;
    }

    function pulse() external {
        require(msg.sender == owner, "owner only");
        pulseCount += 1;
        emit Pulse(msg.sender, pulseCount);
    }
}
