
async function addNewPart(pool, part) {
    await pool.query(`
      INSERT INTO PartTable 
      (
        PARTREF, 
        PARTNUM, 
        PALEVEL, 
        PAMAKEBUY, 
        PAPRODCODE, 
        PACLASS, 
        PAONDOCK, 
        PALOTTRACK, 
        PAAVGCOST, 
        PAUNITS, 
        PAPUNITS, 
        PAPURCONV
      )
      VALUES
        '${part.paRef}', 
        '${part.paNumber}', 
        '${part.paLevel}', 
        'M', 
        '${part.paCode}', 
        '${part.paClass}', 
        0, 
        1, 
        ${part.paCost}, 
        'EA', 
        'EA', 
        1.0000
      );
    `);
}

async function addInventory(pool, part) {
    const dateRef = new Date(Date.now());
    const lotNumber = createLotNumber(dateRef)
    
    try {
        console.log(part)
        await updateLohdTable(pool, part, lotNumber, dateRef);
        await updateLoitTable(pool, part, lotNumber, dateRef);
        await updateInvaTable(pool, part, lotNumber, dateRef);
    } catch (err) {
        console.log(err.message);
    }
}

async function updateLohdTable(pool, part, lotRef, dateRef) {
        const duplicateLotNumber = await checkLotNumber(pool, part.paPB)
        if (duplicateLotNumber) {
            return;
        } else {
            await pool.query(`
            INSERT INTO LohdTable
            (
                LOTNUMBER, 
                LOTUSERLOTID, 
                LOTUNITCOST, 
                LOTPARTREF, 
                LOTCOMMENTS, 
                LOTPDATE, 
                LOTORIGINALQTY, 
                LOTREMAININGQTY, 
                LOTLOCATION, 
                LOTUSER, 
                LOTTOTLABOR
            )
            VALUES 
            (
                '${lotRef}', 
                '${part.paPB}', 
                '${part.paCost}', 
                '${part.paRef}', 
                'NEEDS REVIEW', 
                CAST('${dateRef.toLocaleDateString()}' AS smalldatetime), 
                ${part.paQty}, 
                ${part.paQty}, 
                '${part.paLocation}', 
                'AR', 
                ${part.paQty * part.paCost}
            )
            `)
        }
}

async function updateLoitTable(pool, part, lotRef, dateRef) {
    await pool.query(`
        INSERT INTO LoitTable
        (
            LOINUMBER, 
            LOIRECORD, 
            LOITYPE, 
            LOIPARTREF, 
            LOIADATE, 
            LOIPDATE, 
            LOIQUANTITY, 
            LOICOMMENT, 
            LOIACTIVITY
        )
        VALUES 
        (
            '${lotRef}', 
            1, 
            19, 
            '${part.paRef}', 
            CAST('${dateRef.toLocaleDateString()}' AS smalldatetime ), 
            CAST('${dateRef.toLocaleDateString()}' AS smalldatetime ), 
            ${part.paQty}, 
            'Manual Inventory Adjustment', 
            ${part.inNumber}
        )
    `).catch((err) => console.log(err.message))
}

async function updateInvaTable(pool, part, lotRef, dateRef) {
    await pool.query(`
        INSERT INTO InvaTable 
        (
            INTYPE, 
            INPART, 
            INREF1, 
            INREF2, 
            INPDATE, 
            INADATE, 
            INAQTY, 
            INAMT, 
            INCREDITACCT, 
            INDEBITACCT, 
            INMOPART, 
            INMORUN, 
            INTOTMATL, 
            INTOTLABOR, 
            INTOTEXP, 
            INTOTOH, 
            INTOTHRS,
            INWIPLABACCT, 
            INWIPMATACCT, 
            INWIPOHDACCT, 
            INWIPEXPACCT, 
            INNUMBER, 
            INLOTNUMBER, 
            INUSER
        )
        VALUES
        (
            19, 
            '${part.paRef}', 
            'Manual Adjustment', 
            'NEEDS REVIEW', 
            CAST('${dateRef.toLocaleDateString()}' AS smalldatetime ), 
            CAST('${dateRef.toLocaleDateString()}' AS smalldatetime ), 
            ${part.paQty}, 
            ${part.paCost}, 
            1200, 
            4000, 
            '', 
            0, 
            0.0000, 
            0.0000, 
            0.0000, 
            0.0000, 
            0.0000, 
            '', 
            '', 
            '', 
            '', 
            ${part.inNumber}, 
            '${lotRef}', 
            'AR'
        )
    `), 
}

function createLotNumber(dateRef) {
    const epoch = dateRef.getTime().toString().split('');
    
    epoch.splice(5, 0, '-');
    epoch.splice(12, 0, '-');

    return epoch.join('');
}

async function checkLotNumber(pool, pbNum) {
    const result = await pool.query(`SELECT COUNT(LOTUSERLOTID) COUNT FROM LohdTable WHERE LOTUSERLOTID = '${pbNum}'`);

    const count = await result.recordset[0].COUNT;
    return count;

}

module.exports = {
    addNewPart,
    addInventory
}