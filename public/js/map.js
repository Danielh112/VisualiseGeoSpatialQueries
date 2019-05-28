let map;
let currentMapData;

let drawnItems;
let drawControl;
let mapLoading = true;
let zoomed = false;

const geojsonMarkers = {
  radius: 8,
  fillColor: '#ff7800',
  color: '#000',
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8
};


$(function() {
  initialise();
});

async function initialise() {
  if (connectionExists()) {
    map = createMap();
    mapData = await retrieveData();
    initialiseMapTools();
    mapDetails(mapData);
    createToolTip();
    createPopup();
    if (mapData.features !== undefined) {
      geoJSONLayer = appendGeoJson(map, mapData);
      centerMap(map, geoJSONLayer);
    }
    showContent();
  }
}

/* Redraw and recenter map based on the current maps data */
async function redrawMap(recenterMap, mapBounds) {
  mapData = await retrieveData(mapBounds);
  if (!_.isEqual(currentMapData, mapData)) {
    clearMapData();
    geoJSONLayer = appendGeoJson(map, mapData);
    mapDetails(mapData);
    if (mapData.features !== undefined && recenterMap) {
      centerMap(map, geoJSONLayer);
    }
  }
}

function connectionExists() {
  if (sessionStorage.getItem('url') === null) {
    window.location.href = '../';
    return false;
  } else {
    return true;
  }
}

function contentLoading() {
  mapLoading = true;
  $('#contentLoading').removeClass('hidden');
}

function showContent() {
  mapLoading = false;
  $('#contentLoading').addClass('hidden');
}

function clearMapData() {
  if (geoJSONLayer !== null) {
    map.removeLayer(geoJSONLayer);
  }
}

/*
Create Map and append open street maps as background to map
*/
function createMap() {
  map = L.map('map-container', {
    attributionControl: false
  }).setView([51.505, -0.09], 13);
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGFuaWVsaDExMiIsImEiOiJjanJ4ZjFmM24wa3JtNDludmxlYzhndmoxIn0._VvtW1VgcpUNRqFchxOl7A', {
    attribution: 'MapgenerateSelectionWindow data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    minZoom: 2,
    noWrap: false,
    id: 'mapbox.streets',
    accessToken: 'your.mapbox.access.token'
  }).addTo(map);

  return map
}

/*
Retrieve data from /map API
  Note: Currently retrieving user credentials inputted from session storage
        and only used in development environment, not to be done in
        live implementation.
*/

function collectionDetails() {
  let url = sessionStorage.getItem('url');
  let username = sessionStorage.getItem('username');
  let password = sessionStorage.getItem('password');
  let database = sessionStorage.getItem('database');
  let collection = sessionStorage.getItem('collection');

  return new Promise((resolve, reject) => {
    $.ajax({
      url: '../api/mongoDB/collection/size',
      type: 'get',
      data: {
        url: encodeURIComponent(url),
        username: username,
        password: password,
        database: database,
        collection: collection
      },
      dataType: 'json',
      success: function(response) {
        resolve(response);
      },
      error: function(err) {
        //TODO display error in UI
        console.log(err);
        reject(err);
      }
    });
  });
}

/*
Retrieve data from /map API
  Note: Currently retrieving user credentials inputted from session storage
        and only used in development environment, not to be done in
        live implementation.
*/

function retrieveData(mapBounds) {
  let url = sessionStorage.getItem('url');
  let username = sessionStorage.getItem('username');
  let password = sessionStorage.getItem('password');
  let database = sessionStorage.getItem('database');
  let collection = sessionStorage.getItem('collection');
  let filterCollection = sessionStorage.getItem('filterCollection');

  let mapCoordinates;

  if (mapBounds !== undefined) {
    mapCoordinates = mapCoordinatesBuilder(mapBounds);
    //L.rectangle(mapCoordinates, {color: "#ff7800", weight: 1}).addTo(map);
  }

  return new Promise((resolve, reject) => {
    $.ajax({
      url: '../api/map',
      type: 'get',
      data: {
        url: encodeURIComponent(url),
        username: username,
        password: password,
        database: database,
        collection: collection,
        filterCollection: filterCollection,
        mapBounds: mapCoordinates
      },
      dataType: 'json',
      success: function(response) {
        resolve(response);
      },
      error: function(err) {
        //TODO display error in UI
        console.log(err);
        reject(err);
      }
    });
  });
}

function latLimit(val) {
  return val < -90.0 ? -90.0 : (val > 90.0 ? 90.0 : val);
}

function lngLimit(val) {
  return val < -180.0 ? -179.9 : (val > 180.0 ? 179.9 : val);
}

function mapCoordinatesBuilder(mapBounds) {
  const sw = mapBounds.getSouthWest();
  const ne = mapBounds.getNorthEast();

  return [
    [
      [lngLimit(sw.lng), latLimit(sw.lat)],
      [lngLimit(sw.lng), latLimit(ne.lat)],
      [lngLimit(ne.lng), latLimit(ne.lat)],
      [lngLimit(ne.lng), latLimit(sw.lat)],
      [lngLimit(sw.lng), latLimit(sw.lat)]
    ]
  ];

}

/* Append Geojson to map */
function appendGeoJson(map, mapData) {
  currentMapData = mapData;
  return geoJson = L.geoJSON(mapData, {
      onEachFeature: tipMouseOver,
      pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkers);
      }
    }).on('mouseout', tipMouseOut)
    .addTo(map);
}

/* Center map based on the geoJson Uploaded */
function centerMap(map, geoJSON) {
  map.fitBounds(geoJSON.getBounds());
}

/* Create tool tip */
function createToolTip() {
  return tip = d3.select('#map-container')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);
}

/* Create popup */
function createPopup() {
  return popup = d3.select('#map-container')
    .append('div')
    .attr('class', 'popup')
    .style('opacity', 0)
    .style("z-index", "999");
}

/* Display Information regarding to the collection inc,
  collection name, total geospatial objects and total geospatial objects */
async function mapDetails(mapDetails) {
  const collectionSize = await collectionDetails();
  let collection = sessionStorage.getItem('collection');
  let totalGeospatialObjects = 0;

  $.each(mapDetails.features, function(i, item) {
    if (Object.entries(item.geometry).length > 0) {
      totalGeospatialObjects++;
    }
  });

  $('#collectionInfo').text(`Collection: ${collection}`);
  if (mapDetails.features) {
    $('#collectionGeospatialSize > span:first-of-type').text(`Displaying ${totalGeospatialObjects} Geospatial Objects of ${collectionSize.documentCount} Documents`);
  } else {
    $('#collectionGeospatialSize > span:first-of-type').text(`Displaying 0 Geospatial Objects.`);
  }
  $('#collectionGeospatialSize').removeClass('hidden');
}

/* On node mouse over
    1. Display tip of information relating to point etc.
      Note: If the point doesn't have any relevant properties don't
      display tooltip*/
function tipMouseOver(feature, layer) {

  /* Clicked: Display full panel info */
  layer.on("click", function (e) {
    tipMouseOut();
    const point = map.latLngToContainerPoint(e.latlng);

      popup.transition()
        .duration(200)
        .style('opacity', .9);

      /* GeoJSON Properties Panel */
      let popupContent = '<b> Properties </b> <br> ';

      $.each(e.sourceTarget.feature.properties, function( key, value ) {
          popupContent += '<b>' + key + '</b>' + ':' + JSON.stringify(value) + '<br>';
      });

      popupContent += '<b> Geometry: </b>' + JSON.stringify(e.sourceTarget.feature.geometry);
      popup.html(popupContent)
      .style('left', (point.x) + 'px')
        .style('top', (point.y) + 'px');
    });

  /* Hover: Display name */
  layer.on('mouseover', function(e) {

    const point = map.latLngToContainerPoint(e.latlng);
    let tipContents;
    if (popup._groups[0][0].style.opacity == 0 && e.target.feature.properties.name) {
      tipContents = e.target.feature.properties.name
    } else {
      return;
    }

    tip.transition()
      .duration(200)
      .style('opacity', .9);

    tip.html('<b>Location: </b> ' + tipContents)
      .style('left', (point.x) + 'px')
      .style('top', (point.y - 28) + 'px');
  });
}

/* On Tooltip mouse out */
function tipMouseOut() {
  tip.transition()
    .duration(500)
    .style('opacity', 0);
}

/* On popup mouse out */
function popupMouseOut() {
  popup.transition()
    .duration(500)
    .style('opacity', 0);
}

/* Initialise Map Tools */
function initialiseMapTools() {
  drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);
  drawControl = new L.Control.Draw({
    draw: false,
    edit: false,
  });
  map.addControl(drawControl);
}

function zoomedMap() {
  if (!mapLoading && map.getZoom() >= 4) {
    alh(false, map.getBounds());
    zoomed = true;
  } else if (!mapLoading && zoomed) {
    redrawMap(false);
  }
}

$(function() {
  map.on('click', function() {
    if (popup._groups[0][0].style.opacity > 0) {
      popupMouseOut();
    }
  });

  map.on('movestart', function() {
    if (popup._groups[0][0].style.opacity > 0) {
      popupMouseOut();
    }
  });

  map.on('moveend', function() {
    const geospatialIndex = sessionStorage.getItem('geospatialIndex');
    if (geospatialIndex === "true") {
      zoomedMap();
    }
  });

  map.on('draw:created', function(e) {
    const type = e.layerType,
      layer = e.layer;

    drawnItems.addLayer(layer);
  });
});
