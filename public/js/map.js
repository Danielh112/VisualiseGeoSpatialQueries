window.onload = function() {

	var map = d3.select("#map")
		.append("svg")
		.attr("width", 960)
		.attr("height", 500); 

	path = d3.geoPath().projection(projection);

	var projection = d3
			.geoMercator()
			.scale(16000)	
			.rotate([-0.25, 0.25, 0])
			.center([139.0032936, 36.3219088]); 

	d3.json("http://localhost:3000/api/map")	//TODO
	  .then(function(data){
	  	console.log(data[0].location);
			map.selectAll("path")
				.data(data[0].location.coordinates)
				.enter()
				.append("path")
				.attr("d", path) 
				.attr("fill", "green")
				.attr("fill-opacity", 0.5)
				.attr("stroke", "#222");    
	});
}