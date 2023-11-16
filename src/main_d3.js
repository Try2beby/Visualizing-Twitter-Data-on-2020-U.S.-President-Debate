const dataName = (num) => `2020-10-2${num}.json`;
const day = Array.from({ length: 6 }, (_, i) => i);
const cacheDir = "../cache/";
let stopwords = d3.json("../utils/stopwords-en.json");
let params = {};
params.width = 500;
params.height = 500;
params.conversationThreshold = 50;
params.countThreshold = 5;
params.top = 30;
params.day = 0;
params.data = NaN;
params.Data = [];
params.DataReady = false;
params.fromDate = false;
params.fromTime = false;
params.toDate = false;
params.toTime = false;