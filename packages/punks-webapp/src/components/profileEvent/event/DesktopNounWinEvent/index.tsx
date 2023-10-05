import React from 'react';
import { buildEtherscanAddressLink, buildEtherscanTxLink } from '../../../../utils/etherscan';
import { TokenWinEvent } from '../../../../wrappers/nActivity';
import classes from './DesktopNounWinEvent.module.css';
import DesktopNounActivityRow from '../../activityRow/DesktopNounActivityRow';
import { CakeIcon } from '@heroicons/react/solid';
import ReactTooltip from 'react-tooltip';
import ShortAddress from '../../../ShortAddress';
import TransactionHashPill from '../../eventData/infoPills/TransactionHashPill';
import { Trans } from '@lingui/macro';

interface DesktopNounWinEventProps {
  event: TokenWinEvent;
}

const DesktopNounWinEvent: React.FC<DesktopNounWinEventProps> = props => {
  const { event } = props;

  const isNounderNoun = parseInt(event.tokenId as string) % 10 === 0;
  return (
    <DesktopNounActivityRow
      icon={
        <div className={classes.switchIconWrapper}>
          <CakeIcon className={classes.switchIcon} />
        </div>
      }
      primaryContent={
        <>
          <ReactTooltip
            id={'view-on-etherscan-tooltip'}
            effect={'solid'}
            className={classes.delegateHover}
            getContent={() => <Trans>View on Etherscan</Trans>}
          />
          {
            <div>
              <span className={classes.bold}>DAOpunk {event.tokenId}</span>
              {isNounderNoun ? ' sent to ' : ' won by '}
              <span
                data-tip={`View on Etherscan`}
                onClick={() => window.open(buildEtherscanAddressLink(event.winner), '_blank')}
                data-for="view-on-etherscan-tooltip"
                className={classes.address}
              >
                <ShortAddress address={event.winner} />
              </span>
            </div>
          }
        </>
      }
      secondaryContent={
        <>
          <ReactTooltip
            id={'view-on-etherscan-txn-tooltip'}
            effect={'solid'}
            className={classes.delegateHover}
            getContent={() => <Trans>View on Etherscan</Trans>}
          />
          <div
            onClick={() => window.open(buildEtherscanTxLink(event.transactionHash), '_blank')}
            data-tip={`View on Etherscan`}
            data-for="view-on-etherscan-txn-tooltip"
          >
            <TransactionHashPill transactionHash={event.transactionHash} />
          </div>
        </>
      }
    />
  );
};

export default DesktopNounWinEvent;
