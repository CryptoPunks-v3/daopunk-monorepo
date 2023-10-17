import { ethers } from 'ethers';
import { task } from 'hardhat/config'
import probDoc from '../../punks-assets/src/config/probability.json'

// const MAX_FEE_PER_GAS =          ethers.utils.parseUnits('0.000000089', 'gwei')
// const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('0.000000012', 'gwei')
const MAX_FEE_PER_GAS =          ethers.utils.parseUnits('17', 'gwei')
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('1', 'gwei')

task("deploy-seeder", "Deploy, configure and verify standalone Seeder contract")
    .addFlag('verify', 'To verify the contract on Etherscan')
    .setAction(async (args, { ethers, run }) => {

        const options = { maxFeePerGas: MAX_FEE_PER_GAS, maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS }

        const [deployer] = await ethers.getSigners();
        const initialDeployerBalance = await ethers.provider.getBalance(deployer.address);

        const factory = await ethers.getContractFactory('NSeeder');
        const nSeeder = await factory.deploy(options);
        console.log(`deployment transaction ${nSeeder.deployTransaction.hash}`);
        await nSeeder.deployed();
        console.log(`nSeeder contract deployed to ${nSeeder.address}`);

        await run('populate-seeder', { nSeederAddress: nSeeder.address, probDoc });

        const finalDeployerBalance = await ethers.provider.getBalance(deployer.address);
        console.log("total gas cost:", initialDeployerBalance.sub(finalDeployerBalance));

        if (args.verify) {
            await run('verify:verify', {
                name: 'NSeeder',
                instance: nSeeder,
                address: nSeeder.address,
                constructorArguments: [],
            });
        }
    })