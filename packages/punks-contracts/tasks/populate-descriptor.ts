import { ethers } from 'ethers';
import { task, types } from 'hardhat/config';
import ImageData from '../files/image-data-v2.json';
import { dataToDescriptorInput } from './utils';

const MAX_FEE_PER_GAS = ethers.utils.parseUnits('0.00000008', 'gwei');
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('0.000000012', 'gwei');

task('populate-descriptor', 'Populates the descriptor with color palettes and Punk parts')
  .addOptionalParam(
    'nftDescriptor',
    'The `NFTDescriptorV2` contract address',
    '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9',
    types.string,
  )
  .addOptionalParam(
    'nDescriptor',
    'The `NDescriptorV2` contract address',
    '0x5fc8d32690cc91d4c39d9d3abcbd16989f875707',
    types.string,
  )
  .setAction(async ({ nftDescriptor, nDescriptor }, { ethers, network }) => {

    const options = { gasLimit: network.name === 'hardhat' ? 30000000 : undefined, maxFeePerGas: MAX_FEE_PER_GAS, maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS, };

    const descriptorFactory = await ethers.getContractFactory('NDescriptorV2', {
      libraries: {
        NFTDescriptorV2: nftDescriptor,
      },
    });
    const descriptorContract = descriptorFactory.attach(nDescriptor);

    const { palette, images } = ImageData;
    const { types, necks, cheekses, faces, beards, mouths, earses, hats, helmets, hairs, teeths, lipses, emotions, eyeses, glasseses, goggleses, noses } = images;

    const typesPage = dataToDescriptorInput(types.map(({ data }) => data));
    const necksPage = dataToDescriptorInput(necks.map(({ data }) => data));
    const cheeksesPage = dataToDescriptorInput(cheekses.map(({ data }) => data));
    const facesPage = dataToDescriptorInput(faces.map(({ data }) => data));
    const beardsPage = dataToDescriptorInput(beards.map(({ data }) => data));
    const mouthsPage = dataToDescriptorInput(mouths.map(({ data }) => data));
    const earsesPage = dataToDescriptorInput(earses.map(({ data }) => data));
    const hatsPage = dataToDescriptorInput(hats.map(({ data }) => data));
    const helmetsPage = dataToDescriptorInput(helmets.map(({ data }) => data));
    const hairsPage = dataToDescriptorInput(hairs.map(({ data }) => data));
    const teethsPage = dataToDescriptorInput(teeths.map(({ data }) => data));
    const lipsesPage = dataToDescriptorInput(lipses.map(({ data }) => data));
    const emotionsPage = dataToDescriptorInput(emotions.map(({ data }) => data));
    const eyesesPage = dataToDescriptorInput(eyeses.map(({ data }) => data));
    const glassesesPage = dataToDescriptorInput(glasseses.map(({ data }) => data));
    const gogglesesPage = dataToDescriptorInput(goggleses.map(({ data }) => data));
    const nosesPage = dataToDescriptorInput(noses.map(({ data }) => data));

    let tx = await descriptorContract.setPalette(0, `0x00000000${palette.join('')}`, options);
    console.log(`setPalette() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addPunkTypes(
      typesPage.encodedCompressed,
      typesPage.originalLength,
      typesPage.itemCount,
      options,
    );
    console.log(`addPunkTypes() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addNecks(
      necksPage.encodedCompressed,
      necksPage.originalLength,
      necksPage.itemCount,
      options,
    );
    console.log(`addNecks() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addCheekses(
      cheeksesPage.encodedCompressed,
      cheeksesPage.originalLength,
      cheeksesPage.itemCount,
      options,
    );
    console.log(`addCheekses() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addFaces(
      facesPage.encodedCompressed,
      facesPage.originalLength,
      facesPage.itemCount,
      options,
    );
    console.log(`addFaces() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addBeards(
      beardsPage.encodedCompressed,
      beardsPage.originalLength,
      beardsPage.itemCount,
      options,
    );
    console.log(`addBeards() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addMouths(
      mouthsPage.encodedCompressed,
      mouthsPage.originalLength,
      mouthsPage.itemCount,
      options,
    );
    console.log(`addMouths() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addEarses(
      earsesPage.encodedCompressed,
      earsesPage.originalLength,
      earsesPage.itemCount,
      options,
    );
    console.log(`addEarses() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addHats(
      hatsPage.encodedCompressed,
      hatsPage.originalLength,
      hatsPage.itemCount,
      options,
    );
    console.log(`addHats() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addHelmets(
      helmetsPage.encodedCompressed,
      helmetsPage.originalLength,
      helmetsPage.itemCount,
      options,
    );
    console.log(`addHelmets() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addHairs(
      hairsPage.encodedCompressed,
      hairsPage.originalLength,
      hairsPage.itemCount,
      options,
    );
    console.log(`addHairs() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addTeeths(
      teethsPage.encodedCompressed,
      teethsPage.originalLength,
      teethsPage.itemCount,
      options,
    );
    console.log(`addTeeths() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addLipses(
      lipsesPage.encodedCompressed,
      lipsesPage.originalLength,
      lipsesPage.itemCount,
      options,
    );
    console.log(`addLipses() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addEmotions(
      emotionsPage.encodedCompressed,
      emotionsPage.originalLength,
      emotionsPage.itemCount,
      options,
    );
    console.log(`addEmotions() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addEyeses(
      eyesesPage.encodedCompressed,
      eyesesPage.originalLength,
      eyesesPage.itemCount,
      options,
    );
    console.log(`addEyeses() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addGlasseses(
      glassesesPage.encodedCompressed,
      glassesesPage.originalLength,
      glassesesPage.itemCount,
      options,
    );
    console.log(`addGlasseses() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addGoggleses(
      gogglesesPage.encodedCompressed,
      gogglesesPage.originalLength,
      gogglesesPage.itemCount,
      options,
    );
    console.log(`addGoggleses() tx hash ${tx.hash}`);
    await tx.wait();

    tx = await descriptorContract.addNoses(
      nosesPage.encodedCompressed,
      nosesPage.originalLength,
      nosesPage.itemCount,
      options,
    );
    console.log(`addNoses() tx hash ${tx.hash}`);
    await tx.wait();

    

    console.log('Descriptor populated with palettes and parts.');
  });
