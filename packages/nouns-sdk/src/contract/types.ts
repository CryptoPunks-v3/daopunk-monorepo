import {
  NTokenFactory,
  NAuctionHouseFactory,
  NDescriptorFactory,
  NSeederFactory,
  NDaoLogicV1Factory,
} from '@nouns/contracts';

export interface ContractAddresses {
  nToken: string;
  nSeeder: string;
  nDescriptor: string;
  nftDescriptor: string;
  nAuctionHouse: string;
  nAuctionHouseProxy: string;
  nAuctionHouseProxyAdmin: string;
  nDaoExecutor: string;
  nDAOProxy: string;
  nDAOLogicV1: string;
}

export interface Contracts {
  nTokenContract: ReturnType<typeof NTokenFactory.connect>;
  nAuctionHouseContract: ReturnType<typeof NAuctionHouseFactory.connect>;
  nDescriptorContract: ReturnType<typeof NDescriptorFactory.connect>;
  nSeederContract: ReturnType<typeof NSeederFactory.connect>;
  nDaoContract: ReturnType<typeof NDaoLogicV1Factory.connect>;
}

export enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Kovan = 42,
  Local = 31337,
}
