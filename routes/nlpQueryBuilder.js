const express = require('express');
const router = express.Router();

/* API to construct natural language MongoDB query
  Example: Find objects within 50 miles of x y*/
router.get('/', async (req, res, next) => {

  const collection = req.query.collection;
  const queryType = req.query.queryType;
  const filters = filtersExpr(req.query.filters);

  let geospatialOperators = '';
  if (queryType === 'near' || queryType === 'nearSphere') {
    geospatialOperators += nearQuery(req, next);
  }

  /* If the geospatial object does not contain properties
  it means we are searching within/interesecting a spatial polygon */
  if (queryType === 'geoIntersects' || queryType === 'geoWithin') {
    if (req.query.geometry.properties == undefined) {
      geospatialOperators += spatialObjectQuery(req, next);
    } else {
      geospatialOperators += centerSphereQuery(req, next);
    }
  }

  let query = `In collection: ${collection}
  ${geospatialOperators}
  ${filters}`;

  var response = {
    status: 200,
    query: query
  }
  res.end(JSON.stringify(response));
});

function nearQuery(req) {

  const queryType = req.query.queryType;
  const coordinates = req.query.geometry.coordinates;
  const locName = req.query.geometry.locName;
  const maxDistance = maxDistanceExpr(req.query.maxDistance);
  const minDistance = minDistanceExpr(req.query.minDistance);

  return `Find geospatial objects near
      ${coordinates}
        ${maxDistance}
        ${minDistance}`;
}

function filtersExpr(filters) {
  if (filters === undefined || filters.length === 0 || !filters.trim() || filters === '{}') {
    return '';
  } else {

    return`Where:
      ${filters.replace('{','').replace('}','')}`;
  }
}

function maxDistanceExpr(distance) {
  if (distance === undefined) {
    return '';
  } else {
    return `Within:
              ${distance}m`;
  }
}

function minDistanceExpr(distance) {
  if (distance === undefined || distance === '') {
    return '';
  } else {
    return `And Greater than:
              ${distance}m`;
  }
}

function spatialObjectQuery(req) {

  const queryType = req.query.queryType;
  const coordinates = coordinateExpr(req.query.geometry.geometry.coordinates);

  return `Find geospatial objects ${queryType} region
      ${coordinates}`;
}

function centerSphereQuery(req) {

  const queryType = req.query.queryType;
  const coordinates = coordinateExpr(req.query.geometry.geometry.coordinates);
  const properties = req.query.geometry.properties;

  return `Find geospatial objects using sphere from point
      ${coordinates}`;
}

/* Reverse array and stringify coordinates */
function coordinateExpr(coordinates) {
  reversedCoordinates = [...coordinates].reverse();
  return JSON.stringify(reversedCoordinates).replace(/['"]+/g, '');
}

module.exports = router;
