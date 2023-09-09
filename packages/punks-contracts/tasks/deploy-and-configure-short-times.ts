import { task, types } from 'hardhat/config';
import { printContractsTable } from './utils';

task(
  'deploy-and-configure-short-times',
  'Deploy and configure all contracts with short gov times for testing',
)
  .addFlag('startAuction', 'Start the first auction upon deployment completion')
  .addFlag('autoDeploy', 'Deploy all contracts without user interaction')
  .addFlag('updateConfigs', 'Write the deployed addresses to the SDK and subgraph configs')
  .addOptionalParam('weth', 'The WETH contract address')
  .addOptionalParam('cryptopunksVote', 'The CryptopunksVote contract address', undefined, types.string)
  .addOptionalParam('punkers', 'The punkers (creator org) address')
  .addOptionalParam(
    'auctionTimeBuffer',
    'The auction time buffer (seconds)',
    30 /* 30 seconds */,
    types.int,
  )
  .addOptionalParam(
    'auctionReservePrice',
    'The auction reserve price (wei)',
    1 /* 1 wei */,
    types.int,
  )
  .addOptionalParam(
    'auctionMinIncrementBidPercentage',
    'The auction min increment bid percentage (out of 100)',
    2 /* 2% */,
    types.int,
  )
  .addOptionalParam(
    'auctionDuration',
    'The auction duration (seconds)',
    60 * 2 /* 2 minutes */,
    types.int,
  )
  .addOptionalParam('timelockDelay', 'The timelock delay (seconds)', 60 /* 1 min */, types.int)
  .addOptionalParam(
    'votingPeriod',
    'The voting period (blocks)',
    80 /* 20 min (15s blocks) */,
    types.int,
  )
  .addOptionalParam('votingDelay', 'The voting delay (blocks)', 1, types.int)
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
    // Deploy the NDAO contracts and return deployment information
    const contracts = await run('deploy-short-times', args);

    // Verify the contracts on Etherscan
    await run('verify-etherscan', {
      contracts,
    });

    // Populate the on-chain art
    await run('populate-descriptor', {
      nftDescriptor: contracts.NFTDescriptorV2.address,
      nDescriptor: contracts.NDescriptorV2.address,
    });

    // Transfer ownership of all contract except for the auction house.
    // We must maintain ownership of the auction house to kick off the first auction.
    const [deployer] = await ethers.getSigners();
    if (!args.punkers) {
      console.log(
        `Punkers address not provided. Setting to deployer (${deployer.address})...`,
      );
      args.punkers = deployer.address;
    }
    const executorAddress = contracts.NDAOExecutor.address;
    await contracts.NDescriptorV2.instance.transferOwnership(args.punkers);
    await contracts.NToken.instance.transferOwnership(args.punkers);
    await contracts.NSeeder.instance.transferOwnership(args.punkers);
    await contracts.NAuctionHouseProxyAdmin.instance.transferOwnership(args.punkers);
    console.log(
      'Transferred ownership of the descriptor, token, and proxy admin contracts to the executor.',
    );

    // Optionally kick off the first auction and transfer ownership of the auction house
    // to the NDAO executor.
    if (args.startAuction) {
      const auctionHouse = contracts.NAuctionHouse.instance.attach(
        contracts.NAuctionHouseProxy.address,
      );
      await auctionHouse.unpause({
        gasLimit: 1_000_000,
      });
      await auctionHouse.transferOwnership(args.punkers);
      console.log(
        'Started the first auction and transferred ownership of the auction house to the executor.',
      );
    }

    // Optionally write the deployed addresses to the SDK and subgraph configs.
    if (args.updateConfigs) {
      await run('update-configs', {
        contracts,
      });
    }

    printContractsTable(contracts);
    console.log('Deployment Complete.');
  });