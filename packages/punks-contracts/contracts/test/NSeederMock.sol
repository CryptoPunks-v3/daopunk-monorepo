// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

import { ISeeder } from '../interfaces/ISeeder.sol';

contract NSeederMock is ISeeder {
    mapping(uint256 => uint8) internal _punkTypes;
    mapping(uint256 => uint8) internal _skinTones;
    mapping(uint256 => Accessory[]) internal _accessories;

    function generateSeed(uint256 /*punkId*/, uint256 salt) external view returns (Seed memory) {
        return Seed(_punkTypes[salt], _skinTones[salt], _accessories[salt]);
    }

    function registerSeed(Seed memory seed, uint256 salt) external {
        _punkTypes[salt] = seed.punkType;
        _skinTones[salt] = seed.skinTone;
        for (uint256 j = 0 ; j < seed.accessories.length ; j ++) {
            _accessories[salt].push(seed.accessories[j]);
        }
    }
}
