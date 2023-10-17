import { ethers } from 'ethers';
import { task, types } from 'hardhat/config';
import { printContractsTable } from './utils';
import probDoc from '../../punks-assets/src/config/probability.json'

// const MAX_FEE_PER_GAS =          ethers.utils.parseUnits('0.000000089', 'gwei')
// const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('0.000000012', 'gwei')
const MAX_FEE_PER_GAS =          ethers.utils.parseUnits('17', 'gwei')
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('1', 'gwei')

task('deploy-and-configure', 'Deploy and configure all contracts')
  .addFlag('startAuction', 'Start the first auction upon deployment completion')
  .addFlag('autoDeploy', 'Deploy all contracts without user interaction')
  .addFlag('updateConfigs', 'Write the deployed addresses to the SDK and subgraph configs')
  .addOptionalParam('weth', 'The WETH contract address')
  .addOptionalParam('cryptopunksVote', 'The CryptopunksVote contract address', undefined, types.string)
  .addOptionalParam('punkers', 'The punkers (creator org) address')
  .addOptionalParam(
    'auctionTimeBuffer',
    'The auction time buffer (seconds)',
    5 * 60 /* 5 minutes */,
    types.int,
  )
  .addOptionalParam('auctionReservePrice', 'The auction reserve price (wei)')
  .addOptionalParam(
    'auctionMinIncrementBidPercentage',
    'The auction min increment bid percentage (out of 100)',
  )
  .addOptionalParam(
    'auctionDuration',
    'The auction duration (seconds)',
    24 * 60 * 60 /* 24 hours */, /* DEBUG */
    types.int,
  )
  .addOptionalParam('timelockDelay', 'The timelock delay (seconds)')
  .addOptionalParam('votingPeriod', 'The voting period (blocks)')
  .addOptionalParam('votingDelay', 'The voting delay (blocks)')
  .addOptionalParam(
    'proposalThresholdBps',
    'The proposal threshold (basis points)',
    100 /* 1% */,
    types.int,
  )
  .addOptionalParam(
    'quorumVotesBps',
    'Votes required for quorum (basis points)',
    1_000 /* 10% */,
    types.int,
  )
  .setAction(async (args, { ethers, run }) => {

    const options = { maxFeePerGas: MAX_FEE_PER_GAS, maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS, }

    const [deployer] = await ethers.getSigners();
    const initialDeployerBalance = await ethers.provider.getBalance(deployer.address);

    // Deploy the NDAO contracts and return deployment information
    const contracts = await run('deploy', args);

    // Verify the contracts on Etherscan
    await run('verify-etherscan', {
      contracts,
    });

    // Populate the on-chain art
    await run('populate-descriptor', {
      nftDescriptor: contracts.NFTDescriptorV2.address,
      nDescriptor: contracts.NDescriptorV2.address,
    });

    // Populate the on-chain seeder
    await run('populate-seeder', { nSeederAddress: contracts.NSeeder.instance.address, probDoc });

    // Register OG punk hashes to make sure they will not be minted.
    // await run('register-og-punks', { nTokenAddress: contracts.NToken.instance.address });

    // Transfer ownership of all contract except for the auction house.
    // We must maintain ownership of the auction house to kick off the first auction.
    if (!args.punkers) {
      console.log(
        `Punkers address not provided. Setting to deployer (${deployer.address})...`,
      );
      args.punkers = deployer.address;
    }
    const executorAddress = contracts.NDAOExecutor.address;
    await (await contracts.NDescriptorV2.instance.transferOwnership(args.punkers, options)).wait();
//     await (await contracts.NToken.instance.transferOwnership(args.punkers, options)).wait();
    await (await contracts.NSeeder.instance.transferOwnership(args.punkers, options)).wait();
    await (await contracts.NAuctionHouseProxyAdmin.instance.transferOwnership(args.punkers, options)).wait();
    console.log(
      'Transferred ownership of the descriptor, token, and proxy admin contracts to the executor.',
    );

    // Optionally kick off the first auction and transfer ownership of the auction house
    // to the NDAO executor.
    if (args.startAuction) {
      const auctionHouse = contracts.NAuctionHouse.instance.attach(
        contracts.NAuctionHouseProxy.address,
      );
      const tx = await auctionHouse.unpause({
        gasLimit: 5_000_000,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
      });
      await tx.wait();
      await (await auctionHouse.transferOwnership(args.punkers, options)).wait();
      console.log(
        'Started the first auction and transferred ownership of the auction house to the executor.',
      );
      console.log(await auctionHouse.auction())
    }

    // Optionally write the deployed addresses to the SDK and subgraph configs.
    if (args.updateConfigs) {
      await run('update-configs', {
        contracts,
      });
    }

    printContractsTable(contracts);

    const finalDeployerBalance = await ethers.provider.getBalance(deployer.address);
    console.log("total gas cost:", initialDeployerBalance.sub(finalDeployerBalance));

    console.log('Deployment Complete.');
  });
