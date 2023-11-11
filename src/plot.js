const d3 = require('d3');
const fs = require('fs');
const path = require('path');

const { cacheDir, day, dataName } = require('./analyse.js');

async function plotWordCloud(day) {
    const data = await d3.json(path.join(cacheDir, dataName(day)));

}
// read data from cache to d3
