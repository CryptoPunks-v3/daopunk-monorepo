import { ethers } from 'ethers';
import { task } from 'hardhat/config'

// const MAX_FEE_PER_GAS =          ethers.utils.parseUnits('0.000000089', 'gwei')
// const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('0.000000012', 'gwei')
const MAX_FEE_PER_GAS =          ethers.utils.parseUnits('17', 'gwei')
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('1', 'gwei')

task("register-og-punks", "Register original cryptopunks for duplication check")
    .addParam('nTokenAddress', 'The target daopunks contract address')
    .setAction(async (args, { ethers, run }) => {

        const options = { maxFeePerGas: MAX_FEE_PER_GAS, maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS }

        const [deployer] = await ethers.getSigners();

        const factory = await ethers.getContractFactory('NToken');
        const nToken = factory.attach(args.nTokenAddress);
        const punkHashes = await run("create-merkle")
        console.log("register-og-punks:", punkHashes.length)

        const sliceCount = 200
        let gasUsed = 0
        let gasCost = ethers.constants.Zero
        //for(let i = 0; i < punkHashes.length; i += sliceCount) {
        for(let i = 0; i < punkHashes.length; i += sliceCount) {
            const count = (i + sliceCount) > punkHashes.length ? (punkHashes.length - i) : sliceCount
            const regRes = await (await nToken.registerOGHashes(punkHashes.slice(i, i + count), options)).wait()
            gasUsed += Number(regRes.gasUsed)
            gasCost = gasCost.add(regRes.effectiveGasPrice.mul(regRes.gasUsed))
            console.log(regRes.gasUsed, regRes.effectiveGasPrice, i, count)
        }
        console.log("register-og-punks: total gasUsed", gasUsed)
        console.log("register-og-punks: total gasCost", gasCost)
    })
