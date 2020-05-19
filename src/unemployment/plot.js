// Define variables
// ============================================================================
const path_data = "./data/unemployment.csv",
    margin = {top: 25, right: 10, bottom: 30, left: 30},
    width = 600 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// Define Functions
// ============================================================================
function clean_data(d) {
    // Get Year
    const year = d.Year;

    // Get Months
    let months = Object.keys(d)
    months.splice(0, 1);

    // Output Data
    let data = [];
    months.forEach((month, i) => {
        data.push({
            Date: new Date(year + month), 
            Rate: parseFloat(d[month]),
            });
    })

    // Return
    return data;
}

// Plot
// ============================================================================
// Load csv and plot
d3.csv(path_data, (d) => {
    let clean_d = clean_data(d);
    return(clean_d);
}).then(data => {
    // Combine Data into one Array
    let combined_data = [];
    data.forEach(sub => {
        sub.forEach(d => {
            combined_data.push(d);
        })
    })

    // Add SVG
    let svg = d3.select("#lineplot")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                "translate(" + margin.left + "," + margin.top + ")");

    // Create Scales
    let xScale = d3.scaleTime()
        .range([0, width - margin.right - margin.left])
        .domain(d3.extent(combined_data, d => d.Date));

    let yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(combined_data, d => d.Rate)]);

    // Plot Axes
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("transform", "translate(0, 0)")
        .call(d3.axisLeft(yScale));

    // Plot Line
    svg.append("path")
        .datum(combined_data)
            .attr("class", "line")
            .attr("d", d3.line()
                .x(d => xScale(d.Date))
                .y(d => yScale(d.Rate)));

    // Add Title
    svg.append("text")
        .attr("class", "plot-title")
        .attr("x", width / 2)
        .attr("y", 0)
        .text("US Unemployment Rate");

})