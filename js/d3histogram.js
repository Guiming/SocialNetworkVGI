  var cateVars = ['landcover_distribution_obs_vector', 'landcover_distribution_ids_vector', 'taxon_distribution_obs_vector', 'taxon_distribution_ids_vector'];  // A function that builds the graph for a specific value of bin
  
  function draw_histogram() {
    
    nBin = +$("#nBin_histogram").val();
	attr_name = $("#attr_histogram option:checked")[0].value;
    attr_name_text = $("#attr_histogram option:checked")[0].text;
    
    if($("#node_histogram")[0].checked){
        data = fg_dataset.nodes;
    }else{
        data = fg_dataset.links;
    }

	// set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 40},
    width = 460 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

	if(d3.select("#svg_histogram")[0]!=null){
		d3.select("#svg_histogram").remove();
		d3.select("#id_tooltiphistogram").remove();
        d3.select("#id_statshistogram").remove();
	}

    if(d3.select("#svg_pie_landcover")[0][0] != null){
        d3.select("#svg_pie_landcover").remove();
        d3.select("#id_tooltiplandcover").remove();
        d3.select("#id_legendlandcover").remove();
        
    }

    if(d3.select("#svg_pie_kingdom")[0][0] != null){
        d3.select("#svg_pie_kingdom").remove();
        d3.select("#id_tooltipkingdom").remove();
        d3.select("#id_legendkingdom").remove();
        
      }

	var svg = d3.select("#histogramsvg")
		.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.attr("id", "svg_histogram");
	
    // X axis: scale and draw:
	var x = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return +d[attr_name] })])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d[attr_name] })
        .range([0, width]);
    var xAxis = d3.svg.axis().orient("bottom").ticks(5).scale(x);

	//https://stackoverflow.com/questions/47727746
    // set the parameters for the histogram
    var histogram = d3.layout.histogram()
		.value(function(d) { return d[attr_name]; })
		.range(x.domain())
        .bins(nBin); // then the numbers of bins //x.ticks(nBin)

    // And apply this function to data to get the bins
    var bins = histogram(data);
	
    // Y axis: initialization
	var y = d3.scale.linear()
        .domain([0, d3.max(bins, function(d) { return d.y; })])
		.range([height, 0]);
 
    var yAxis = d3.svg.axis().orient("left").ticks(5).scale(y);
    
    
    function updateHistogram() {
        var rects = d3.select("#histogramsvg").selectAll("rect")
        
        // update axes with these new boundaries
        innerSpace.select(".x.axis").call(xAxis)
        //innerSpace.select(".y.axis").call(yAxis)

        // update circle position
        rects
            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; })
            .attr("width", function(d) { return x(d.x+d.dx) - x(d.x) -1 ; })
            //.attr("height", function(d) { return height - y(d.y); })
            
    }
    // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])  // This control how much you can unzoom (x0.5) and zoom (x20)
        .x(x)
        //.y(y)
        .on("zoom", updateHistogram);
    
    var innerSpace = svg.append("g")
        .attr("class", "inner_space")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom);
    /*
    innerSpace.append("g").attr("class", "hidden rectangle")
        .append("rect")
        .attr("class","background")
        .attr("x", function(d,i){return x(0);})
        .attr("y", function(d,i){return y(d3.max(bins, function(d) { return d.y }));})
        .attr("width", function(d,i){return x(d3.max(bins, function(d) { return d.x }));})
        .attr("height", function(d,i){return y(0);})
        .style("fill","white")
        .style("opacity","0")
    */
    innerSpace.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "x axis axis_histogram")
        .call(xAxis); //

    innerSpace.append("g")
        .transition()
        .duration(1000)
        .attr("class", "y axis axis_histogram")
        .call(yAxis); //          
    
	// Add a tooltip div. Here I define the general feature of the tooltip: stuff that do not depend on the data point.
	// Its opacity is set to 0: we don't see it by default.
	var tooltip = d3.select("#histogramsvg")
		.append("div")
		.attr("class", "tooltiphistogram")
		.attr("id", "id_tooltiphistogram");
	
    var vals = extract_attributes(data, attr_name);
    var min = jStat.min(vals);
    var max = jStat.max(vals);   
    var mean = jStat.mean(vals);   
    var std = jStat.stdev(vals);   
    var median = jStat.median(vals);
    var qts = jStat.quartiles(vals);
    var IQR = qts[2] - qts[0];
    var mode = jStat.mode(vals);
    var mode_n = 0;
    if(Number.isInteger(mode)){
        for(var i in vals){
            if(vals[i] === mode){
                mode_n = mode_n + 1;
            }
        }
    }

    var statspanel = d3.select("#histogramsvg")
        .append("div")
        .attr("class", "statshistogram")
        .attr("id", "id_statshistogram")
        .style("display", "none");

    if(!cateVars.includes(attr_name)){    
        statspanel.transition()
        .duration(100)
        .style("right", "140px")
        .style("top", "70px")
        .style('display', 'block');
        
        var html = "Min: " + (Number.isInteger(min) ? min : min.toFixed(3)) + ', '
                    + "max: " + (Number.isInteger(max) ? max : max.toFixed(3)) + '<br>'
                    + "Mean: " + (Number.isInteger(mean) ? mean : mean.toFixed(3)) + ', '
                    + "stdev: " + (Number.isInteger(std) ? std : std.toFixed(3)) + '<br>'
                    + "Median: " + (Number.isInteger(median) ? median : median.toFixed(3)) + ', '
                    + "IQR: " + (Number.isInteger(IQR) ? IQR : IQR.toFixed(3)) + '<br>';
        if(Number.isInteger(mode)){
            html = html +  "Mode: " + mode  + ', frequency=' + mode_n + '/' + vals.length;
        }
        statspanel.html(html);
    }

	// A function that change this tooltip when the user hover a point.
	// Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
	var mouseover = function(d) {
		tooltip
		.transition()
		.duration(100)
		.style('display', 'block');
		tooltip
		.html(attr_name_text + ": " + (Number.isInteger(d.x) ? d.x : d.x.toFixed(3)) + " - " + (Number.isInteger(d.x+d.dx) ? d.x+d.dx : (d.x+d.dx).toFixed(3)) + "<br>" + "Count: " + d.y)
		.style("left", (d3.event.layerX + 10) + "px")
		.style("top", (d3.event.layerY + 10) + "px");

		d3.select(this).attr("style", "fill: orange;");
	}
	var mousemove = function(d) {
		tooltip
		.style("left", (d3.event.layerX + 10) + "px")
		.style("top", (d3.event.layerY + 10) + "px");
	}
	// A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
	var mouseout = function(d) {
		
		d3.select(this).attr("style", "fill: #69b3a2;");

		tooltip
		.transition()
		.duration(100)
		.style("display", "none");		
	}
	//////


    // Join the rect with the bins data
    var histogram = innerSpace.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect") // Add a new rect for each new elements
        //.merge(u) // get the already existing elements as well
			.attr("x", 1)
			.attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; })
			.attr("width", function(d) { return x(d.x+d.dx) - x(d.x) -1 ; })
			.attr("height", function(d) { return height - y(d.y); })
			.style("fill", "#69b3a2")
            .style("opacity", 1.0)
            //.style("stroke", "white")
		  // Show tooltip on hover
		.on("mouseover", mouseover )
		.on("mousemove", mousemove )
		.on("mouseout", mouseout )
		.transition() // and apply changes to all of them
        .duration(1000)
	
    innerSpace.append("text")
		.attr("class", "x label")
		.attr("text-anchor", "end")
		.attr("x", width)
		.attr("y", height - 6)
		.text(attr_name_text);

    innerSpace.append("text")
		.attr("class", "y label")
		.attr("text-anchor", "end")
		.attr("y", 5)
		.attr("dy", ".75em")
		.attr("transform", "rotate(-90)")
		.text("Count");

}