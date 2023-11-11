const dataName = (num) => `2020-10-2${num}.json`;
let day = Array.from({ length: 6 }, (_, i) => i);
const cacheDir = "../cache/";
let stopwords = d3.json("../utils/stopwords-en.json");

async function filterWords(words) {
    let stopwords = await d3.json("../utils/stopwords-en.json");
    // drop words in stopwords or additonal stopwords
    // define addStopwords as ["","-"]
    const addStopwords = ["", "-", "i’m", "/"];
    stopwords = stopwords.concat(addStopwords);
    // change words to lowercase when comparing
    let fwords = words.filter(d => !stopwords.includes(d.toLowerCase()));
    return fwords;
}

async function plotWord() {
    d3.json(cacheDir + dataName(day[0])).then(data => {
        // use first 1000 objects for testing
        data = data.slice(0, 1000);

        // Split the tweets into words
        let words = data.flatMap(obj => obj.tweet.split(/\s+/));

        filterWords(words).then(fWords => {
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
            return wordFreq.slice(0, 20);
        }).then(data => {
            // Declare the chart dimensions and margins.
            const width = 500;
            const height = 400;
            const marginTop = 30;
            const marginRight = 0;
            const marginBottom = 30;
            const marginLeft = 80;

            // Declare the y (vertical position) scale.
            const y = d3.scaleBand()
                .domain(d3.groupSort(data, ([d]) => -d.frequency, (d) => d.word)) // descending frequency
                .range([marginTop, height - marginBottom])
                .padding(0.1);

            // Declare the x (horizontal position) scale.
            const x = d3.scaleLinear()
                .domain([0, d3.max(data, (d) => d.frequency)])
                .range([marginLeft, width - marginRight]);

            // Create the SVG container.
            const svg = d3.select('#word')
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [0, 0, width, height])
                .attr("style", "max-width: 100%; height: auto;");

            // Add a rect for each bar.
            svg.append("g")
                .attr("fill", "steelblue")
                .selectAll()
                .data(data)
                .join("rect")
                .attr("y", (d) => y(d.word))
                .attr("x", x(0))
                .attr("width", (d) => x(d.frequency) - x(0))
                .attr("height", y.bandwidth());

            // Add the word label.
            svg.append("g")
                .attr("fill", "black")
                .selectAll()
                .data(data)
                .join("text")
                .attr("x", d => x(d.frequency) - 10)
                .attr("y", d => y(d.word) + y.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .style("font-size", "6px")
                .text(d => (d.frequency * 100).toPrecision(2) + "%");

            // Add the y-axis and label.
            svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(d3.axisLeft(y).tickSizeOuter(0))
                .selectAll("text")
                .attr("transform", "rotate(-25)")
                .attr("dy", "-5px")


            // Add the x-axis and label, and remove the domain line.
            // svg.append("g")
            //     .attr("transform", `translate(0,${height - marginBottom})`)
            //     .call(d3.axisBottom(x).tickFormat((x) => (x * 100).toPrecision(2) + "%"))
            //     // .call(d3.axisBottom(x))
            //     .call(g => g.select(".domain").remove())
            //     .call(g => g.append("text")
            //         .attr("x", width - marginRight)
            //         .attr("y", -10)
            //         .attr("fill", "currentColor")
            //         .attr("text-anchor", "end")
            //         .text("→ Frequency (%)"));

        });
    });
}

plotWord();




