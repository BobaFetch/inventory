const fs = require('fs');
const { parse } = require('csv-parse');
const sql = require('mssql');
const config = require('./config');

const { addNewPart, addInventory } = require('./queries.js')

class Part {
    constructor(paPB, paNumber, paQty, paLocation, paDA, inNumber) {
        this.paPB = paPB;
        this.paRef = stripChars(paNumber);
        this.paNumber = paNumber;
        this.paLevel = paDA === '' ? 3 : 1;
        this.paCode = paDA === '' ? 'PRD' : 'TOP';
        this.paClass = paDA === '' ? 'DETL' : 'SELL';
        this.paLocation = stripBox(paLocation);
        this.paQty = paQty;
        this.paCost = paDA === '' ? 0.0000 : getCost(paDA);
        this.inNumber = inNumber
    }
}

async function transferData(dataFile) {
    try {
        // connect to database biatch
        const pool = await sql.connect(config);
        let inNumber = await pool.query('SELECT TOP 1 INNUMBER FROM InvaTable ORDER BY INNUMBER DESC')
            .then((res) => res.recordset[0].INNUMBER + 1);
        let transferCount = inNumber

        // grab csv of data from old MRP system
        fs.createReadStream(dataFile)
            .pipe(parse({delimiter: ',', from_line: 2}))
            .on('data', async (row) => {

                const tempPart = new Part(row[0], row[1], row[2], row[3], row[5], transferCount)
                transferCount++;

                // insert part into parttable if not exists
                await pool.query(`SELECT COUNT(PARTREF) AS count FROM PartTable WHERE PARTREF = '${tempPart.paRef}'`)
                    .then((res) => res.recordset[0].count === 1 ? null : addNewPart(pool, tempPart)).then(() => addInventory(pool, tempPart))
                    .catch((err) => console.log(err.message))
            })
            .on('end', () => {
                console.log(`Finished`)
                pool.close()
            })
            .on('error', (error) => console.log(error.message))

    } catch (err) {
        throw new Error(err)
    }
}

function stripChars(strIn) {
    const strOut = strIn.replace(/(?<=[a-zA-Z0-9])-(?=[a-zA-Z0-9])/g, '')
    
    return strOut
}

function getCost(strIn) {
    const price = strIn.replace(/[^0-9\.]/, '')
    console.log(price)
    return parseFloat(price);
}

function stripBox(strIn) {
    const spread = strIn.split('');

    for (let i = 1; i < spread.length; i++) {
        if (spread[i] === 'B' || spread[i] === 'b') {
            spread.splice(i, 1);
        }
    }

    return spread.join('');
}

transferData('../../sampleData.csv')


