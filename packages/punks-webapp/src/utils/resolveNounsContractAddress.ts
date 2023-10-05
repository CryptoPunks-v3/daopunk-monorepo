import config from '../config';

export const resolveNounContractAddress = (address: string) => {
  switch (address.toLowerCase()) {
    case config.addresses.nDAOProxy.toLowerCase():
      return 'DAOpunks Proxy';
    case config.addresses.nAuctionHouseProxy.toLowerCase():
      return 'DAOpunks Auction House Proxy';
    case config.addresses.nDaoExecutor.toLowerCase():
      return 'DAOpunks Treasury';
    default:
      return undefined;
  }
};
