import fs from 'fs'
import path from 'path'

import { parse } from 'csv-parse'
import nameDoc from '../../punks-assets/src/config/punk_name.json'
import probDoc from '../../punks-assets/src/config/probability.json'

import { ImageData as data, getPunkData } from '@punks/assets'
import { buildSVG } from '../src'

interface AccessoryElt {
  id: number;
  punkType: number;
}

interface Accessory {
  accType: number;
  accId: number;
}

async function main() {
  const skinTone = 0

  const accTypes = Object.keys(probDoc.acc_types)
  const exclusiveGroups = probDoc.exclusive_groups
  const accGroupByType: AccessoryElt[][] = Object.keys(probDoc.acc_types).map(accType =>
    Object
      .entries(probDoc.accessories)
      .filter(entry => entry[1].type === accType)
      .map(entry => { return { id: parseInt(entry[0]), punkType: entry[1].punk === "f" ? 1 : 0 } })
  )

  for (let i = 0 ; i < accTypes.length ; i ++) {
    jLoop:
    for (let j = 0 ; j < accTypes.length ; j ++) {
      if (i <= j) { // i covers j
        continue
      }
      for (let e of exclusiveGroups) {
        if (e.includes(accTypes[i]) && e.includes(accTypes[j])) {
          continue jLoop
        }
      }
      for (let aIdx = 0 ; aIdx < accGroupByType[i].length ; aIdx ++) {
        const a = accGroupByType[i][aIdx]
        for (let bIdx = 0 ; bIdx < accGroupByType[j].length ; bIdx ++) {
          const b = accGroupByType[j][bIdx]
          if (a.punkType != b.punkType) {
            continue
          }
          const punkType = a.punkType
          const accessories: Accessory[] = i < j ? [{accType: i, accId: aIdx}, {accType: j, accId: bIdx}] : [{accType: j, accId: bIdx}, {accType: i, accId: aIdx}]
          const seed = { punkType, skinTone, accessories }
          const { parts } = getPunkData(seed)
          const image = buildSVG(parts, data.palette)
          fs.writeFileSync(
            "./output/hidden_traits/traits_" + a.id + "-" + b.id + ".svg",
            image
          );
        }
      }
    }
  }

  for (let i = 0 ; i < accTypes.length ; i ++) {
    for (let aIdx = 0 ; aIdx < accGroupByType[i].length ; aIdx ++) {
      const a = accGroupByType[i][aIdx]
      const punkType = a.punkType
      const accessories: Accessory[] = [{accType: i, accId: aIdx}]
      const seed = { punkType, skinTone, accessories }
      const { parts } = getPunkData(seed)
      const image = buildSVG(parts, data.palette)
      fs.writeFileSync(
        "./output/hidden_traits/trait_" + a.id + ".svg",
        image
      );
    }
  }

}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})