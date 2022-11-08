// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import 'hardhat/console.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract MockToken is Ownable, ERC20  {
  address deployer;

  constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
    _mint(msg.sender, 100000e18);
    deployer = msg.sender;
  }
}