import chai from 'chai';
import { ethers } from 'hardhat';
import { BigNumber as EthersBN, constants } from 'ethers';
import { solidity } from 'ethereum-waffle';
import { NDescriptorV2__factory as NDescriptorV2Factory, NToken, NSeeder__factory as NSeederFactory } from '../typechain';
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

describe('NToken', () => {
  let nToken: NToken;
  let deployer: SignerWithAddress;
  let punkers: SignerWithAddress;
  let snapshotId: number;

  before(async () => {
    [deployer, punkers] = await ethers.getSigners();
    nToken = await deployNToken(deployer, punkers.address, deployer.address);

    const descriptor = await nToken.descriptor();
    const seeder = await nToken.seeder();

    await populateDescriptorV2(NDescriptorV2Factory.connect(descriptor, deployer));
    await populateSeeder(NSeederFactory.connect(seeder, deployer));
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send('evm_snapshot', []);
  });

  afterEach(async () => {
    await ethers.provider.send('evm_revert', [snapshotId]);
  });

  it('should allow the minter to mint a noun to itself and a reward noun to the punkers', async () => {
    const receipt = await (await nToken.mint()).wait();

    const [, , , noundersNounCreated, , , , ownersNounCreated] = receipt.events || [];

    expect(await nToken.ownerOf(0)).to.eq(punkers.address);
    expect(noundersNounCreated?.event).to.eq('PunkCreated');
    expect(noundersNounCreated?.args?.tokenId).to.eq(0);
    expect(noundersNounCreated?.args?.seed.length).to.equal(3);
    expect(noundersNounCreated?.args?.seed.punkType).to.be.a('number');
    expect(noundersNounCreated?.args?.seed.skinTone).to.be.a('number');

    expect(await nToken.ownerOf(1)).to.eq(deployer.address);
    expect(ownersNounCreated?.event).to.eq('PunkCreated');
    expect(ownersNounCreated?.args?.tokenId).to.eq(1);
    expect(ownersNounCreated?.args?.seed.length).to.equal(3);
    expect(ownersNounCreated?.args?.seed.punkType).to.be.a('number');
    expect(ownersNounCreated?.args?.seed.skinTone).to.be.a('number');

    noundersNounCreated?.args?.seed.accessories.forEach((item: any) => {
      expect(item.accType).to.be.a('number');
      expect(item.accId).to.be.a('number');
    });

    ownersNounCreated?.args?.seed.accessories.forEach((item: any) => {
      expect(item.accType).to.be.a('number');
      expect(item.accId).to.be.a('number');
    });
  });

  it('should set symbol', async () => {
    expect(await nToken.symbol()).to.eq('Ͼ');
  });

  it('should set name', async () => {
    expect(await nToken.name()).to.eq('DAOpunks');
  });

  it('should allow minter to mint a noun to itself', async () => {
    await (await nToken.mint()).wait();

    const receipt = await (await nToken.mint()).wait();
    const nounCreated = receipt.events?.[3];

    expect(await nToken.ownerOf(2)).to.eq(deployer.address);
    expect(nounCreated?.event).to.eq('PunkCreated');
    expect(nounCreated?.args?.tokenId).to.eq(2);
    expect(nounCreated?.args?.seed.length).to.equal(3);
    expect(nounCreated?.args?.seed.punkType).to.be.a('number');
    expect(nounCreated?.args?.seed.skinTone).to.be.a('number');

    nounCreated?.args?.seed.accessories.forEach((item: any) => {
      expect(item.accType).to.be.a('number');
      expect(item.accId).to.be.a('number');
    });
  });

  it('should emit two transfer logs on mint', async () => {
    const [, , creator, minter] = await ethers.getSigners();

    await (await nToken.mint()).wait();

    await (await nToken.setMinter(minter.address)).wait();
    await (await nToken.transferOwnership(creator.address)).wait();

    const tx = nToken.connect(minter).mint();

    await expect(tx)
      .to.emit(nToken, 'Transfer')
      .withArgs(constants.AddressZero, creator.address, 2);
    await expect(tx).to.emit(nToken, 'Transfer').withArgs(creator.address, minter.address, 2);
  });

  it('should allow minter to burn a noun', async () => {
    await (await nToken.mint()).wait();

    const tx = nToken.burn(1);
    await expect(tx).to.emit(nToken, 'PunkBurned').withArgs(1);
  });

  it('should not allow minter to burn a noun not owned', async () => {
    await (await nToken.mint()).wait();
    await (await nToken.transferFrom(deployer.address, punkers.address, 1)).wait();

    const tx = nToken.burn(1);
    await expect(tx).to.be.revertedWith('PunkToken: burn caller is not owner nor approved');
  });

  it('should revert on non-minter mint', async () => {
    const account0AsNounErc721Account = nToken.connect(punkers);
    await expect(account0AsNounErc721Account.mint()).to.be.reverted;
  });

  it('generated seeds have sorted accessories', async () => {
    const seederAddress = await nToken.seeder();
    const seeder = NSeederFactory.connect(seederAddress, deployer);
    for (let i = 0; i < 20 ; i ++) {
      const n = ethers.BigNumber.from(ethers.utils.keccak256(ethers.BigNumber.from(i).toHexString()));
      const seed = await seeder.generateSeedFromNumber(n);
      const accessories = seed.accessories;
      for (let j = 0 ; j < accessories.length - 1 ; j ++) {
        expect(accessories[j].accType).to.be.lt(accessories[j+1].accType);
      }
    }
  });

  it('calculates correct seed hash (1)', async () => {
    const seed = {punkType: 1, skinTone: 2, accessories: [{accType: 9, accId: 23}, {accType: 10, accId: 5}, {accType: 11, accId: 15}]}
    const seedHash = await nToken.calculateSeedHash(seed);
    expect(seedHash).to.be.equal('0x000000000000000000000000000000000000000000000f0b050a170903020101');
    const expectedSeedHash = calculateSeedHash(seed);
    expect(seedHash).to.be.equal(expectedSeedHash);
  });

  it('calculates correct seed hash (2)', async () => {
    const seed = {punkType: 0, skinTone: 0, accessories: []}
    const seedHash = await nToken.calculateSeedHash(seed);
    expect(seedHash).to.be.equal('0x0000000000000000000000000000000000000000000000000000000000000001');
    const expectedSeedHash = calculateSeedHash(seed);
    expect(seedHash).to.be.equal(expectedSeedHash);
  });

  it('calculates correct seed hash (3)', async () => {
    const accessories = [
      {accType: 0, accId: 0},
      {accType: 1, accId: 1},
      {accType: 2, accId: 2},
      {accType: 3, accId: 3},
      {accType: 4, accId: 4},
      {accType: 5, accId: 5},
      {accType: 6, accId: 6},
      {accType: 7, accId: 7},
      {accType: 8, accId: 16},
      {accType: 9, accId: 9},
      {accType: 10, accId: 10},
      {accType: 11, accId: 11},
      {accType: 12, accId: 12},
      {accType: 13, accId: 13},
    ];
    const seed = {punkType: 2, skinTone: 6, accessories }
    const seedHash = await nToken.calculateSeedHash(seed);
    expect(seedHash).to.be.equal('0x0d0d0c0c0b0b0a0a09091008070706060505040403030202010100000e060201');
    const expectedSeedHash = calculateSeedHash(seed);
    expect(seedHash).to.be.equal(expectedSeedHash);
  });

  describe('contractURI', async () => {
    it('should return correct contractURI', async () => {
      expect(await nToken.contractURI()).to.eq(
        'ipfs://QmcSdjhRjLCMyGCp3oXLgv95e1odo8dKHyMZYF8xY1g8n8',
      );
    });
    it('should allow owner to set contractURI', async () => {
      await nToken.setContractURIHash('ABC123');
      expect(await nToken.contractURI()).to.eq('ipfs://ABC123');
    });
    it('should not allow non owner to set contractURI', async () => {
      const [, nonOwner] = await ethers.getSigners();
      await expect(nToken.connect(nonOwner).setContractURIHash('BAD')).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );
    });
  });

  describe('metadata', async () => {
    it('should get default name', async () => {
      expect(await nToken.name()).to.eq('DAOpunks');
    });
    it('should get default symbol', async () => {
      expect(await nToken.symbol()).to.eq('Ͼ');
    });
    it('the owner can change the name', async () => {
      await nToken.setName('PUNKS-2');
      expect(await nToken.name()).to.eq('PUNKS-2');
    });
    it('the owner can change the symbol', async () => {
      await nToken.setSymbol('Ͼ-2');
      expect(await nToken.symbol()).to.eq('Ͼ-2');
    });
    it('only owner can change the name', async () => {
      const [, nonOwner] = await ethers.getSigners();
      const tx = nToken.connect(nonOwner).setName('PUNKS-2');
      await expect(tx).to.be.revertedWith('Ownable: caller is not the owner');
    });
    it('only owner can change the symbol', async () => {
      const [, nonOwner] = await ethers.getSigners();
      const tx = nToken.connect(nonOwner).setSymbol('Ͼ-2');
      await expect(tx).to.be.revertedWith('Ownable: caller is not the owner');
    });
    it('a name change emits the event', async () => {
      const tx = nToken.setName('PUNKS-2');
      await expect(tx)
        .to.emit(nToken, 'MetadataUpdated')
        .withArgs('PUNKS-2', 'Ͼ');
    });
    it('a symbol change emits the event', async () => {
      const tx = nToken.setSymbol('Ͼ-2');
      await expect(tx)
        .to.emit(nToken, 'MetadataUpdated')
        .withArgs('DAOpunks', 'Ͼ-2');
    });
    it('the owner cannot change the name when locked', async () => {
      await nToken.lockMetadata();
      const tx = nToken.setName('PUNKS-2');
      await expect(tx).to.be.revertedWith('Metadata is locked');
    });
    it('the owner cannot change the symbol when locked', async () => {
      await nToken.lockMetadata();
      const tx = nToken.setSymbol('Ͼ-2');
      await expect(tx).to.be.revertedWith('Metadata is locked');
    });
    it('the owner can lock metadata', async () => {
      expect(await nToken.isMetadataLocked()).to.be.eq(false);
      await nToken.lockMetadata();
      expect(await nToken.isMetadataLocked()).to.be.eq(true);
    });
    it('locking metadata emits the event', async () => {
      const tx = nToken.lockMetadata();
      await expect(tx)
        .to.emit(nToken, 'MetadataLocked')
        .withArgs();
    });
    it('only owner can lock metadata', async () => {
      const [, nonOwner] = await ethers.getSigners();
      const tx = nToken.connect(nonOwner).lockMetadata();
      await expect(tx).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });
});
