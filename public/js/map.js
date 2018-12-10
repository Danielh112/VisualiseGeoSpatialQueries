const width = 960;
const height = 500;

function initialise() {
	var map = createMap();
	generateMap(map);
	styleMap();
}

function createMap() {
	return map = d3.select("#map-container")
		.append("svg")
		.attr("width", width).attr("height", height);
}

/*
	- Makes API Request to get Map JSON
	- Calculate center of map
	- Determine the bounds of the map
*/

function generateMap(map) {
	d3.json("http://localhost:3000/api/map")
	  .then(function(data){
	  		var center = d3.geoCentroid(data)
		    var scale  = 150;
		    var offset = [width/2, height/2];
		    var projection = d3.geoMercator().scale(scale).center(center)
		    	.translate(offset);

      		var path = d3.geoPath().projection(projection);

	        var bounds  = path.bounds(data);
	      	var hscale  = scale*width  / (bounds[1][0] - bounds[0][0]);
	      	var vscale  = scale*height / (bounds[1][1] - bounds[0][1]);
	      	var scale   = (hscale < vscale) ? hscale : vscale;
	      	var offset  = [width - (bounds[0][0] + bounds[1][0])/2,
	                        height - (bounds[0][1] + bounds[1][1])/2];

		    projection = d3.geoMercator().center(center).scale(scale).translate(offset);
			path = path.projection(projection);

			projectMap(data, path);
	});
}

function projectMap(data,path) {

  	map.selectAll("path").data(data.features).enter().append("path")
	.attr("d", path)
	.style("fill", "red")
	.style("stroke-width", "1")
	.style("stroke", "black");

  	map.append("rect").attr('width', width).attr('height', height)
		.style('stroke', 'black').style('fill', 'none');
}

window.onload = function() {
	initialise();
}