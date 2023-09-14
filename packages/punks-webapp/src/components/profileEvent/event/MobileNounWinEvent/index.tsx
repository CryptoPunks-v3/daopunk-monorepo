import React from 'react';
import { buildEtherscanTxLink } from '../../../../utils/etherscan';
import { TokenWinEvent } from '../../../../wrappers/nActivity';
import classes from './MobileNounWinEvent.module.css';
import MobileNounActivityRow from '../../activityRow/MobileNounActivityRow';
import { CakeIcon } from '@heroicons/react/solid';
import ShortAddress from '../../../ShortAddress';
import TransactionHashPill from '../../eventData/infoPills/TransactionHashPill';

interface MobileTokenWinEventProps {
  event: TokenWinEvent;
}

const MobileNounWinEvent: React.FC<MobileTokenWinEventProps> = props => {
  const { event } = props;

  const isNounderNoun = parseInt(event.tokenId as string) % 10 === 0;
  return (
    <MobileNounActivityRow
      onClick={() => window.open(buildEtherscanTxLink(event.transactionHash), '_blank')}
      icon={
        <div className={classes.iconWrapper}>
          <CakeIcon className={classes.switchIcon} />
        </div>
      }
      primaryContent={
        <div>
          <span className={classes.bold}>DAO Punk {event.tokenId}</span>
          {isNounderNoun ? ' sent to ' : ' won by '}
          <span className={classes.bold}>
            <ShortAddress address={event.winner} />
          </span>
        </div>
      }
      secondaryContent={<TransactionHashPill transactionHash={event.transactionHash} />}
    />
  );
};

export default MobileNounWinEvent;
