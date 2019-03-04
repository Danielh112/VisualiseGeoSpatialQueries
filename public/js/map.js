let map;
let drawnItems;
let drawControl;
let mapLoading = true;

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
    if (mapData.features !== undefined) {
      createToolTip();
      geoJSONLayer = appendGeoJson(map, mapData);
      centerMap(map, geoJSONLayer);
      initialiseMapTools();
      mapDetails(mapData);
    }
    showContent();
  }
}

async function redrawMap() {
  contentLoading();
  mapData = await retrieveData();
  if (mapData.features !== undefined) {
    geoJSONLayer = appendGeoJson(map, mapData);
    centerMap(map, geoJSONLayer);
    mapDetails(mapData);
  }
  showContent();
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

function retrieveData() {
  let url = sessionStorage.getItem('url');
  let username = sessionStorage.getItem('username');
  let password = sessionStorage.getItem('password');
  let database = sessionStorage.getItem('database');
  let collection = sessionStorage.getItem('collection');
  let filterCollection = sessionStorage.getItem('filterCollection');

  return new Promise((resolve, reject) => {
    $.ajax({
      url: 'http://localhost:3000/api/map',
      type: 'get',
      data: {
        url: encodeURIComponent(url),
        username: username,
        password: password,
        database: database,
        collection: collection,
        filterCollection: filterCollection
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

/* Append Geojson to map */
function appendGeoJson(map, mapData) {
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

/* Display Information regarding to the collection inc,
  collection name, total geospatial objects and total geospatial objects */
function mapDetails(mapDetails) {
  let collection = sessionStorage.getItem('collection');
  $('#collectionInfo').append(collection);

  let totalGeospatialObjects = 0;
  $.each(mapDetails.features, function(i, item) {
    if (Object.entries(item.geometry).length > 0) {
      totalGeospatialObjects++;
    }
  });

  if (mapDetails.features.length > 0) {
    $('#collectionGeospatialSize').append(totalGeospatialObjects);
    $('#collectionSize').append(mapDetails.features.length);
  }
}

/* On node mouse over
    1. Display tip of information relating to point etc.
      Note: If the point doesn't have any relevant properties don't
      display tooltip*/
function tipMouseOver(feature, layer) {
  layer.on('mouseover', function(e) {

    const point = map.latLngToContainerPoint(e.latlng);
    let popupContents;
    if (e.target.feature.properties.name) {
      popupContents = e.target.feature.properties.name
    } else {
      return;
    }

    tip.transition()
      .duration(200)
      .style('opacity', .9);

    tip.html('<b>Location: </b> ' + popupContents)
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

/* Initialise Map Tools */
function initialiseMapTools() {
  drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);
  drawControl = new L.Control.Draw({
    edit: {
      featureGroup: drawnItems
    }
  });
  map.addControl(drawControl);
}

$(function() {
  map.on('draw:created', function(e) {
    const type = e.layerType,
      layer = e.layer;

    drawnItems.addLayer(layer);
  });
});
