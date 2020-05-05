// Define paths and global variables
// ==================================================================
const path_data = "./data/us_timespent.csv",
    margin = {top: 10, right: 100, bottom: 30, left: 60},
    width = window.innerWidth - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// Define functions
// ==================================================================
/**
 * Take in raw data and clean it for plotting
 * 
 * @param {array} d raw data
 * @return {array} cleaned data
 */
function clean_data(d) {
    // Get year from header
    let years = Object.keys(d);
    years.splice(0, 3);

    // Format years into date
    years.forEach((year, i) => {
        years[i] = new Date(year.replace("Annual ", ""), 0);
    });

    // Get data - year vs avg hour
    let data = []
    let values = Object.values(d);
    values.splice(0, 3);
    years.forEach((year, i) => {
        data.push({year: year, avgHour: parseFloat(values[i])});
    });

    // return gender, activity, data
    return {gender: Object.values(d)[1],
        activity: Object.values(d)[2],
        data: data};
};

function generate_axis() {
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));
    
    svg.append("g")
        .attr("transform", "translate(0, 0)")
        .call(d3.axisLeft(yScale));

    svg.append("text")
        .attr("x", - height / 2)
        .attr("y", - margin.left / 2)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text("Average Hours Spent Daily");
};

function create_legend(keys) {
    keys.reverse()

    svg.selectAll("layers")
            .data(keys)
            .enter()
            .append("circle")
                .attr("cy", function(d, i) { return i * ((2 * height / 3) / keys.length) + margin.top; })
                .attr("r", 5)
                .attr("cx", width - margin.right - margin.left + 20)
                .attr("fill", function(d, i) { return colorScale(keys[i]); });
        
    svg.selectAll("layers")
        .data(keys)
        .enter()
        .append("text")
            .attr("x", width - margin.right - margin.left + 26)
            .attr("y", function(d, i) { return i * ((2 * height / 3) / keys.length) + margin.top; })
            .attr("font-size", "10px")
            .attr("alignment-baseline", "middle")
            .attr("fill", "black")
            .text(function(d, i) { return d; });

};

function start(data, by, filter) {
    let filteredData = data.filter(function(d) { return d[by] === filter; });

    let keys = [];
    let plotData = [];
    let subData = [];

    filteredData.forEach((d, i) => {
        keys.push(d.activity);
        subData = [];
        d.data.forEach((d2, i2) => {
            let y0 = 0;
            if (i != 0) {
                y0 = plotData[i - 1][i2].y1;
            };
            subData.push({year: d2.year, y0: y0, y1: y0 + d2.avgHour});
        });
        plotData.push(subData);
    });

    svg.selectAll("layers")
        .data(plotData)
        .enter()
        .append("path")
            .attr("class", "area")
            .style("fill", function(d, i) { return colorScale(keys[i]); })
            .attr("stroke", function(d, i) { return colorScale(keys[i]); })
            .attr("d", d3.area()
                .x(function(d) { return xScale(d.year); })
                .y1(function(d) { return yScale(0); })
                .y0(function(d) { return yScale(0); }));

    svg.selectAll("path.area")
        .transition()
        .duration(2000)
        .attr("d", d3.area()
            .x(function(d) { return xScale(d.year); })
            .y1(function(d) { return yScale(d.y1); })
            .y0(function(d) { return yScale(d.y0); }));

    create_legend(keys);
};

function transition_plot(data, by, filter) {
    let filteredData = data.filter(function(d) { return d[by] === filter; });

    let keys = [];
    let plotData = [];
    let subData = [];

    filteredData.forEach((d, i) => {
        keys.push(d.activity);
        subData = [];
        d.data.forEach((d2, i2) => {
            let y0 = 0;
            if (i != 0) {
                y0 = plotData[i - 1][i2].y1;
            };
            subData.push({year: d2.year, y0: y0, y1: y0 + d2.avgHour});
        });
        plotData.push(subData);
    });

    svg.selectAll("path.area")
        .data(plotData)
        .transition()
        .duration(2000)
        .delay(100)
            .style("fill", function(d, i) { return colorScale(keys[i]); })
            .attr("stroke", function(d, i) { return colorScale(keys[i]); })
            .attr("d", d3.area()
                .x(function(d) { return xScale(d.year); })
                .y1(function(d) { return yScale(d.y1); })
                .y0(function(d) { return yScale(d.y0); }));
};


// Scales
// ==================================================================
let xScale = d3.scaleTime()
    .range([0, width - margin.right - margin.left])
    .domain([new Date(2003, 0), new Date(2018, 0)]);

let yScale = d3.scaleLinear()
    .range([height, 0])
    .domain([0, 24]);

let colorScale = d3.scaleOrdinal()
    .range(d3.schemePaired);

// Add svg
// ==================================================================
let svg = d3.select("#d3plot")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
            "translate(" + margin.left + "," + margin.top + ")");

// Plot
// ==================================================================
d3.csv(path_data, function(d, i) {
    let data = clean_data(d);
    return data;
}).then(function(data) {
    generate_axis();
    start(data, "gender", "Women");
});

// Toggle
// ==================================================================
$(document).ready(function() {
    $('#women-tab a').on('click', function() {     
        const women = document.getElementById("women-link");
        const men = document.getElementById("men-link");

        women.classList.value = "nav-link active";
        men.classList.value = "nav-link";

        d3.csv(path_data, function(d, i) {
            let data = clean_data(d);
            return data;
        }).then(function(data) {
            transition_plot(data, "gender", "Women");
        });
    });

    $('#men-tab a').on('click', function() {     
        const women = document.getElementById("women-link");
        const men = document.getElementById("men-link");

        women.classList.value = "nav-link";
        men.classList.value = "nav-link active";

        d3.csv(path_data, function(d, i) {
            let data = clean_data(d);
            return data;
        }).then(function(data) {
            transition_plot(data, "gender", "Men");
        });
    });
})