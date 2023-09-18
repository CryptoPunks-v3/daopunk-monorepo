import { ethers } from 'ethers';
import { task, types } from 'hardhat/config';
import { printContractsTable } from './utils';
import probDoc from '../../punks-assets/src/config/probability.json'

const MAX_FEE_PER_GAS = ethers.utils.parseUnits('0.00000008', 'gwei');
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('0.000000012', 'gwei');

task('start-auction', 'Start the auction')
  .addParam('auctionHouseAddress', 'The target auction house contract address')
  .addOptionalParam('punkers', 'The punkers (creator org) address')
  .setAction(async (args, { ethers, run }) => {

    const options = { maxFeePerGas: MAX_FEE_PER_GAS, maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS, }

    const [deployer] = await ethers.getSigners();

    const factory = await ethers.getContractFactory('NAuctionHouse');
    const auctionHouse = factory.attach(args.auctionHouseAddress);
    const tx = await auctionHouse.unpause({
      gasLimit: 5_000_000,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    });
    await tx.wait();
    console.log('The auction started');

    if (args.punkers) {
      await (await auctionHouse.transferOwnership(args.punkers, options)).wait();
    }
    console.log(
      'Started the first auction and transferred ownership of the auction house to the executor.',
    );
    console.log(await auctionHouse.auction())
  });
