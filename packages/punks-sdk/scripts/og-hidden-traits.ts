import fs from 'fs'
import path from 'path'

import { parse } from 'csv-parse'
import nameDoc from '../../punks-assets/src/config/punk_name.json'
import probDoc from '../../punks-assets/src/config/probability.json'

const fileList = [
    '0-999.csv',
    '1000-1999.csv',
    '2000-2999.csv',
    '3000-3999.csv',
    '4000-4999.csv',
    '5000-5999.csv',
    '6000-6999.csv',
    '7000-7999.csv',
    '8000-8999.csv',
    '9000-9999.csv'
]

const getAllRowsFromCSV = (fileName: string) => {
    const rows: Array<any> = []
    const filePath = path.join(__dirname, `../../punks-assets/src/config/og_punks/${fileName}`)
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(parse({ delimiter: ',', from_line: 2 }))
            .on('data', function (row: any) {
                rows.push(row)
            })
            .on('end', () => {
                resolve(rows)
            });
    })
}

const maleCoverings = [
    [[13, 40, 42], [24, 27, 34, 52]],
    [[28, 67], [61]],
    [[41], [17, 24, 34, 48, 52]],
    [[48, 54, 66], [24, 34]],
    [[56], [24, 34, 68]],
    [[59, 69], [27]],
]
const femaleCoverings = [
    [[79, 86, 88, 96, 99, 112, 121, 122, 127, 129], [125]],
    [[106], [77, 85, 108, 131]],
    [[119], [85, 128]],
    [[124], [128]],
]

async function main() {
    const values = await Promise.all(fileList.map(getAllRowsFromCSV))
    const punks = values.flat() as Array<Array<string> >
    for (let i = 0; i < punks.length; i++) {
        const punk = punks[i]
        const gender = punk[2].toLowerCase().trim()
        if (gender !== 'male' && gender !== 'female') throw new Error('Gender not found.')
        const accessories = punk[5].split('/').map(acc => acc.trim()).filter(acc => acc.length > 0)
        // global ids from probDoc
        const accessoryIds = accessories.map(accName => {
            const accEntry = Object.entries(nameDoc).find((entry: any) => entry[1].name == accName && entry[1].gender == gender)
            if(!accEntry) throw new Error('Accessory name not found.')
            return parseInt(accEntry[0])
        })
        const coverings = gender === 'male' ? maleCoverings : femaleCoverings
	let changed = false
        for (let coveringPairs of coverings) {
            for (let coveringAccId of coveringPairs[0]) {
                if (!accessoryIds.includes(coveringAccId)) {
                    continue
                }
                for (let coveredAccId of coveringPairs[1]) {
                    if (!accessoryIds.includes(coveredAccId)) {
                        continue
                    }
                    // console.log(i)
                    // console.log(accessories.join())
                    const k = accessoryIds.indexOf(coveredAccId)
                    accessories.splice(k, 1)
                    accessoryIds.splice(k, 1)
		    changed = true
                }
            }
        }
	if (changed) {
	    console.log(`${punk[0]}, ${punk[1]}, ${punk[2]}, ${punk[3]}, ${accessories.length}, ${accessories.join(' / ')}`)
	}
    }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
