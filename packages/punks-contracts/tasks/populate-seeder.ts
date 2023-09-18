import { ethers } from 'ethers';
import { task, types } from 'hardhat/config'

const shortPunkType: any = {
    male: "m",
    female: "f",
    alien: "l",
    ape: "p",
    zombie: "z",
}

const MAX_FEE_PER_GAS = ethers.utils.parseUnits('0.00000008', 'gwei');
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('0.000000012', 'gwei');

task("populate-seeder", "Initialize deployed smart contracts")
    // .addOptionalParam('nToken', 'The NToken contract address')
    // .addOptionalParam('nSeeder', 'The NSeeder contract address')
    // .addOptionalParam('probDoc', 'The Probability config')
    .setAction(async({ nSeeder, probDoc }, { ethers, run, network }) => {

        const options = { maxFeePerGas: MAX_FEE_PER_GAS, maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS, }

        const typeProbabilities =
        Object.values(probDoc.probabilities)
            .map((probObj: any) => Math.floor(probObj.probability * 1000))
        const typeTx = await nSeeder.setTypeProbability(typeProbabilities, options)
        console.log(`typeTx hash ${typeTx.hash}`)
        const typeResponse = await typeTx.wait()
        console.log("setTypeProbability", typeProbabilities)
                                                          
        for(let [i, type] of Object.keys(probDoc.probabilities).entries()) {
            const skinProbabilities = 
                probDoc.probabilities[type].skin
                    .map((value: any) => Math.floor(value * 1000))
            const skinTx = await nSeeder.setSkinProbability(i, skinProbabilities, options)
            console.log(`skinTx hash ${skinTx.hash}`)
            const skinResponse = await skinTx.wait()
            console.log("setSkinProbability", skinProbabilities)
        }

        for(let [i, type] of Object.keys(probDoc.probabilities).entries()) {
            const accCountProbabilities =
                probDoc.probabilities[type].accessory_count_probabbilities
                    .map((value: any) => Math.floor(value * 1000))
            const accCountTx = await nSeeder.setAccCountProbability(i, accCountProbabilities, options)
            console.log(`accCountTx hash ${accCountTx.hash}`)
            const accCountResponse = await accCountTx.wait()
            console.log("setAccCountProbability", accCountProbabilities)
        }

        const accTypeCount = Object.keys(probDoc.acc_types).length

        const accCountPerType = probDoc.types.map((punkType: string) =>
            Object.keys(probDoc.acc_types).map(type => 
                Object.values(probDoc.accessories).filter((item: any) => item.type == type && item.punk.split("").includes(shortPunkType[punkType])).length
            )
        )
        console.log("accCountPerType", accCountPerType)
//         const accCountSetResponse = await (await nSeeder.setAccCountPerTypeAndPunk(accCountPerType)).wait()

        // a check
        for (const [punkType, probObj] of Object.entries(probDoc.probabilities)) {
            const punkTypeIndex = Object.values(probDoc.types).indexOf(punkType)
            for (const acc of (probObj as any).accessories) {
                const typeIndex = Object.keys(probDoc.acc_types).indexOf(acc)
                if (typeIndex < 0)
                    throw new Error(`Unknown type found in type availability - ${punkType} ${acc}`)
                if (accCountPerType[punkTypeIndex][typeIndex] == 0)
                    throw new Error(`Zero count of an available accessory - ${punkType} ${acc}`)
            }
            for (const typeIndex in accCountPerType[punkTypeIndex]) {
                if (accCountPerType[punkTypeIndex][typeIndex] > 0) {
                    const acc = Object.keys(probDoc.acc_types)[~~typeIndex]
                    if (Object.values((probObj as any).accessories).indexOf(acc) < 0) {
                        throw new Error(`Non zero count of an unavailable accessory - ${punkType} ${acc}`)
                    }
                }
            }
        }

        const accIdPerType = probDoc.types.map((punkType: string) =>
            Object.keys(probDoc.acc_types).map(type =>
                Object.values(probDoc.accessories)
                    .filter((item: any) => item.type == type)
                    .map((item: any, idx: number) => [item.punk.split("").includes(shortPunkType[punkType]), idx])
                    .filter((entry: any) => entry[0])
                    .map((entry: any) => entry[1])
            )
        )
        console.log("accIdPerType", accIdPerType);
        const accWeightPerType = probDoc.types.map((punkType: string) =>
            Object.keys(probDoc.acc_types).map(type =>
                Object.values(probDoc.accessories).filter((item: any) => item.type == type)
                    .map((item: any) => [item.punk.split("").includes(shortPunkType[punkType]), item.weight])
                    .filter((entry: any) => entry[0])
                    .map((entry: any) => entry[1])
            )
        )
        const accIdSetTx = await nSeeder.setAccIdByType(accIdPerType, accWeightPerType, options)
        console.log(`accIdSetTx hash ${accIdSetTx.hash}`)
        const accIdSetResponse = await accIdSetTx.wait()
        console.log("accWeightPerType", accWeightPerType);

        const accExclusion = Array()
        for (let i = 0 ; i < accTypeCount ; i ++) {
          accExclusion.push(1 << i)
        }
        probDoc.exclusive_groups.forEach( (group: any) => {
            const groupExclusion = group.reduce( (groupExclusion: number, accType: string) => {
                const accTypeIndex = Object.keys(probDoc.acc_types).indexOf(accType)
                if (accTypeIndex < 0) throw new Error(`Unknown type found in exclusive groups - ${accType}`)
                groupExclusion = groupExclusion | (1 << accTypeIndex)
                return groupExclusion
            }, 0)
            group.forEach( (accType: string) => {
                const accTypeIndex = Object.keys(probDoc.acc_types).indexOf(accType)
                if (accTypeIndex < 0) throw new Error(`Unknown type found in exclusive groups - ${accType}`)
                accExclusion[accTypeIndex] = accExclusion[accTypeIndex] | groupExclusion;
            })
        })
        const exclusionTx = await nSeeder.setAccExclusion(accExclusion, options)
        console.log(`exclusionTx hash ${exclusionTx.hash}`)
        const exclusionResponse = await exclusionTx.wait()
        console.log("setAccExclusion", accExclusion)

        // for(let i = 0; i < 100; i ++) {
        //     const seed = await nSeeder.generateSeed(i)
        //     console.log(seed)
        //     console.log("---")
        // }

    })