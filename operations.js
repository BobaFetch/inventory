const fs = require('fs');
const { parse } = require('csv-parse');
const sql = require('mssql');
const config = require('./config');

const { addNewPart, addInventory } = require('./queries.js')
const { convertLocation, getCost, partExists, stripHyphen } = require('./utilties')

class Part {
    constructor(paPB, paNumber, paQty, paLocation, paDA, inNumber) {
        this.paPB = paPB;
        this.paRef = stripHyphen(paNumber);
        this.paNumber = paNumber;
        this.paLevel = paDA === '' ? 3 : 1;
        this.paCode = paDA === '' ? 'PRD' : 'TOP';
        this.paClass = paDA === '' ? 'DETL' : 'SELL';
        this.paLocation = convertLocation(paLocation);
        this.paQty = paQty;
        this.paCost = paDA === '' ? 0.0000 : getCost(paDA);
        this.inNumber = inNumber
    }
}

async function transferData(dataFile) {
    try {
        // connect to database
        const pool = await sql.connect(config);
        let inNumber = await pool.query('SELECT TOP 1 INNUMBER FROM InvaTable ORDER BY INNUMBER DESC')
            .then((res) => res.recordset[0].INNUMBER + 1);
        let transferCount = inNumber

        // grab inventory from extract
        fs.createReadStream(dataFile)
            .pipe(parse({delimiter: ',', from_line: 2}))
            .on('data', async (row) => {

                // csv format pbln, id, partnum, qty, loc, desc, price
                const tempPart = new Part(
                    row[0], 
                    row[1], 
                    row[2], 
                    row[3], 
                    row[5], 
                    transferCount
                )

                const isThisPartAlreadyInDB = await partExists(pool, tempPart.paRef);

                if (!isThisPartAlreadyInDB) {
                    await addNewPart(pool, tempPart)
                }

                await addInventory(pool, tempPart)
            })
            .on('end', () => {
                // do something here?
            })
            .on('error', (error) => console.log(error.message))

    } catch (err) {
        throw new Error(err)
    }
}

transferData('../../sampleData.csv')


