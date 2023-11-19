const path = require("path");
const fs = require("fs");

const Sentiment = require("sentiment");
const sentiment = new Sentiment();

const natural = require('natural');
const TfIdf = natural.TfIdf;

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

const cleanDataRules = [cleanData, cleanTweet, addTags, sentimentAnalysis, topicExtraction, languageFilter, getQuote, groupData];

function processData(day) {
    console.log(`processing data for day ${day}`);
    loadJsonFile(dataDir, dataName(day)).then((data) => {
        data = cleanDataRules.reduce((data, rule) => rule(data), data);
        console.log(`data length after cleaning: ${data.length}`);
        // save cleaned data to cache
        let cachePath = path.join(cacheDir, dataName(day));
        fs.writeFileSync(cachePath, JSON.stringify(data));
        console.log(`data saved to ${cachePath}`);
    });
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

function sentimentAnalysis(data) {
    console.log("analysing sentiment");
    data = data.map((obj) => {
        obj.sentiment = sentiment.analyze(obj.tweet);
        return obj;
    });
    return data;
}

function topicExtraction(data) {
    // console.log("extracting topics from tweets");
    // const tfidf = new TfIdf();
    // data.forEach((obj) => {
    //     tfidf.addDocument(obj.cleaned_tweet);
    // });

    // data.forEach((obj, i) => {
    //     console.log(`extracting topics from tweet ${i}`);
    //     const terms = tfidf.listTerms(i);
    //     if (terms.length > 0) {
    //         obj.tfidf = { term: terms[0].term, tfidf: terms[0].tfidf };
    //     } else {
    //         obj.tfidf = null;
    //     }
    // });

    return data;
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
            .replace(/"/g, " ")   // remove "
            .toLowerCase();     // change to lowercase

        return obj;
    });
    return data;
}

function groupData(data) {
    // group data by user_id
    let groupedData = data.reduce((acc, obj) => {
        let group = acc.find(item => item.user_id === obj.user_id);
        if (!group) {
            group = {
                user_id: obj.user_id,
                username: obj.username,
                tweets: []
            };
            acc.push(group);
        }
        let tweet = {
            tweet_id: obj.id,
            tweet: obj.tweet,
            cleaned_tweet: obj.cleaned_tweet,
            date: obj.date,
            time: obj.time,
            replies_count: obj.replies_count,
            retweets_count: obj.retweets_count,
            likes_count: obj.likes_count,
            mentions: obj.mentions,
            reply_to: obj.reply_to,
            quote: obj.quote ? parseInt(obj.quote, 10) : null,
            sentiment: obj.sentiment,
            tag: obj.tag
        };
        group.tweets.push(tweet);
        return acc;
    }, []);
    return groupedData;
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