function sentimentPlot(userID, group) {
    // Filter Data with user_id
    let tweets = [];
    day.forEach(day => {
        const data = params.Data[day];
        const temp = data.filter(obj => userID.includes(obj.user_id));
        temp.forEach(obj => {
            // add username for each tweet
            obj.tweets.forEach(tweet => {
                tweet.username = obj.username;
                tweet.user_id = obj.user_id;
            });
            tweets = tweets.concat(obj.tweets);
        });
    });
    // Prepare the data
    let data = tweets.map(tweet => ({
        date: new Date(tweet.date + ' ' + tweet.time),
        score: tweet.sentiment.score,
        comparative: tweet.sentiment.comparative,
        tweet: tweet.tweet,
        positive: tweet.sentiment.positive,
        negative: tweet.sentiment.negative,
        replies_count: tweet.replies_count,
        retweets_count: tweet.retweets_count,
        likes_count: tweet.likes_count,
        total_count: tweet.replies_count + tweet.retweets_count + tweet.likes_count,
        username: tweet.username,
        _date: tweet.date,
        _time: tweet.time,
        tag: tweet.tag,
        type: "tweet"
    }));

    // define points radius by total_count
    if (data.length === 1) {
        data[0].r = 8;
    }
    else {
        // get the min and max total_count
        const min_total_count = d3.min(data, d => d.total_count);
        const max_total_count = d3.max(data, d => d.total_count);
        data.forEach(d => {
            d.r = 2 + 6 * (d.total_count - min_total_count) / (max_total_count - min_total_count);
        });
    }

    // sort data by date
    data.sort((a, b) => a.date - b.date);

    // Set the dimensions and margins of the graph
    const margin = { top: 30, right: 30, bottom: 40, left: 50 },
        width = params.width - margin.left - margin.right,
        height = params.height / 2 - 7 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const svg = d3.select("#sentimentplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("border", "2px solid #1b5e20")
        .style("border-left", "1px solid #1b5e20")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("text-decoration", "underline")
        .text("Sentiment Score Change");

    // Define color scale
    const color = d3.scaleOrdinal()
        .domain([0, 1, 2, 3])
        .range(["white", "blue", "red", "black"]);  // Change these colors as needed

    // Define the labels for each tag
    const labels = ["Neither", "Biden(Joe)", "Trump", "Both"];

    // Add the legend
    const legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

    // Replace the rectangles with circles
    legend.append("circle")
        .attr("cx", width - 9) // center the circle
        .attr("r", 5) // radius of the circle
        .style("fill", color)
        .style("fill-opacity", 0.5);  // Set opacity to 0.5

    // Adjust the labels
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 0) // adjust the y position to align with the circle
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .style("font-size", "10px") // reduce the font size
        .text(function (d) { return labels[d]; });

    // Add X axis
    const x = d3.scaleTime()
        // .domain(new Date(2020, 10, 20), new Date(2020, 10, 27))
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(d3.timeDay.every(1)));  // Set tick interval to one day

    // Add Y axis for score
    const y1 = d3.scaleLinear()
        .domain([d3.min(data, d => d.score), d3.max(data, d => d.score)])
        .range([height, 0]);

    // Add the score line
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke", "rgb(12, 12, 12)")
        .attr("opacity", 0.5)
        .attr("d", d3.line()
            .x(d => x(d.date))
            .y(d => y1(d.score))
        ).transition()
        .duration(1000);

    svg.append("g")
        .call(d3.axisLeft(y1))
        .call(g => g.append("text")
            .attr("x", -margin.left + 20)
            .attr("y", -margin.top / 2)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("Score"));


    // Add the data points
    const points = svg.selectAll(".point")
        .data(data)
        .join("circle")
        .attr("class", "point")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y1(d.score))
        .attr("r", d => d.r)
        .style("fill-opacity", 0.5);  // Set opacity to 0.5

    d3.selectAll("circle").filter(function (d) {
        return d.type === "tweet";
    }).attr("fill", d => color(d.tag));

    // add tooltip 
    points.nodes().forEach(function (node) {
        const theme = "transparent";
        const d = node.__data__;
        const tooltipContent = `
            <div class="post">
                <div class="post-header">
                    <span>${d.username}</span>
                    <span>${d._date.substring(5)} ${d._time}</span>
                </div>
                <div class="post-content">
                    ${d.tweet}<br>
                    <strong>Positive words:</strong> ${d.positive.join(' ')}<br>
                    <strong>Negative words:</strong> ${d.negative.join(' ')}
                </div>
                <div class="post-footer">
                    <span class="reply-count">💬 ${d.replies_count}&nbsp;&nbsp;&nbsp;</span>
                    <span class="retweet-count">🔁 ${d.retweets_count}&nbsp;&nbsp;&nbsp;</span>
                    <span class="like-count">❤️ ${d.likes_count}</span>
                </div>
            `;

        tippy(node, {
            content: tooltipContent,
            theme: theme,
            allowHTML: true,
            // hide arrow
            arrow: false,
        });
    });

}