const analyse = require('./analyse.js');
const { dataName, dataDir, cacheDir, day, processData } = require('./analyse.js');
const fs = require('fs');
const path = require('path');

// processData(day[0]);

for (let i = 1; i < day.length; i++) {
    processData(day[i]);
}