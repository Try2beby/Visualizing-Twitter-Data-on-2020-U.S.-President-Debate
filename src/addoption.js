function addDayOption(svg, width, height) {
    // Define your dates
    var dates = ["20", "21", "22", "23", "24", "25"];

    // Add foreignObject to the SVG
    var foreignObject = svg.append("foreignObject")
        .attr("width", 150)
        .attr("height", 50)
        .attr("x", -width / 2) // Position at the left edge of the SVG
        .attr("y", -height / 2); // Position at the top edge of the SVG

    // Add div to the foreignObject, give it a id
    var div = foreignObject.append("xhtml:div")
        .attr("class", "options-container")
        .attr("id", "dayOption");

    // Add label
    div.append("label")
        .attr("for", "dateSelect")
        .text("Date: 2020-10-");

    // Add select element
    var select = div.append("select")
        .attr("id", "dateSelect");

    // Add options
    select.selectAll("option")
        .data(dates)
        .enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; })
        .property("selected", function (d) { return d === dates[params.day]; }); // Set the default option

    // Add event listener
    select.on("change", function () {
        var day = d3.select(this).property("value");
        // get the last number of the day
        day = day[day.length - 1];
        // update the params
        params.day = parseInt(day);
        // update the graph
        plot(day);
    });
}

function addConvThresholdInput(svg, width, height) {
    // Add foreignObject to the SVG
    var foreignObject = svg.append("foreignObject")
        .attr("width", 130)
        .attr("height", 50)
        .attr("x", -width / 2 + 150) // Position at the left edge of the SVG
        .attr("y", -height / 2); // Position at the top edge of the SVG

    // Add div to the foreignObject, give it a id
    var div = foreignObject.append("xhtml:div")
        .attr("class", "options-container")
        .attr("id", "convThresholdOption");

    // Add label
    div.append("label")
        .attr("for", "thresholdInput")
        .text("#Conv >= ");

    // Add input element
    var input = div.append("input")
        .attr("type", "text")
        .attr("id", "convThresholdInput")
        .attr("value", params.conversationThreshold)
        .style("width", "16px");

    // Add event listener
    input.on("change", function () {
        var threshold = d3.select(this).property("value");
        params.conversationThreshold = threshold;
        plotGraphWithoutReload()
    });
}

function addCountThresholdInput(svg, width, height) {
    // Add foreignObject to the SVG
    var foreignObject = svg.append("foreignObject")
        .attr("width", 150)
        .attr("height", 50)
        .attr("x", -width / 2 + 130 + 150) // Position at the left edge of the SVG
        .attr("y", -height / 2); // Position at the top edge of the SVG

    // Add div to the foreignObject, give it a id
    var div = foreignObject.append("xhtml:div")
        .attr("class", "options-container")
        .attr("id", "countThresholdOption");

    // Add label
    div.append("label")
        .attr("for", "thresholdInput")
        .text("#💬+🔁+❤️ >= ");

    // Add input element
    var input = div.append("input")
        .attr("type", "text")
        .attr("id", "countThresholdInput")
        .attr("value", params.countThreshold)
        .style("width", "16px");

    // Add event listener
    input.on("change", function () {
        var threshold = d3.select(this).property("value");
        params.countThreshold = threshold;
        plotGraphWithoutReload();
    });
}

function addTopInput(svg, width, height) {
    // Add foreignObject to the SVG
    var foreignObject = svg.append("foreignObject")
        .attr("width", 75)
        .attr("height", 50)
        .attr("x", -width / 2) // Position at the left edge of the SVG
        .attr("y", -height / 2); // Position at the top edge of the SVG

    // Add div to the foreignObject, give it a id
    var div = foreignObject.append("xhtml:div")
        .attr("class", "options-container")
        .attr("id", "topOption");

    // Add label
    div.append("label")
        .attr("for", "topInput")
        .text("#Top: ");

    // Add input element
    var input = div.append("input")
        .attr("type", "text")
        .attr("id", "topInput")
        .attr("value", params.top)
        .style("width", "16px");

    // Add event listener
    input.on("change", function () {
        var top = d3.select(this).property("value");
        params.top = top;
        updateWordCloud(params.data);
    });
}