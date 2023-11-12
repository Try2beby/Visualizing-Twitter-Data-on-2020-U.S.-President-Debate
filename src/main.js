const analyse = require('./analyse.js');
const { dataName, dataDir, day } = require('./analyse.js');

analyse.loadJsonFile(dataDir, dataName(day[0])).then(data => {
    // filter all objects with id == conversation_id
    let df = data.filter(obj => obj.id === obj.conversation_id);

});
