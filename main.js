const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    function toSeconds(timeStr) {
        let [time, modifier] = timeStr.trim().split(" ");
        let [hours, minutes, seconds] = time.split(":").map(Number);

        if (modifier.toLowerCase() === "pm" && hours !== 12) hours += 12;
        if (modifier.toLowerCase() === "am" && hours === 12) hours = 0;

        return hours * 3600 + minutes * 60 + seconds;
    }

    function toHMS(totalSeconds) {
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    let startSec = toSeconds(startTime);
    let endSec = toSeconds(endTime);
    if (endSec < startSec) endSec += 24 * 3600;

    return toHMS(endSec - startSec);
}

 

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
   function toSeconds(timeStr) {
        let [time, modifier] = timeStr.trim().split(" ");
        let [hours, minutes, seconds] = time.split(":").map(Number);

        if (modifier.toLowerCase() === "pm" && hours !== 12) hours += 12;
        if (modifier.toLowerCase() === "am" && hours === 12) hours = 0;
        return hours * 3600 + minutes * 60 + seconds;
    }

    function toHMS(totalSeconds) {
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    let startSec = toSeconds(startTime);
    let endSec = toSeconds(endTime);

    if (endSec < startSec) endSec += 24 * 3600;

    const deliveryStart = 8 * 3600;   
    const deliveryEnd = 22 * 3600;    

    let idle = 0;

    if (startSec < deliveryStart) {
        idle += Math.min(deliveryStart - startSec, endSec - startSec);
    }

    if (endSec > deliveryEnd) {
        idle += endSec - Math.max(startSec, deliveryEnd);
    }

    return toHMS(idle);
}



// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    function toSeconds(timeStr) {
        let [hours, minutes, seconds] = timeStr.split(":").map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }

    function toHMS(totalSeconds) {
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    let shiftSec = toSeconds(shiftDuration);
    let idleSec = toSeconds(idleTime);

    let activeSec = shiftSec - idleSec;
    if (activeSec < 0) activeSec = 0; 

    return toHMS(activeSec);
}


// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
function toSeconds(timeStr) {
        let [hours, minutes, seconds] = timeStr.split(":").map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }

 
    let activeSec = toSeconds(activeTime);


    const normalQuota = 8 * 3600 + 24 * 60; 
    const eidQuota = 6 * 3600;              

    let quota = normalQuota;
    if (date === "2025-04-15") {
        quota = eidQuota;
    }

    return activeSec >= quota;
}




// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
let shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    let idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    let activeTime = getActiveTime(shiftDuration, idleTime);
    let metQuotaFlag = metQuota(shiftObj.date, activeTime);
    let hasBonus = false; 

    let newRow = [
        shiftObj.driverID,
        shiftObj.driverName,
        shiftObj.date,
        shiftObj.startTime,
        shiftObj.endTime,
        shiftDuration,
        idleTime,
        activeTime,
        metQuotaFlag,
        hasBonus
    ].join(",");

    let data = fs.readFileSync(textFile, "utf-8").trim().split("\n");

    data.push(newRow);

    fs.writeFileSync(textFile, data.join("\n"), "utf-8");

    return {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration,
        idleTime,
        activeTime,
        metQuota: metQuotaFlag,
        hasBonus
    };
}



// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    let data = fs.readFileSync(textFile, "utf-8").trim().split("\n");

    let header = data[0];
    let rows = data.slice(1);
   
    for (let i = 0; i < rows.length; i++) {
        let cols = rows[i].split(",");

        let id = cols[0];
        let recordDate = cols[2];

        if (id === driverID && recordDate === date) {
            cols[9] = newValue;
            rows[i] = cols.join(",");
        }
    }

   
    let output = [header, ...rows].join("\n");
    fs.writeFileSync(textFile, output, "utf-8");
}



// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
 month = month.toString().padStart(2, "0");


    let data = fs.readFileSync(textFile, "utf-8").trim().split("\n");

    
    let rows = data.slice(1);

    let count = 0;

    for (let row of rows) {
        let cols = row.split(",");
        let id = cols[0];
        let date = cols[2];
        let hasBonus = cols[9] === "true";

 
        let recordMonth = date.split("-")[1];

        if (id === driverID && recordMonth === month && hasBonus) {
            count++;
        }
    }

    return count;
}



// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {

    month = month.toString().padStart(2, "0");

    let data = fs.readFileSync(textFile, "utf-8").trim().split("\n");

    let rows = data.slice(1);
    function toSeconds(timeStr) {
        let [hours, minutes, seconds] = timeStr.split(":").map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }


    function toHMS(totalSeconds) {
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    let totalSeconds = 0;

    for (let row of rows) {
        let cols = row.split(",");
        let id = cols[0];
        let date = cols[2];
        let activeTime = cols[7];
       
        let recordMonth = date.split("-")[1];

        if (id === driverID && recordMonth === month) {
            totalSeconds += toSeconds(activeTime);
        }
    }

    return toHMS(totalSeconds);
}



// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================


function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    month = month.toString().padStart(2, "0");

    let data = fs.readFileSync(textFile, "utf-8").trim().split("\n");
    let rows = data.slice(1);

    function toSeconds(timeStr) {
        let [hours, minutes, seconds] = timeStr.split(":").map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }

    function toHMS(totalSeconds) {
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    const normalQuota = 8 * 3600 + 24 * 60; 
    const eidQuota = 6 * 3600;              

    let totalRequired = 0;

    for (let row of rows) {
        let cols = row.split(",");
        let id = cols[0];
        let date = cols[2];

        if (id === driverID) {
            let recordMonth = date.split("-")[1];
            if (recordMonth === month) {
                let quota = (date === "2025-04-15") ? eidQuota : normalQuota;
                totalRequired += quota;
            }
        }
    }


    totalRequired -= bonusCount * 3600;
    if (totalRequired < 0) totalRequired = 0;

    return toHMS(totalRequired);
}



// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    function toSeconds(timeStr) {
        let [hours, minutes, seconds] = timeStr.split(":").map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }

    let data = fs.readFileSync(rateFile, "utf-8").trim().split("\n");
    let rows = data.slice(1); // skip header if present

    let basePay = 0;
    let tier = 0;

    for (let row of rows) {
        let cols = row.split(",");
        if (cols[0] === driverID) {
            // Format: driverID,basePay,tier
            basePay = parseFloat(cols[1]);
            tier = parseInt(cols[2]);
            break;
        }
    }

    let actualSec = toSeconds(actualHours);
    let requiredSec = toSeconds(requiredHours);

    let actualHoursNum = actualSec / 3600;
    let requiredHoursNum = requiredSec / 3600;

    // Calculate missing hours
    let missingHours = requiredHoursNum - actualHoursNum;
    if (missingHours < 0) missingHours = 0;

    // Tier allowances
    let allowance = 0;
    if (tier === 1) allowance = 50;
    else if (tier === 2) allowance = 20;
    else if (tier === 3) allowance = 10;
    else if (tier === 4) allowance = 3;

    // Apply allowance
    missingHours -= allowance;
    if (missingHours < 0) missingHours = 0;

    // Deduction formula
    let deductionRatePerHour = Math.floor(basePay / 185);
    let salaryDeduction = missingHours * deductionRatePerHour;

    let netPay = basePay - salaryDeduction;
    if (netPay < 0) netPay = 0;

    return netPay.toFixed(2);
}


module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
