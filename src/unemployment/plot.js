// Define variables
// ============================================================================
const path_data = "./data/unemployment.csv",
    path_pres = "./data/us_presidents.csv",
    margin = {top: 25, right: 10, bottom: 30, left: 30},
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

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

function clean_pres(d) {
    return {
        Start: new Date(d.Start),
        End: new Date(d.End),
        Party: d.Party,
        Name: d.Name
    }
}

// Plot
// ============================================================================
// Load csvs and plot
Promise.all(
    [
        d3.csv(path_data),
        d3.csv(path_pres)
    ]
).then(files => {
    let data = files[0],
        data_pres = files[1];

    // Combine Data into one Array
    let combined_data = [];
    data.forEach(sub => {
        let clean = clean_data(sub);
        clean.forEach(d => {
            if (!isNaN(d.Rate)) {
                combined_data.push(d);
            }
        })
    })

    let combined_pres = [];
    data_pres.forEach(d => {
        combined_pres.push(clean_pres(d));
    })

    // Add SVG
    let svg = d3.select("#lineplot")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                "translate(" + margin.left + "," + margin.top + ")");

    // Add Tooltip
    let div = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);

    // Create Scales
    let xScale = d3.scaleTime()
        .range([0, width - margin.right - margin.left])
        .domain(d3.extent(combined_data, d => d.Date));

    let yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(combined_data, d => d.Rate)]);

    let colorScale = {
        "Democratic": "#9ED9FE",
        "Republican": "#FE9EB5"
    }

    // Plot Axes
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("transform", "translate(0, 0)")
        .call(d3.axisLeft(yScale));

    // Add Areas
    svg.selectAll("rect")
        .data(combined_pres)
        .enter()
        .append("rect")
            .attr("class", "area")
            .style("fill", d => colorScale[d.Party])
            .attr("stroke", "none")
            .attr("x", d => xScale(d.Start))
            .attr("y", 0)
            .attr("height", height)
            .attr("width", d => xScale(d.End) - xScale(d.Start))
            .on("mouseover", function(d) {
                d3.select(this)
                    .attr("stroke", "black")
                    .style("opacity", 0.8);
                
                div.transition()
                    .duration(200)
                    .style("opacity", 1);

                div.html(`<b>${d.Name}</b>`)
                    .style("left", margin.left + xScale(d.End) + "px")
                    .style("top", margin.top + "px");
            })
            .on("mouseout", function(d) {
                d3.select(this)
                    .attr("stroke", "initial")
                    .style("opacity", 0.2);

                div.transition()
                    .duration(200)
                    .style("opacity", 0);
            });

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
        .attr("y", -5)
        .text("US Unemployment Rate");

})