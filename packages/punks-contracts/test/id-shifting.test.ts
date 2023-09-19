import chai from 'chai';
import { ethers } from 'hardhat';
import { BigNumber as EthersBN, constants } from 'ethers';
import { solidity } from 'ethereum-waffle';
import {
  NDescriptorV2__factory as NDescriptorV2Factory,
  NToken,
  NSeeder__factory as NSeederFactory,
  DummyERC721Receiver,
  DummyERC721Receiver__factory as DummyERC721ReceiverFactory,
} from '../typechain';
import { deployNToken, populateDescriptorV2, populateSeeder } from './utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(solidity);
const { expect } = chai;

interface Acc {
  accType: number;
  accId: number;
}

interface Seed {
  punkType: number;
  skinTone: number;
  accessories: Array<Acc>;
}

// if the function is changed, please update its copy in tasks/utils/index.ts/calculateSeedHash()
function calculateSeedHash(seed: Seed) {
  const data = [];

  if (seed.punkType > 255) {
    throw new Error('Invalid value');
  }
  data.push(seed.punkType);
  if (seed.skinTone > 255) {
    throw new Error('Invalid value');
  }
  data.push(seed.skinTone);
  if (seed.accessories.length > 14) {
    throw new Error('Invalid value');
  }
  data.push(seed.accessories.length);
  seed.accessories.sort((acc1, acc2) => acc1.accType - acc2.accType);
  let prevAccType = -1; // check if acc types repeat
  seed.accessories.forEach( acc => {
    if (acc.accType > 255 || acc.accId > 255 || acc.accType == prevAccType) {
      throw new Error('Invalid value');
    }
    prevAccType = acc.accType;
    data.push(acc.accType);
    data.push(acc.accId);
  });

  let seedHash = '01';
  data.forEach(n => { seedHash = (n > 15 ? '' : '0') + n.toString(16) + seedHash; });
  seedHash = '0x' + seedHash.padStart(64, '0');

  return seedHash;
}

describe('NToken - Id Shifting', () => {
  let nToken: NToken;
  let dummyERC721Receiver: DummyERC721Receiver;
  let deployer: SignerWithAddress;
  let punkers: SignerWithAddress;
  let alice: SignerWithAddress;
  let snapshotId: number;

  before(async () => {
    [deployer, punkers, alice] = await ethers.getSigners();
    nToken = await deployNToken(deployer, punkers.address, deployer.address);

    const descriptor = await nToken.descriptor();
    const seeder = await nToken.seeder();

    await populateDescriptorV2(NDescriptorV2Factory.connect(descriptor, deployer));
    await populateSeeder(NSeederFactory.connect(seeder, deployer));

    const dummyERC721ReceiverFactory = new DummyERC721ReceiverFactory(deployer);
    dummyERC721Receiver = await dummyERC721ReceiverFactory.deploy();

    await nToken.mint();
    await nToken.mint();
    await nToken.transferFrom(deployer.address, alice.address, 1);
    await nToken.transferFrom(deployer.address, alice.address, 2);
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send('evm_snapshot', []);
  });

  afterEach(async () => {
    await ethers.provider.send('evm_revert', [snapshotId]);
  });

  describe('management', async () => {
    it('the owner can shift ids', async () => {
      await nToken.setIdShift(10_000);
      expect(await nToken.tokenOfOwnerByIndex(alice.address, 0)).to.be.eq(10_001);
    });
    it('the owner can reshift ids', async () => {
      await nToken.setIdShift(10_000);
      await nToken.setIdShift(0);
      expect(await nToken.tokenOfOwnerByIndex(alice.address, 0)).to.be.eq(1);
    });
    it('only owner can shift ids', async () => {
      const [, nonOwner] = await ethers.getSigners();
      const tx = nToken.connect(nonOwner).setIdShift(10_000);
      await expect(tx).to.be.revertedWith('Ownable: caller is not the owner');
    });
    it('shifting ids emits the event', async () => {
      const tx = nToken.setIdShift(10_000);
      await expect(tx)
        .to.emit(nToken, 'IdShiftUpdated')
        .withArgs(10_000);
    });
    it('the owner cannot shift ids when locked', async () => {
      await nToken.lockIdShift();
      const tx = nToken.setIdShift(10_000);
      await expect(tx).to.be.revertedWith('Id Shifting is locked');
    });
    it('the owner can lock id shifting', async () => {
      expect(await nToken.isIdShitLocked()).to.be.eq(false);
      await nToken.lockIdShift();
      expect(await nToken.isIdShitLocked()).to.be.eq(true);
    });
    it('locking id shifting emits the event', async () => {
      const tx = nToken.lockIdShift();
      await expect(tx)
        .to.emit(nToken, 'IdShiftLocked')
        .withArgs();
    });
    it('only owner can lock ids shifting', async () => {
      const [, nonOwner] = await ethers.getSigners();
      const tx = nToken.connect(nonOwner).lockIdShift();
      await expect(tx).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('ERC721 functions', async () => {
    beforeEach(async () => {
      await nToken.setIdShift(10_000);
    });
    it('ownerOf (1)', async () => {
      expect(await nToken.ownerOf(10_000)).to.be.eq(punkers.address);
      await expect(nToken.ownerOf(0)).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });
    it('ownerOf (2)', async () => {
      expect(await nToken.ownerOf(10_001)).to.be.eq(alice.address);
      await expect(nToken.ownerOf(1)).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });
    it('tokenUri (1)', async () => {
      await expect(nToken.tokenURI(1)).to.be.revertedWith('PunkToken: URI query for nonexistent token');
    });
    it('tokenUri (2)', async () => {
      const tokenUri = await nToken.tokenURI(10_001);
      const { name, description, image } = JSON.parse(
        Buffer.from(tokenUri.replace('data:application/json;base64,', ''), 'base64').toString(
          'ascii',
        ),
      );
      expect(name).to.equal('DAOpunk 10001');
      expect(description).to.equal('DAOpunk 10001 is a member of the Punkers DAO');
      expect(image).to.not.be.undefined;
    });
    it('approve (1)', async () => {
      await expect(nToken.connect(alice).approve(deployer.address, 1)).to.be.revertedWith(
        'ERC721: owner query for nonexistent token'
      );
    });
    it('approve (2)', async () => {
      await nToken.connect(alice).approve(deployer.address, 10_001);
      expect(await nToken.getApproved(10_001)).to.be.eq(deployer.address);
    });
    it('approve (3)', async () => {
      const tx = nToken.connect(alice).approve(deployer.address, 10_001);
      await expect(tx)
        .to.emit(nToken, 'Approval')
        .withArgs(alice.address, deployer.address, 10_001);
    });
    it('getApproved', async () => {
      expect(await nToken.getApproved(10_001)).to.be.eq(constants.AddressZero);
      await expect(nToken.getApproved(1)).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });
    it('transferFrom (1)', async () => {
      await expect(nToken.connect(alice).transferFrom(alice.address, deployer.address, 1)).to.be.revertedWith(
        'ERC721: operator query for nonexistent token'
      );
    });
    it('transferFrom (2)', async () => {
      await nToken.connect(alice).transferFrom(alice.address, deployer.address, 10_001);
      expect(await nToken.ownerOf(10_001)).to.be.eq(deployer.address);
    });
    it('transferFrom (3)', async () => {
      const tx = nToken.connect(alice).transferFrom(alice.address, deployer.address, 10_001);
      await expect(tx)
        .to.emit(nToken, 'Transfer')
        .withArgs(alice.address, deployer.address, 10_001);
    });
    it('transferFrom (4)', async () => {
      await nToken.connect(alice).approve(deployer.address, 10_001);
      await nToken.transferFrom(alice.address, deployer.address, 10_001);
      expect(await nToken.ownerOf(10_001)).to.be.eq(deployer.address);
    });
    it('safeTransferFrom (1)', async () => {
      await expect(nToken.connect(alice)['safeTransferFrom(address,address,uint256)'](alice.address, deployer.address, 1)).to.be.revertedWith(
        'ERC721: operator query for nonexistent token'
      );
    });
    it('safeTransferFrom (2)', async () => {
      await nToken.connect(alice)['safeTransferFrom(address,address,uint256)'](alice.address, deployer.address, 10_001);
      expect(await nToken.ownerOf(10_001)).to.be.eq(deployer.address);
    });
    it('safeTransferFrom (3)', async () => {
      const tx = nToken.connect(alice)['safeTransferFrom(address,address,uint256)'](alice.address, deployer.address, 10_001);
      await expect(tx)
        .to.emit(nToken, 'Transfer')
        .withArgs(alice.address, deployer.address, 10_001);
    });
    it('safeTransferFrom (4)', async () => {
      await nToken.connect(alice).approve(deployer.address, 10_001);
      await nToken['safeTransferFrom(address,address,uint256)'](alice.address, deployer.address, 10_001);
      expect(await nToken.ownerOf(10_001)).to.be.eq(deployer.address);
    });
    it('safeTransferFrom to receiver', async () => {
      const tx = nToken.connect(alice)['safeTransferFrom(address,address,uint256)'](alice.address, dummyERC721Receiver.address, 10_001);
      await expect(tx)
        .to.emit(dummyERC721Receiver, 'Received')
        .withArgs(10_001, '0x');
    });
    it('safeTransferFrom with data (1)', async () => {
      await expect(nToken.connect(alice)['safeTransferFrom(address,address,uint256,bytes)'](alice.address, deployer.address, 1, '0x112233')).to.be.revertedWith(
        'ERC721: operator query for nonexistent token'
      );
    });
    it('safeTransferFrom with data (2)', async () => {
      await nToken.connect(alice)['safeTransferFrom(address,address,uint256,bytes)'](alice.address, deployer.address, 10_001, '0x112233');
      expect(await nToken.ownerOf(10_001)).to.be.eq(deployer.address);
    });
    it('safeTransferFrom with data (3)', async () => {
      const tx = nToken.connect(alice)['safeTransferFrom(address,address,uint256,bytes)'](alice.address, deployer.address, 10_001, '0x112233');
      await expect(tx)
        .to.emit(nToken, 'Transfer')
        .withArgs(alice.address, deployer.address, 10_001);
    });
    it('safeTransferFrom with data (4)', async () => {
      await nToken.connect(alice).approve(deployer.address, 10_001);
      await nToken['safeTransferFrom(address,address,uint256,bytes)'](alice.address, deployer.address, 10_001, '0x112233');
      expect(await nToken.ownerOf(10_001)).to.be.eq(deployer.address);
    });
    it('safeTransferFrom with data to receiver', async () => {
      const tx = nToken.connect(alice)['safeTransferFrom(address,address,uint256,bytes)'](alice.address, dummyERC721Receiver.address, 10_001, '0x112233');
      await expect(tx)
        .to.emit(dummyERC721Receiver, 'Received')
        .withArgs(10_001, '0x112233');
    });
  });

  describe('Enumerable functions', async () => {
    beforeEach(async () => {
      await nToken.setIdShift(10_000);
    });
    it('tokenOfOwnerByIndex (1)', async () => {
      expect(await nToken.tokenOfOwnerByIndex(alice.address, 0)).to.be.eq(10_001);
    });
    it('tokenOfOwnerByIndex (2)', async () => {
      expect(await nToken.tokenOfOwnerByIndex(alice.address, 1)).to.be.eq(10_002);
    });
    it('tokenOfOwnerByIndex (3)', async () => {
      await nToken.mint();
      await nToken.transferFrom(deployer.address, alice.address, 10_003);
      expect(await nToken.tokenOfOwnerByIndex(alice.address, 2)).to.be.eq(10_003);
    });
    it('tokenByIndex (1)', async () => {
      expect(await nToken.tokenByIndex(0)).to.be.eq(10_000);
    });
    it('tokenByIndex (2)', async () => {
      expect(await nToken.tokenByIndex(1)).to.be.eq(10_001);
    });
    it('tokenByIndex (3)', async () => {
      expect(await nToken.tokenByIndex(2)).to.be.eq(10_002);
    });
    it('tokenByIndex (4)', async () => {
      await nToken.mint();
      await nToken.transferFrom(deployer.address, alice.address, 10_003);
      expect(await nToken.tokenByIndex(3)).to.be.eq(10_003);
    });
  });

  describe('Checkpointable functions', async () => {
    beforeEach(async () => {
      await nToken.setIdShift(10_000);
    });
    it('getCurrentVotes', async () => {
      expect(await nToken.getCurrentVotes(punkers.address)).to.be.eq(1);
      expect(await nToken.getCurrentVotes(alice.address)).to.be.eq(2);
      await nToken.connect(alice).transferFrom(alice.address, punkers.address, 10_001);
      expect(await nToken.getCurrentVotes(punkers.address)).to.be.eq(2);
      expect(await nToken.getCurrentVotes(alice.address)).to.be.eq(1);
    });
  });

  describe('NToken functions', async () => {
    beforeEach(async () => {
      await nToken.setIdShift(10_000);
    });
    it('seeds', async () => {
      expect(await nToken.seeds(10_001)).to.be.ok;
      await expect(nToken.seeds(1)).to.be.reverted;
    });
    it('getPunk', async () => {
      expect(await nToken.getPunk(10_001)).to.be.ok;
      await expect(nToken.getPunk(1)).to.be.reverted;
    });
    it('dataURI', async () => {
      expect(await nToken.dataURI(10_001)).to.be.ok;
      await expect(nToken.dataURI(1)).to.be.revertedWith('PunkToken: URI query for nonexistent token');
    });
    it('mint', async () => {
      const tx = nToken.mint();

      await expect(tx).to.emit(nToken, 'Transfer').withArgs(constants.AddressZero, deployer.address, 10_003);
      await expect(tx).to.emit(nToken, 'Transfer').withArgs(deployer.address, deployer.address, 10_003);

      const receipt = await (await tx).wait();
      const nCreated = receipt.events?.[3];
      expect(nCreated?.event).to.eq('PunkCreated');
      expect(nCreated?.args?.tokenId).to.eq(10_003);
    });
    it('burn', async () => {
      await nToken.connect(alice).transferFrom(alice.address, deployer.address, 10_001);

      await expect(nToken.burn(1)).to.be.revertedWith('ERC721: operator query for nonexistent token');
      const tx = nToken.burn(10_001);
      await expect(tx).to.emit(nToken, 'Transfer').withArgs(deployer.address, constants.AddressZero, 10_001);
      await expect(tx).to.emit(nToken, 'PunkBurned').withArgs(10_001);
    });
  });
});
