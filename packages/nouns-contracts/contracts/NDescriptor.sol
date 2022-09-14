// SPDX-License-Identifier: GPL-3.0

/// @title The Nouns NFT descriptor

/*********************************
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 * ░░░░░░█████████░░█████████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░██████░░░████████░░░████░░░ *
 * ░░██░░██░░░████░░██░░░████░░░ *
 * ░░██░░██░░░████░░██░░░████░░░ *
 * ░░░░░░█████████░░█████████░░░ *
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 *********************************/

pragma solidity ^0.8.6;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { Strings } from '@openzeppelin/contracts/utils/Strings.sol';
import { IDescriptor } from './interfaces/IDescriptor.sol';
import { ISeeder } from './interfaces/ISeeder.sol';
import { NFTDescriptor } from './libs/NFTDescriptor.sol';
import { MultiPartRLEToSVG } from './libs/MultiPartRLEToSVG.sol';

contract NDescriptor is IDescriptor, Ownable {
    using Strings for uint256;

    // prettier-ignore
    // https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt
    bytes32 constant COPYRIGHT_CC0_1_0_UNIVERSAL_LICENSE = 0xa2010f343487d3f7618affe54f789f5487602331c0a8d03f49e9a7c547cf0499;

    // Whether or not new Punk parts can be added
    bool public override arePartsLocked;

    // Whether or not `tokenURI` should be returned as a data URI (Default: true)
    bool public override isDataURIEnabled = true;

    // Base URI
    string public override baseURI;

    // Punk Color Palettes (Index => Hex Colors)
    mapping(uint8 => string[]) public override palettes;

    // Noun Backgrounds (Hex Colors)
//  string[] public override backgrounds;

    // Punk Bodies (Custom RLE)
    bytes[] public override hats;
    bytes[] public override hairs;
    bytes[] public override beards;
    bytes[] public override eyeses;
    bytes[] public override glasseses;
    bytes[] public override mouths;
    bytes[] public override teeths;
    bytes[] public override lipses;
    bytes[] public override necks;
    bytes[] public override emotions;
    bytes[] public override faces;
    bytes[] public override earses;
    bytes[] public override noses;
    bytes[] public override cheekses;

    /**
     * @notice Require that the parts have not been locked.
     */
    modifier whenPartsNotLocked() {
        require(!arePartsLocked, 'Parts are locked');
        _;
    }

    /**
     * @notice Get the number of available Noun `backgrounds`.
     */
    // function backgroundCount() external view override returns (uint256) {
    //     return backgrounds.length;
    // }

    /**
     * @notice Get the number of available Punk `bodies`.
     */
    function hatCount() external view override returns (uint256) {
        return hats.length;
    }
    function hairCount() external view override returns (uint256) {
        return hairs.length;
    }
    function beardCount() external view override returns (uint256) {
        return beards.length;
    }
    function eyesCount() external view override returns (uint256) {
        return eyeses.length;
    }
    function glassesCount() external view override returns (uint256) {
        return glasseses.length;
    }
    function mouthCount() external view override returns (uint256) {
        return mouths.length;
    }
    function teethCount() external view override returns (uint256) {
        return teeths.length;
    }
    function lipsCount() external view override returns (uint256) {
        return lipses.length;
    }
    function neckCount() external view override returns (uint256) {
        return necks.length;
    }
    function emotionCount() external view override returns (uint256) {
        return emotions.length;
    }
    function faceCount() external view override returns (uint256) {
        return faces.length;
    }
    function earsCount() external view override returns (uint256) {
        return earses.length;
    }
    function noseCount() external view override returns (uint256) {
        return noses.length;
    }
    function cheeksCount() external view override returns (uint256) {
        return cheekses.length;
    }

    /**
     * @notice Add colors to a color palette.
     * @dev This function can only be called by the owner.
     */
    function addManyColorsToPalette(uint8 paletteIndex, string[] calldata newColors) external override onlyOwner {
        require(palettes[paletteIndex].length + newColors.length <= 256, 'Palettes can only hold 256 colors');
        for (uint256 i = 0; i < newColors.length; i++) {
            _addColorToPalette(paletteIndex, newColors[i]);
        }
    }

    /**
     * @notice Batch add Noun backgrounds.
     * @dev This function can only be called by the owner when not locked.
     */
    // function addManyBackgrounds(string[] calldata _backgrounds) external override onlyOwner whenPartsNotLocked {
    //     for (uint256 i = 0; i < _backgrounds.length; i++) {
    //         _addBackground(_backgrounds[i]);
    //     }
    // }

    /**
     * @notice Batch add Punk bodies.
     * @dev This function can only be called by the owner when not locked.
     */
    function addManyHats(bytes[] calldata _hats) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _hats.length; i++) {
            _addHat(_hats[i]);
        }
    }
    function addManyHairs(bytes[] calldata _hairs) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _hairs.length; i++) {
            _addHair(_hairs[i]);
        }
    }
    function addManyBeards(bytes[] calldata _beards) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _beards.length; i++) {
            _addBeard(_beards[i]);
        }
    }
    function addManyEyeses(bytes[] calldata _eyeses) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _eyeses.length; i++) {
            _addEyes(_eyeses[i]);
        }
    }
    function addManyGlasseses(bytes[] calldata _glasseses) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _glasseses.length; i++) {
            _addGlasses(_glasseses[i]);
        }
    }
    function addManyMouths(bytes[] calldata _mouths) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _mouths.length; i++) {
            _addMouth(_mouths[i]);
        }
    }
    function addManyTeeths(bytes[] calldata _teeths) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _teeths.length; i++) {
            _addTeeth(_teeths[i]);
        }
    }
    function addManyLipses(bytes[] calldata _lipses) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _lipses.length; i++) {
            _addLips(_lipses[i]);
        }
    }
    function addManyNecks(bytes[] calldata _necks) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _necks.length; i++) {
            _addNeck(_necks[i]);
        }
    }
    function addManyEmotions(bytes[] calldata _emotions) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _emotions.length; i++) {
            _addEmotion(_emotions[i]);
        }
    }
    function addManyFaces(bytes[] calldata _faces) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _faces.length; i++) {
            _addFace(_faces[i]);
        }
    }
    function addManyEarses(bytes[] calldata _earses) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _earses.length; i++) {
            _addEars(_earses[i]);
        }
    }
    function addManyNoses(bytes[] calldata _noses) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _noses.length; i++) {
            _addNose(_noses[i]);
        }
    }
    function addManyCheekses(bytes[] calldata _cheekses) external override onlyOwner whenPartsNotLocked {
        for (uint256 i = 0; i < _cheekses.length; i++) {
            _addCheeks(_cheekses[i]);
        }
    }

    /**
     * @notice Add a single color to a color palette.
     * @dev This function can only be called by the owner.
     */
    function addColorToPalette(uint8 _paletteIndex, string calldata _color) external override onlyOwner {
        require(palettes[_paletteIndex].length <= 255, 'Palettes can only hold 256 colors');
        _addColorToPalette(_paletteIndex, _color);
    }

    /**
     * @notice Add a Noun background.
     * @dev This function can only be called by the owner when not locked.
     */
    // function addBackground(string calldata _background) external override onlyOwner whenPartsNotLocked {
    //     _addBackground(_background);
    // }

    /**
     * @notice Add a Noun body.
     * @dev This function can only be called by the owner when not locked.
     */
    function addHat(bytes calldata _hat) external override onlyOwner whenPartsNotLocked {
        _addHat(_hat);
    }
    function addHair(bytes calldata _hair) external override onlyOwner whenPartsNotLocked {
        _addHair(_hair);
    }
    function addBeard(bytes calldata _beard) external override onlyOwner whenPartsNotLocked {
        _addBeard(_beard);
    }
    function addEyes(bytes calldata _eyes) external override onlyOwner whenPartsNotLocked {
        _addEyes(_eyes);
    }
    function addGlasses(bytes calldata _glasses) external override onlyOwner whenPartsNotLocked {
        _addGlasses(_glasses);
    }
    function addMouth(bytes calldata _mouth) external override onlyOwner whenPartsNotLocked {
        _addMouth(_mouth);
    }
    function addTeeth(bytes calldata _teeth) external override onlyOwner whenPartsNotLocked {
        _addTeeth(_teeth);
    }
    function addLips(bytes calldata _lips) external override onlyOwner whenPartsNotLocked {
        _addLips(_lips);
    }
    function addNeck(bytes calldata _neck) external override onlyOwner whenPartsNotLocked {
        _addNeck(_neck);
    }
    function addEmotion(bytes calldata _emotion) external override onlyOwner whenPartsNotLocked {
        _addEmotion(_emotion);
    }
    function addFace(bytes calldata _face) external override onlyOwner whenPartsNotLocked {
        _addFace(_face);
    }
    function addEars(bytes calldata _ears) external override onlyOwner whenPartsNotLocked {
        _addEars(_ears);
    }
    function addNose(bytes calldata _nose) external override onlyOwner whenPartsNotLocked {
        _addNose(_nose);
    }
    function addCheeks(bytes calldata _cheeks) external override onlyOwner whenPartsNotLocked {
        _addCheeks(_cheeks);
    }

    /**
     * @notice Lock all Noun parts.
     * @dev This cannot be reversed and can only be called by the owner when not locked.
     */
    function lockParts() external override onlyOwner whenPartsNotLocked {
        arePartsLocked = true;

        emit PartsLocked();
    }

    /**
     * @notice Toggle a boolean value which determines if `tokenURI` returns a data URI
     * or an HTTP URL.
     * @dev This can only be called by the owner.
     */
    function toggleDataURIEnabled() external override onlyOwner {
        bool enabled = !isDataURIEnabled;

        isDataURIEnabled = enabled;
        emit DataURIToggled(enabled);
    }

    /**
     * @notice Set the base URI for all token IDs. It is automatically
     * added as a prefix to the value returned in {tokenURI}, or to the
     * token ID if {tokenURI} is empty.
     * @dev This can only be called by the owner.
     */
    function setBaseURI(string calldata _baseURI) external override onlyOwner {
        baseURI = _baseURI;

        emit BaseURIUpdated(_baseURI);
    }

    /**
     * @notice Given a token ID and seed, construct a token URI for an official Nouns DAO noun.
     * @dev The returned value may be a base64 encoded data URI or an API URL.
     */
    function tokenURI(uint256 tokenId, ISeeder.Seed memory seed) external view override returns (string memory) {
        if (isDataURIEnabled) {
            return dataURI(tokenId, seed);
        }
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    /**
     * @notice Given a token ID and seed, construct a base64 encoded data URI for an official NDAO token.
     */
    function dataURI(uint256 tokenId, ISeeder.Seed memory seed) public view override returns (string memory) {
        string memory tokenIdStr = tokenId.toString();
        string memory name = string(abi.encodePacked('Token ', tokenIdStr));
        string memory description = string(abi.encodePacked('Token ', tokenIdStr, ' is a member of the NDAO'));

        return genericDataURI(name, description, seed);
    }

    /**
     * @notice Given a name, description, and seed, construct a base64 encoded data URI.
     */
    function genericDataURI(
        string memory name,
        string memory description,
        ISeeder.Seed memory seed
    ) public view override returns (string memory) {
        NFTDescriptor.TokenURIParams memory params = NFTDescriptor.TokenURIParams({
            name: name,
            description: description,
            parts: _getPartsForSeed(seed)
//            background: backgrounds[seed.background]
        });
        return NFTDescriptor.constructTokenURI(params, palettes);
    }

    /**
     * @notice Given a seed, construct a base64 encoded SVG image.
     */
    function generateSVGImage(ISeeder.Seed memory seed) external view override returns (string memory) {
        MultiPartRLEToSVG.SVGParams memory params = MultiPartRLEToSVG.SVGParams({
            parts: _getPartsForSeed(seed)
//            background: backgrounds[seed.background]
        });
        return NFTDescriptor.generateSVGImage(params, palettes);
    }

    /**
     * @notice Add a single color to a color palette.
     */
    function _addColorToPalette(uint8 _paletteIndex, string calldata _color) internal {
        palettes[_paletteIndex].push(_color);
    }

    /**
     * @notice Add a Noun background.
     */
    // function _addBackground(string calldata _background) internal {
    //     backgrounds.push(_background);
    // }

    /**
     * @notice Add a Punk body.
     */
    function _addHat(bytes calldata _hat) internal {
        hats.push(_hat);
    }
    function _addHair(bytes calldata _hair) internal {
        hairs.push(_hair);
    }
    function _addBeard(bytes calldata _beard) internal {
        beards.push(_beard);
    }
    function _addEyes(bytes calldata _eyes) internal {
        eyeses.push(_eyes);
    }

    /**
     * @notice Get all Noun parts for the passed `seed`.
     */
    function _getPartsForSeed(ISeeder.Seed memory seed) internal view returns (bytes[] memory) {
        bytes[] memory _parts = new bytes[](4);
        _parts[0] = bodies[seed.body];
        _parts[1] = accessories[seed.accessory];
        _parts[2] = heads[seed.head];
        _parts[3] = glasses[seed.glasses];
        return _parts;
    }
}
