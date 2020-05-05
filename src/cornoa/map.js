// Define Paths to Johns Hopkins Data
// ============================================================================
let path_global_confirmed = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv",
    path_global_death = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv",
    path_global_recovered = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv";

// Mapbox Access Token
// ============================================================================
let mapbox_token = "pk.eyJ1IjoibWltaWt3YW5nIiwiYSI6ImNrOXJmbGoydDBzcnMza243c2NsdjRldzIifQ.S1-zlrbZrtrkMjatFhTBZQ";

// Define Functions
// ============================================================================
/**
 * Transform date formatted as string (i.e. 1/3/2010) to date object
 * @param   {string} date_string string to be converted
 * @returns {Date}
 */
function get_date(date_string) {
    let date = date_string.split("/");
    return new Date("20" + date[2], date[0] - 1, date[1]);
};

/**
 * Clean Data
 * @param   {Array} row each row of data
 * @returns {Array}
 */
function clean_data(confirmed, death, recovered) {
    let country = confirmed["Country/Region"],
        state = confirmed["Province/State"],
        latitude = confirmed["Lat"],
        longitude = confirmed["Long"];
    
    let dates = Object.keys(confirmed).slice(4, confirmed.length);
    dates.forEach(function(d,i) {
        this[i] = get_date(d);
    }, dates);

    let emptyArray = [];
    dates.forEach(function(d) {
        emptyArray.push(0);
    });

    let val_confirmed = [],
        val_death = [],
        val_recovered = [];

    if (typeof confirmed !== 'undefined') {
        val_confirmed = Object.values(confirmed).slice(4, confirmed.length)
    } else {
        val_confirmed = emptyArray;
    }
    if (typeof death !== 'undefined') {
        val_death = Object.values(death).slice(4, death.length)
    } else {
        val_death = emptyArray;
    }
    if (typeof recovered !== 'undefined') {
        val_recovered = Object.values(recovered).slice(4, recovered.length)
    } else {
        val_recovered = emptyArray;
    }


    let data = []
    dates.forEach(function(d, i) {
        if (!isNaN(parseInt(val_confirmed[i]))) {
            val_confirmed[i] = parseInt(val_confirmed[i]);
        } else {
            val_confirmed[i] = 0;
        };
        if (!isNaN(parseInt(val_death[i]))) {
            val_death[i] = parseInt(val_death[i]);
        } else {
            val_death[i] = 0;
        };
        if (!isNaN(parseInt(val_recovered[i]))) {
            val_recovered[i] = parseInt(val_recovered[i]);
        } else {
            val_recovered[i] = 0;
        };
        data.push({
            Date: dates[i], 
            Confirmed: val_confirmed[i],
            Death: val_death[i],
            Recovered: val_recovered[i]
        });
    });

    let output = {
        Country: country, 
        State: state,
        Latitude: latitude,
        Longitude: longitude,
        Data: data
    };

    return output;
};

/**
 * Get Data for Date
 * @param {Date} date date of interest
 * @returns {Array}
 */
function filter_by_date(data, date) {
    return data.filter(function(d) { 
        return d.Date >= date; });
};

/**
 * Get Total Confirmed, Recovered, Deaths
 */
function get_total(data, date) {
    let confirmed = 0,
        recovered = 0,
        deaths = 0;

    let filtered_data;
    
    data.forEach(function(d, i) {
        filtered_data = filter_by_date(d.Data, date)[0];

        confirmed = confirmed + filtered_data.Confirmed;
        recovered = recovered + filtered_data.Recovered;
        deaths = deaths + filtered_data.Death;
    })

    return {confirmed, recovered, deaths}
}

/**
 * Get most recent date
 * @param {Array} data data
 * @returns {Date}
 */
function get_most_recent(data) {
    let max_date = new Date(Math.max.apply(null, data[0].Data.map(function(e) {
        return e.Date;
    })));

    return max_date;
};

/**
 * Get least recent date
 * @param {Array} data data
 * @returns {Date}
 */
function get_least_recent(data) {
    let min_date = new Date(Math.min.apply(null, data[0].Data.map(function(e) {
        return e.Date;
    })));

    return min_date;
};

/**
 * Draw Map
 */
function draw_map(data, date) {
    let confirmed = g.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("fill", "#624b92")
        .attr("opacity", 0.5)
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", 1);

            let text_confirmed = filter_by_date(d.Data, date)[0].Confirmed.toLocaleString(),
                text_death = filter_by_date(d.Data, date)[0].Death.toLocaleString(),
                text_recovered = filter_by_date(d.Data, date)[0].Recovered.toLocaleString();
            
            div.html(
                "<table id='tooltip'>" +
                "<tr><td><b>Country:</b></td><td>" + d.Country + "</td></tr>" +
                "<tr><td><b>State:</b></td><td>" + d.State + "</td></tr>" +
                "<tr><td><b>Confirmed:</b></td><td style='text-align: right'>" + text_confirmed + "</td></tr>" +
                "<tr><td><b>Deaths:</b></td><td style='text-align: right'>" + text_death + "</td></tr>" +
                "<tr><td><b>Recovered:</b></td><td style='text-align: right'>" + text_recovered + "</td></tr>")
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 30) + "px");

            d3.select(this)
                .attr("stroke", "black")
                .attr("fill", "#EB9922")
                .attr("opacity", 0.9)
                .attr("stroke-width", 3);
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", 0);

            d3.select(this)
                .attr("fill", "#624b92")
                .attr("stroke", "none")
                .attr("opacity", 0.5);
    });

    // Get Total
    let total = get_total(data, date);

    const tot_confirmed = document.getElementById('text_confirmed'),
        tot_recovered = document.getElementById('text_recovered'),
        tot_death = document.getElementById('text_death');
    
    tot_confirmed.innerText = total.confirmed.toLocaleString();
    tot_death.innerText = total.deaths.toLocaleString();
    tot_recovered.innerText = total.recovered.toLocaleString();

    return confirmed;
};

// Main
// ============================================================================
// Create MapBox
let map = L.mapbox.map(
    'map', 'mapbox.light', {
        accessToken: mapbox_token,
        minZoom: 1,
        maxZoom: 8,
        worldCopyJump: true
    }).setView([10, 0], 2);

// Add svg to mapbox
L.svg().addTo(map);
let svg = d3.select("#map")
    .select("svg")
    .attr("pointer-events", "auto");

let g = svg.append("g")

let div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

Promise.all(
    [
        d3.csv(path_global_confirmed),
        d3.csv(path_global_death),
        d3.csv(path_global_recovered)
    ]
).then(function(files) {
    let data = [];
    files[0].forEach(function(row, i) {
        data.push(clean_data(files[0][i], files[1][i], files[2][i]));
    });
    
    let max_date = get_most_recent(data),
        min_date = get_least_recent(data),
        diff_dates = Math.ceil((max_date - min_date) / (1000 * 60 * 60 * 24));
    
    // Change Date Label
    const date_label = document.getElementById('date_label');
    date_label.innerText = max_date.toDateString();

    // Fill in Input Slider
    let curr_val = diff_dates;
    d3.select("#date_slider")
        .attr("min", 0)
        .attr("max", diff_dates)
        .attr("value", diff_dates)
        .attr("step", 1)
        .on("input", function input() {
            curr_val = this.value;
            update_date(this);
        });

    let confirmed = draw_map(data, max_date);
    function update() {
        let date_input = new Date(min_date.getTime() + parseInt(curr_val) * 1000 * 60 * 60 * 24 - 1000 * 60 * 60);

        confirmed.attr("cx", function(d) {
                return map.latLngToLayerPoint([d.Latitude, d.Longitude]).x;
            })
            .attr("cy", function(d) {
                return map.latLngToLayerPoint([d.Latitude, d.Longitude]).y;
            })
            .attr("r", function(d) {
                let radius = filter_by_date(d.Data, date_input)[0].Confirmed;
                if (radius === 0) {
                    return 0;
                } else {
                    radius = Math.log(radius) * Math.pow(map.getZoom() / 2, 1.2);
                    return Math.max(2, radius);
                };
            });
    };

    function update_date(input) {
        // Update Slider Label
        new_date = new Date(min_date.getTime() + parseInt(input.value) * 1000 * 60 * 60 * 24 - 1000 * 60 * 60);
        date_label.innerText = new_date.toDateString();

        // Clear current plot
        d3.selectAll("circle").
            remove();

        // Redraw
        confirmed = draw_map(data, new_date);
        update();
    }

    update();
    map.on("moveend", update);
});