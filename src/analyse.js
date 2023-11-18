const path = require("path");
const fs = require("fs");
const curDir = path.resolve(__dirname);
const rootDir = path.resolve(__dirname, "../");
const dataDir = path.resolve(__dirname, "../rawdata");
const cacheDir = path.resolve(__dirname, "../cache");

const dataName = (num) => `2020-10-2${num}.json`;
let day = Array.from({ length: 6 }, (_, i) => i);
// mentions, reply_to
const useColumns = ["id", "conversation_id", "date", "time", "user_id", "username",
    "tweet", "language", "hashtags",
    "mentions", "reply_to", "quote_url",
    "replies_count", "retweets_count", "likes_count"];


// const clearnDataRules = [cleanData, cleanTweet, addTags, languageFilter, translates];
const cleanDataRules = [cleanData, cleanTweet, addTags, languageFilter, getQuote];

async function processData(day) {
    console.log(`processing data for day ${day}`);

    let data = await loadJsonFile(dataDir, dataName(day));
    data = cleanDataRules.reduce((data, rule) => rule(data), data);
    console.log(`data length after cleaning: ${data.length}`);
    // save cleaned data to cache
    let cachePath = path.join(cacheDir, dataName(day));
    fs.promises.writeFile(cachePath, JSON.stringify(data), "utf8");
    console.log(`data saved to ${cachePath}`);
}

async function loadJsonFile(dataDir, dataName) {
    const filepath = path.join(dataDir, dataName);
    const content = fs.readFileSync(filepath, "utf8");
    const jsonStrings = content.split("\n");
    // if the last line is empty, remove it
    if (jsonStrings[jsonStrings.length - 1] === "") {
        jsonStrings.pop();
    }
    let data = jsonStrings.map((str) => JSON.parse(str));
    return data;
}

function getQuote(data) {
    // get quote from quote_url
    data = data.map((obj) => {
        if (obj.quote_url) {
            obj.quote = obj.quote_url.split("/").pop();
        }
        return obj;
    });
    return data
}

function cleanData(data, use_columns = useColumns) {
    let cleanData = data.map((obj) => {
        let newObj = {};
        use_columns.map((col) => {
            newObj[col] = obj[col];
        });
        return newObj;
    });
    // drop duplicates
    cleanData = cleanData.filter((obj, index, self) =>
        index === self.findIndex((t) => (
            t.id === obj.id
        ))
    );
    // drop tweets without text
    cleanData = cleanData.filter((obj) => obj.tweet);

    return cleanData;
}

function cleanTweet(data) {
    // remove retweet, @, url, newline,".","?","!",",","&amp;","2020",hashtags, "“"，"”" 
    data = data.map((obj) => {
        obj.cleaned_tweet = obj.tweet.replace(/RT @[\w]*:/g, " ") // remove retweet
            .replace(/@[\w]*/g, " ") // remove @
            .replace(/https?:\/\/[A-Za-z0-9./]*/g, " ")  // remove url
            .replace(/\n/g, " ")    // remove newline
            .replace(/\./g, " ")    // remove .
            .replace(/\?/g, " ")    // remove ?
            .replace(/!/g, " ")    // remove !
            .replace(/,/g, " ")    // remove ,
            .replace(/&amp;/g, " ")    // remove &amp;
            .replace(/2020/g, " ")    // remove 2020
            .replace(/#[\w]*/g, " ")    // remove hashtags
            .replace(/“/g, " ")    // remove “
            .replace(/”/g, " ")    // remove ”
            .replace(/"/g, " ");    // remove "



        return obj;
    });
    return data;
}

function addTags(data) {
    data = data.map((obj) => {
        let tag = 0;
        if (obj["tweet"].toLowerCase().includes("biden") || obj["tweet"].toLowerCase().includes("joe")) {
            if (obj["tweet"].toLowerCase().includes("trump")) {
                tag = 3;
            } else {
                tag = 1;
            }
        } else if (obj["tweet"].toLowerCase().includes("trump")) {
            tag = 2;
        }
        obj["tag"] = tag;
        return obj;
    });
    return data;
}

function languageFilter(data, threshold = 100) {
    // count the number of tweets in each language
    let languageCount = {};
    data.forEach(row => {
        if (languageCount[row['language']]) {
            languageCount[row['language']]++;
        } else {
            languageCount[row['language']] = 1;
        }
    });

    // select languages with more than threshold tweets
    let languageList = [];
    for (let language in languageCount) {
        if (languageCount[language] > threshold) {
            languageList.push(language);
        }
    }

    // select tweets with language in languageList
    data = data.filter(row => languageList.includes(row['language']));
    return data;
}


function translates(data) {
    data = data.map(async (obj) => {
        if (obj.language !== 'en') {
            try {
                let res = await translate(obj.tweet, { to: 'en' });
                obj.tweet = res.text;
            } catch (err) {
                console.error(err);
            }
        }
        return obj;
    });
    return Promise.all(data);
}


// export functions
module.exports = {
    cleanDataRules,
    dataDir,
    cacheDir,
    dataName,
    day,
    useColumns,
    cleanData,
    cleanTweet,
    addTags,
    languageFilter,
    translates,
    loadJsonFile,
    processData,
    getQuote
};