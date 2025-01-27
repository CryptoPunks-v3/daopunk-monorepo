import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import hardhat from 'hardhat';

const { ethers } = hardhat;

import { BigNumber as EthersBN } from 'ethers';

import {
  getSigners,
  TestSigners,
  setTotalSupply,
  populateDescriptorV2,
  deployGovAndToken,
} from '../../utils';

import { mineBlock, address, encodeParameters, advanceBlocks } from '../../utils';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  NToken,
  CryptopunksMock,
  CryptopunksVote,
  NDescriptor__factory as NDescriptorFactory,
  NDAOProxy__factory as NDaoProxyFactory,
  NDAOLogicV1,
  NDAOLogicV1__factory as NDaoLogicV1Factory,
  NDAOExecutor__factory as NDaoExecutorFactory,
} from '../../../typechain';

chai.use(solidity);
const { expect } = chai;

async function propose(proposer: SignerWithAddress) {
  targets = [account0.address];
  values = ['0'];
  signatures = ['getBalanceOf(address)'];
  callDatas = [encodeParameters(['address'], [account0.address])];

  await gov.connect(proposer).propose(targets, values, signatures, callDatas, 'do nothing');
  proposalId = await gov.latestProposalIds(proposer.address);
}

let token: NToken;
let cryptopunks: CryptopunksMock;
let cryptopunksVote: CryptopunksVote;
let deployer: SignerWithAddress;
let account0: SignerWithAddress;
let account1: SignerWithAddress;
let account2: SignerWithAddress;
let signers: TestSigners;

let gov: NDAOLogicV1;
const timelockDelay = 172800; // 2 days

const proposalThresholdBPS = 678; // 6.78%
const quorumVotesBPS = 1100; // 11%

let targets: string[];
let values: string[];
let signatures: string[];
let callDatas: string[];
let proposalId: EthersBN;

describe('NDAO#inflationHandling', () => {
  before(async () => {
    signers = await getSigners();
    deployer = signers.deployer;
    account0 = signers.account0;
    account1 = signers.account1;
    account2 = signers.account2;

    targets = [account0.address];
    values = ['0'];
    signatures = ['getBalanceOf(address)'];
    callDatas = [encodeParameters(['address'], [account0.address])];

    ({ token, cryptopunks, cryptopunksVote, gov } = await deployGovAndToken(
      deployer,
      timelockDelay,
      proposalThresholdBPS,
      quorumVotesBPS,
    ));
  });

  it('set parameters correctly', async () => {
    expect(await gov.proposalThresholdBPS()).to.equal(proposalThresholdBPS);
    expect(await gov.quorumVotesBPS()).to.equal(quorumVotesBPS);
  });

  it('returns quorum votes and proposal threshold based on Noun total supply', async () => {
    // Total Supply = 40
    await setTotalSupply(token, 40);

    await mineBlock();

    // 6.78% of 40 + 10_000 = 680.712, floored to 680
    expect(await gov.proposalThreshold()).to.equal(680);
    // 11% of 40 + 10_000 = 1104.4, floored to 1104
    expect(await gov.quorumVotes()).to.equal(1104);
  });

  it('rejects if proposing below threshold', async () => {
    // account0 has 1 token, requires 681
    await token.transferFrom(deployer.address, account0.address, 0);
    await mineBlock();
    await expect(
      gov.connect(account0).propose(targets, values, signatures, callDatas, 'do nothing'),
    ).revertedWith('NDAO::propose: proposer votes below proposal threshold');
  });

  it('allows proposing if above threshold', async () => {
    // account0 has already 1 token, requires 681
    await token.transferFrom(deployer.address, account0.address, 1);
    await token.transferFrom(deployer.address, account0.address, 2);
    // we need at least 678 + 3 votes to pass a proposal
    await cryptopunks.mintBatch(account0.address, 678);
    const tokenIds0 = [];
    for (let i = 0 ; i < 678 ; i ++) {
      tokenIds0.push(i);
    }
    await cryptopunksVote.connect(account0).delegateBatch(account0.address, tokenIds0);

    // account1 has 681 tokens
    await token.transferFrom(deployer.address, account1.address, 3);
    await token.transferFrom(deployer.address, account1.address, 4);
    await token.transferFrom(deployer.address, account1.address, 5);
    // we need at least 678 + 3 votes to pass a proposal
    await cryptopunks.mintBatch(account1.address, 678);
    const tokenIds1 = [];
    for (let i = 678 ; i < 678 + 678; i ++) {
      tokenIds1.push(i);
    }
    await cryptopunksVote.connect(account1).delegateBatch(account1.address, tokenIds1);

    // account2 has 5 tokens
    await token.transferFrom(deployer.address, account2.address, 6);
    await token.transferFrom(deployer.address, account2.address, 7);
    await token.transferFrom(deployer.address, account2.address, 8);
    await token.transferFrom(deployer.address, account2.address, 9);
    await token.transferFrom(deployer.address, account2.address, 10);

    await mineBlock();
    await propose(account0);
  });

  it('sets proposal attributes correctly', async () => {
    const proposal = await gov.proposals(proposalId);
    expect(proposal.proposalThreshold).to.equal(680);
    expect(proposal.quorumVotes).to.equal(1104);
  });

  it('returns updated quorum votes and proposal threshold when total supply changes', async () => {
    // Total Supply = 80
    await setTotalSupply(token, 80);

    // 6.78% of 80 + 10_000 = 683.424, floored to 683
    expect(await gov.proposalThreshold()).to.equal(683);
    // 11% of 80 + 10_000 = 1108.8, floored to 1108
    expect(await gov.quorumVotes()).to.equal(1108);
  });

  it('rejects proposals that were previously above proposal threshold, but due to increasing supply are now below', async () => {
    // account1 has 681 tokens, but requires 683 to pass new proposal threshold when totalSupply = 80 and threshold = 6.78%
    await expect(
      gov.connect(account1).propose(targets, values, signatures, callDatas, 'do nothing'),
    ).revertedWith('NDAO::propose: proposer votes below proposal threshold');
  });

  it('does not change previous proposal attributes when total supply changes', async () => {
    const proposal = await gov.proposals(proposalId);
    expect(proposal.proposalThreshold).to.equal(680);
    expect(proposal.quorumVotes).to.equal(1104);
  });

  it('updates for/against votes correctly', async () => {
    // Accounts voting for = 681 votes
    // forVotes should be greater than quorumVotes
    await gov.connect(account0).castVote(proposalId, 1); // 681
    await gov.connect(account1).castVote(proposalId, 1); // 681

    await gov.connect(account2).castVote(proposalId, 0); // 5

    const proposal = await gov.proposals(proposalId);
    expect(proposal.forVotes).to.equal(1362);
    expect(proposal.againstVotes).to.equal(5);
  });

  it('succeeds when for forVotes > quorumVotes and againstVotes', async () => {
    await advanceBlocks(5760);
    const state = await gov.state(proposalId);
    expect(state).to.equal(4);
  });
});
