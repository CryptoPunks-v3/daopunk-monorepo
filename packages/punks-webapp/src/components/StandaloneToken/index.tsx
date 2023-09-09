import { ImageData as data, getPunkData } from '@punks/assets';
import { buildSVG } from '@punks/sdk';
import { BigNumber as EthersBN } from 'ethers';
import { ISeed, useNSeed } from '../../wrappers/nToken';
import Punk from '../Punk';
import { Link } from 'react-router-dom';
import classes from './StandaloneToken.module.css';
import { useDispatch } from 'react-redux';
import { setOnDisplayAuctionTokenId } from '../../state/slices/onDisplayAuction';
import punkClasses from '../Punk/Token.module.css';

interface StandaloneTokenProps {
  tokenId: EthersBN;
}
interface StandaloneCircularTokenProps {
  tokenId: EthersBN;
  border?: boolean;
}

interface StandaloneTokenWithSeedProps {
  tokenId: EthersBN;
  onLoadSeed?: (seed: ISeed) => void;
  shouldLinkToProfile: boolean;
}

export const getPunk = (tokenId: string | EthersBN, seed: ISeed) => {
  const id = tokenId.toString();
  const name = `DAO Punk ${id}`;
  const description = `DAO Punk ${id} is a member of the Punkers DAO`;
  const { parts } = getPunkData(seed);
  console.log('TOKEN_ID', { seed }, { parts });
  const image = `data:image/svg+xml;base64,${btoa(buildSVG(parts, data.palette))}`;

  return {
    name,
    description,
    image,
  };
};

const StandaloneToken: React.FC<StandaloneTokenProps> = (props: StandaloneTokenProps) => {
  const { tokenId } = props;
  const seed = useNSeed(tokenId);
  const punk = seed && getPunk(tokenId, seed);

  const dispatch = useDispatch();

  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionTokenId(tokenId.toNumber()));
  };

  return (
    <Link
      to={'/punk/' + tokenId.toString()}
      className={classes.clickablePunk}
      onClick={onClickHandler}
    >
      <Punk imgPath={punk ? punk.image : ''} alt={punk ? punk.description : 'DAO Punk'} />
    </Link>
  );
};

export const StandaloneTokenCircular: React.FC<StandaloneCircularTokenProps> = (
  props: StandaloneCircularTokenProps,
) => {
  const { tokenId, border } = props;
  const seed = useNSeed(tokenId);
  const punk = seed && getPunk(tokenId, seed);

  const dispatch = useDispatch();
  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionTokenId(tokenId.toNumber()));
  };

  if (!seed || !tokenId) return <Punk imgPath="" alt="DAO Punk" />;

  return (
    <Link
      to={'/punk/' + tokenId.toString()}
      className={classes.clickablePunk}
      onClick={onClickHandler}
    >
      <Punk
        imgPath={punk ? punk.image : ''}
        alt={punk ? punk.description : 'DAO Punk'}
        wrapperClassName={punkClasses.circularTokenWrapper}
        className={border ? punkClasses.circleWithBorder : punkClasses.circular}
      />
    </Link>
  );
};

export const StandaloneTokenRoundedCorners: React.FC<StandaloneTokenProps> = (
  props: StandaloneTokenProps,
) => {
  const { tokenId } = props;
  const seed = useNSeed(tokenId);
  const punk = seed && getPunk(tokenId, seed);

  const dispatch = useDispatch();
  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionTokenId(tokenId.toNumber()));
  };

  return (
    <Link
      to={'/punk/' + tokenId.toString()}
      className={classes.clickableNoun}
      onClick={onClickHandler}
    >
      <Punk
        imgPath={punk ? punk.image : ''}
        alt={punk ? punk.description : 'DAO Punk'}
        className={punkClasses.rounded}
      />
    </Link>
  );
};

export const StandaloneTokenWithSeed: React.FC<StandaloneTokenWithSeedProps> = (
  props: StandaloneTokenWithSeedProps,
) => {
  const { tokenId, onLoadSeed, shouldLinkToProfile } = props;

  const dispatch = useDispatch();
  const seed = useNSeed(tokenId);
  const seedIsInvalid = Object.values(seed || {}).every(v => v === 0);

  console.log("StandaloneTokenWithSeed", seed)
  if (!seed || seedIsInvalid || !tokenId || !onLoadSeed) return <Punk imgPath="" alt="DAO Punk" />;

  onLoadSeed(seed);

  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionTokenId(tokenId.toNumber()));
  };

  const { image, description } = getPunk(tokenId, seed);

  const punk = <Punk imgPath={seed.accessories.length ? image : ''} alt={description} />;
  const punkWithLink = (
    <Link
      to={'/punk/' + tokenId.toString()}
      className={classes.clickablePunk}
      onClick={onClickHandler}
    >
      {punk}
    </Link>
  );
  return shouldLinkToProfile ? punkWithLink : punk;
};

export default StandaloneToken;
