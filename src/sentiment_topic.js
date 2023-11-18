function sentimentPlot(user_id) {
    // Filter Data with user_id
    let tweets = [];
    day.forEach(day => {
        const data = params.Data[day];
        const obj = data.find(obj => obj.user_id === user_id);
        if (obj) {
            tweets = tweets.concat(obj.tweets);
        }
    });
    // Prepare the data
    const data = tweets.map(tweet => ({
        date: new Date(tweet.date + ' ' + tweet.time),
        score: tweet.sentiment.score,
        comparative: tweet.sentiment.comparative
    }));

    // Set the dimensions and margins of the graph
    const margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = params.width - margin.left - margin.right,
        height = params.height - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const svg = d3.select("#sentimentplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add Y axis for score
    const y1 = d3.scaleLinear()
        .domain([d3.min(data, d => d.score), d3.max(data, d => d.score)])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y1));

    // Add Y axis for comparative
    const y2 = d3.scaleLinear()
        .domain([d3.min(data, d => d.comparative), d3.max(data, d => d.comparative)])
        .range([height, 0]);
    svg.append("g")
        .attr("transform", "translate(" + width + ", 0)")
        .call(d3.axisRight(y2));

    // Add the score line
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => x(d.date))
            .y(d => y1(d.score))
        );

    // Add the comparative line
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => x(d.date))
            .y(d => y2(d.comparative))
        );
}