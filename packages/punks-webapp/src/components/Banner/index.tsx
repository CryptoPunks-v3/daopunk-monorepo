import classes from './Banner.module.css';
import Section from '../../layout/Section';
import { Col } from 'react-bootstrap';
import punk from '../../assets/punk.png';
import Punk from '../Punk';
import { Trans } from '@lingui/macro';

const Banner = () => {
  return (
    <Section fullWidth={false} className={classes.bannerSection}>
      <Col md={6} lg={7}>
        <div className={classes.wrapper}>
          <h1>
            <Trans>ONE DAO PUNK,</Trans>
            <br />
            <Trans>EVERY DAY,</Trans>
            <br />
            <Trans>FOREVER.</Trans>
          </h1>
        </div>
      </Col>
      <Col md={6} lg={5}>
        <div className={classes.punk}>
          <Punk imgPath={punk} alt="DAO Punk" />
        </div>
      </Col>
    </Section>
  );
};

export default Banner;
