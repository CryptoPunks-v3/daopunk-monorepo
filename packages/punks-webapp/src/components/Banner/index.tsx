import classes from './Banner.module.css';
import Section from '../../layout/Section';
import { Col } from 'react-bootstrap';
import punk from '../../assets/punk.png';
import Punk from '../Punk';
import { Trans } from '@lingui/macro';

const Banner = () => {
  return (
    <Section fullWidth={false} className={classes.bannerSection}>
      <Col lg={7}>
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
      <Col lg={5}>
        <div style={{ padding: '2rem' }}>
          <Punk imgPath={punk} alt="DAO Punk" />
        </div>
      </Col>
    </Section>
  );
};

export default Banner;
