import classes from './Banner.module.css';
import Section from '../../layout/Section';
import { Col } from 'react-bootstrap';
import punk from '../../assets/punk.png';
import Punk from '../Punk';
import { Trans } from '@lingui/macro';

const Banner = ({ subtitle }: { subtitle: boolean }) => {
  return (
    <Section fullWidth={false} className={classes.bannerSection}>
      <Col lg={7}>
        <div className={classes.wrapper}>
          {subtitle ? (
            <h2>DAOpunks?</h2>
          ) : (
            <h1>
              <Trans>ONE DAOPUNK,</Trans>
              <br />
              <Trans>EVERY DAY,</Trans>
              <br />
              <Trans>FOREVER.</Trans>
            </h1>
          )}
        </div>
      </Col>
      {!subtitle && (
        <Col className="d-none d-lg-block" lg={5}>
          <Punk imgPath={punk} alt="DAOpunk" />{' '}
        </Col>
      )}
    </Section>
  );
};

export default Banner;
