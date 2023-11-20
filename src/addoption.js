function addDayOption() {
    // Define your dates
    var dates = ["20", "21", "22", "23", "24", "25"];

    // Select the container
    var div = d3.select("#forcegraph-options");

    // create a new div for the select
    div.append("div")
        .attr("id", "dateSelectDiv")
        .attr("class", "option-div");

    div = d3.select("#dateSelectDiv");

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
        plot();
    });
}

function addConvThresholdInput() {
    // Select the container
    var div = d3.select("#forcegraph-options");

    // create a new div
    div.append("div")
        .attr("id", "convThresholdDiv")
        .attr("class", "option-div");

    div = d3.select("#convThresholdDiv");

    // Add label
    div.append("label")
        .attr("for", "thresholdInput")
        .text("#Conv >= ");

    // Add input element
    var input = div.append("input")
        .attr("type", "text")
        .attr("id", "convThresholdInput")
        .attr("value", params.conversationThreshold)
        .style("width", "22px");

    // Add event listener
    input.on("change", function () {
        var threshold = d3.select(this).property("value");
        params.conversationThreshold = threshold;
        plotGraphWithoutReload()
    });
}

function addCountThresholdInput() {
    // Select the container
    var div = d3.select("#forcegraph-options");

    // create a new div
    div.append("div")
        .attr("id", "countThresholdDiv")
        .attr("class", "option-div");

    div = d3.select("#countThresholdDiv");

    // Add label
    div.append("label")
        .attr("for", "thresholdInput")
        .text("#💬+🔁+❤️ >= ");

    // Add input element
    var input = div.append("input")
        .attr("type", "text")
        .attr("id", "countThresholdInput")
        .attr("value", params.countThreshold)
        .style("width", "22px");

    // Add event listener
    input.on("change", function () {
        var threshold = d3.select(this).property("value");
        params.countThreshold = threshold;
        plotGraphWithoutReload();
    });
}
