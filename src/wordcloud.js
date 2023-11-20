async function filterWords(words) {
    let stopwords = await d3.json("../utils/stopwords-en.json");
    // drop words in stopwords or additonal stopwords
    // define addStopwords as ["","-"]
    const addStopwords = ["", "-", "i’m", "/", 'don’t', "'s", ":", "\"", "“", "”"];
    stopwords = stopwords.concat(addStopwords);
    // change words to lowercase when comparing
    let fwords = words.filter(d => !stopwords.includes(d.toLowerCase()));
    return fwords;
}

async function processWord(data) {
    // for each obj of data, obj.tweets is an array of tweets
    // for each tweet, tweet.cleaned_tweet is the cleaned tweet
    // concate all the cleaned tweets of each obj into an string
    let tweets = data.flatMap(obj => obj.tweets.map(tweet => tweet.cleaned_tweet));

    // Split the tweets into words
    let words = tweets.flatMap(tweet => tweet.split(/\s+/));
    let fWords = await filterWords(words);
    // Count the frequency of each word
    let wordCounts = new Map();
    fWords.forEach(word => wordCounts.set(word, (wordCounts.get(word) || 0) + 1));
    // calculate the frequency percentage
    let wordFreq = Array.from(wordCounts, ([word, count]) => ({ word: word, frequency: count / fWords.length, count: count }));
    // keep word with frequency > 0.001
    wordFreq = wordFreq.filter(d => d.frequency > 0.001);
    // sort the words by frequency
    wordFreq.sort((a, b) => b.frequency - a.frequency);
    // keep the top 30 words
    wordFreq = wordFreq.slice(0, params.top);
    return wordFreq;
}

function createWordCloud(myWords) {
    var fill = d3.scaleOrdinal(d3.schemeCategory10);

    // find the min and max frequency
    const minFreq = d3.min(myWords, d => d.frequency);
    const maxFreq = d3.max(myWords, d => d.frequency);

    width = params.width;
    height = params.height / 2;
    var layout = d3.layout.cloud()
        .size([width, height])
        .words(myWords.map(function (d) {
            return { text: d.word, size: 20 + 30 * (d.frequency - minFreq) / (maxFreq - minFreq), frequency: d.frequency, count: d.count };
        }))
        .padding(5)
        // .rotate(function () { return ~~(Math.random() * 2) * 90; })
        .rotate(function () { return 0; })
        .font("Impact")
        .fontSize(function (d) { return d.size; })
        .on("end", draw);

    layout.start();

    function draw(words) {
        words.forEach(word => {
            word.flag = 0;  // Add flag property to each word
        });

        var svg = d3.select("#wordcloud").append("svg")
            .attr("width", layout.size()[0])
            .attr("height", layout.size()[1])
            .style("border", "2px solid #1b5e20")
            .style("border-left", "1px solid #1b5e20")
            .append("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + (layout.size()[1] / 2) + ")")
        var texts = svg.selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", function (d) { return d.size + "px"; })
            .style("font-family", "Impact")
            .style("fill", function (d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .attr("transform", function (d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function (d) { return d.text; })
            .on("click", function (event, d) {
                d3.selectAll("circle").filter(function (d) {
                    return d.type === "user";
                }
                ).transition().duration(500).attr("fill", d => params.color(d.group)).attr("r", d => d.value);
                const word = d.text;
                d3.selectAll("circle").filter(function (d) {
                    return d.type === "user" && d.cleaned_tweet.includes(word);
                }).transition().duration(500).attr("fill", "white").attr("r", d => d.value * 2);

                // if (d.flag === 0) {
                //     d3.selectAll("circle").filter(function (d) {
                //         return d.type === "user" && d.cleaned_tweet.includes(word);
                //     }).transition().duration(500).attr("fill", "white").attr("r", d => d.value * 2);
                //     d.flag = 1;
                // }
                // else {
                //     d3.selectAll("circle").filter(function (d) {
                //         return d.type === "user" && d.cleaned_tweet.includes(word);
                //     }).transition().duration(500).attr("fill", d => params.color(d.group)).attr("r", d => d.value);
                //     d.flag = 0;
                // }
            });

        texts.nodes().forEach(function (node) {
            tippy(node, {
                content: `
                        <table style="text-align: left; font-size: 10px;">
                            <tr>
                                <th>${node.__data__.text}</th>
                            </tr>
                            <tr>
                                <td>Frequency</td>
                                <td>${(node.__data__.frequency * 100).toFixed(2)}%</td>
                            </tr>
                            <tr>
                                <td>Count</td>
                                <td>${node.__data__.count}</td>
                            </tr>
                        </table>
                    `,
                allowHTML: true,
            });
        });
    }
}