function createWordCloud(myWords) {
    var fill = d3.scaleOrdinal(d3.schemeCategory10);

    width = params.width;
    height = params.height;
    var layout = d3.layout.cloud()
        .size([width, height])
        .words(myWords.map(function (d) {
            return { text: d.word, size: 15 + d.frequency * 1500, frequency: d.frequency, count: d.count };
        }))
        .padding(5)
        // .rotate(function () { return ~~(Math.random() * 2) * 90; })
        .rotate(function () { return 0; })
        .font("Impact")
        .fontSize(function (d) { return d.size; })
        .on("end", draw);

    layout.start();

    let flag = 0;

    function draw(words) {
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
                const word = d.text;
                if (flag === 0) {
                    d3.selectAll("circle").filter(function (d) {
                        return d.type === "tweet" && d.cleaned_tweet.includes(word);
                    }).transition().attr("r", 8);
                    flag = 1;
                }
                else {
                    d3.selectAll("circle").filter(function (d) {
                        return d.type === "tweet" && d.cleaned_tweet.includes(word);
                    }).transition().attr("r", 5);
                    flag = 0;
                }
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