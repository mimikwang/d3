// Define variables
// ============================================================================
const url = "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
        origin: "*",
        action: "parse",
        page: "List_of_presidents_of_the_United_States_by_age",
        format: "json",
    }),
    margin = {top: 40, right: 60, bottom: 30, left: 30},
    width = 800 - margin.left - margin.right,
    height = 750 - margin.top - margin.bottom;

const party = {
    "George Washington": "None",
    "John Adams": "Federalist",
    "Thomas Jefferson": "Democratic-Republican",
    "James Madison": "Democratic-Republican",
    "James Monroe": "Democratic-Republican",
    "John Quincy Adams": "Democratic-Republican",
    "Andrew Jackson": "Democratic",
    "Martin Van Buren": "Democratic",
    "William Henry Harrison": "Whig",
    "John Tyler": "Whig",
    "James K. Polk": "Democratic",
    "Zachary Taylor": "Whig",
    "Millard Fillmore": "Whig",
    "Franklin Pierce": "Democratic",
    "James Buchanan": "Democratic",
    "Abraham Lincoln": "Republican",
    "Andrew Johnson": "Republican",
    "Ulysses S. Grant": "Republican",
    "Rutherford B. Hayes": "Republican",
    "James A. Garfield": "Republican",
    "Chester A. Arthur": "Republican",
    "Grover Cleveland": "Democratic",
    "Benjamin Harrison": "Republican",
    "Grover Cleveland": "Democratic",
    "William McKinley": "Republican",
    "Theodore Roosevelt": "Republican",
    "William Howard Taft": "Republican",
    "Woodrow Wilson": "Democratic",
    "Warren G. Harding": "Republican",
    "Calvin Coolidge": "Republican",
    "Herbert Hoover": "Republican",
    "Franklin D. Roosevelt": "Democratic",
    "Harry S. Truman": "Democratic",
    "Dwight D. Eisenhower": "Republican",
    "John F. Kennedy": "Democratic",
    "Lyndon B. Johnson": "Democratic",
    "Richard Nixon": "Republican",
    "Gerald Ford": "Republican",
    "Jimmy Carter": "Democratic",
    "Ronald Reagan": "Republican",
    "George H. W. Bush": "Republican",
    "Bill Clinton": "Democratic",
    "George W. Bush": "Republican",
    "Barack Obama": "Democratic",
    "Donald Trump": "Republican",
};

// Fetch Data from Wikipedia
// ============================================================================
let plot_data = [];
plot_data = fetch(url).then(response => {
    return response.json();
}).then(data => {
    // Get Page HTML
    const page = document.createElement('html');
    page.innerHTML = data.parse.text["*"];

    const age_rows = page.querySelector("span.mw-headline#Presidential_age-related_data")
            .parentElement
            .nextElementSibling
            .querySelectorAll("tr");

    // Parse Age Data
    let age_data = [];
    for (i = 2; i < age_rows.length - 2; i++) {
        const age_cols = age_rows[i].querySelectorAll("td");
        age_data.push(
            {
                Number: parseInt(age_cols[0].innerText),
                Name: age_cols[1].innerText.trim(),
                Born: new Date(age_cols[2].innerText.slice(0, 12)),
                Start: new Date(age_cols[3].querySelectorAll("span")[age_cols[3].querySelectorAll("span").length - 1].innerText),
                End: new Date(age_cols[4].querySelectorAll("span")[1].innerText),
                Death: new Date(age_cols[6].innerText),
                Party: party[age_cols[1].innerText.trim()],
            }
        );
    };

    // Add Relevant Age
    let total_age = 0,
        count_age = 0;
    age_data.forEach(d => {
        d.Start_Age = (d.Start - d.Born) / (1000 * 3600 * 24 * 365);
        total_age += d.Start_Age;
        count_age += 1;
        return d;
    }, age_data)

    let avg_age = total_age / count_age;
    
    // Plot
    let svg = d3.select("#barplot")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", 
                "translate(" + margin.left + "," + margin.top + ")");
    
    // Create Scales
    let xScale = d3.scaleLinear()
        .range([0, width - margin.right - margin.left])
        .domain([0, d3.max(age_data, d => d.Start_Age + 5)]);

    let yScale = d3.scaleBand()
        .range([0, height])
        .padding(0.1)
        .domain(age_data.map(d => d.Number));

    let colorScale = {
        "None": "#DDDDDD",
        "Federalist": "#EA9978",
        "Democratic-Republican": "#008000",
        "Democratic": "#3333FF",
        "Whig": "#F0C862",
        "Republican": "#E81B23",
    }

    // Plot Axes
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("transform", "translate(0, 0)")
        .call(d3.axisLeft(yScale));

    // Plot Data
    svg.selectAll("rect")
        .data(age_data)
        .enter()
        .append("rect")
            .attr("x", 0)
            .attr("width", function(d) { return xScale(d.Start_Age); })
            .attr("y", function(d) { return yScale(d.Number); })
            .attr("height", yScale.bandwidth())
            .attr("fill", function(d) { return colorScale[d.Party]; })
            .style("opacity", 0.4);

    // Plot Label
    svg.selectAll("name-label")
        .data(age_data)
        .enter()
        .append("text")
            .attr("id", "bar-label")
            .attr("x", 12)
            .attr("y", function(d) { return yScale(d.Number); })
            .attr("alignment-baseline", "hanging")
            .attr("dy", 3)
            .text(d => d.Name + ", " + Math.floor(d.Start_Age));

    // Plot Mean
    svg.append("line")
        .attr("x1", xScale(avg_age))
        .attr("x2", xScale(avg_age))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .style("stroke-dasharray", ("3, 3"));

    // Title
    svg.append("text")
        .attr("id", "title")
        .attr("y", -margin.top / 2)
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .text("Age of US Presidents at Inauguration")
    
    // Legend
    Object.keys(colorScale).forEach((d, i) => {
        svg.append("rect")
            .attr("id", "legend")
            .attr("y", i * 23 + 10)
            .attr("x", width - margin.right - margin.left)
            .attr("height", 20)
            .attr("width", 10)
            .attr("fill", colorScale[d])
            .style("opacity", 0.4);
        
        svg.append("text")
            .attr("id", "legend")
            .attr("y", i * 23 + 10)
            .attr("x", width - margin.left - margin.right)
            .attr("dx", 12)
            .attr("dy", 5)
            .attr("alignment-baseline", "hanging")
            .text(d);
    });

    // Mean Label
    svg.append("line")
        .attr("y1", Object.keys(colorScale).length * 23 + 20)
        .attr("y2", Object.keys(colorScale).length * 23 + 20)
        .attr("x1", width - margin.left - margin.right)
        .attr("x2", width - margin.left - margin.right + 10)
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .style("stroke-dasharray", ("3, 3"));

    svg.append("text")
        .attr("id", "legend")
        .attr("y", Object.keys(colorScale).length * 23 + 20)
        .attr("x", width - margin.left - margin.right)
        .attr("dx", 12)
        .attr("alignment-baseline", "middle")
        .text("Mean: " + Math.round(avg_age*10) / 10);
});