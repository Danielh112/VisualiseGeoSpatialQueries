const express = require('express');
const router = express.Router();

/* Construct MongoDB query */
router.get('/', async (req, res, next) => {

  const collection = req.query.collection;
  let spatialParams = spatialQueryBuilder(req, next);
  const filters = filtersExpr(req.query.filters);

  if (spatialParams !== '' && filters !== '') {
    spatialParams += ',';
  }

  let query = `db.${collection}.find(
      {
        ${spatialParams}
        ${filters}
      }
     )`;

  var response = {
    status: 200,
    query: query
  }
  res.end(JSON.stringify(response));
});

function spatialQueryBuilder(req, next) {
  const queryType = req.query.queryType;

  if (queryType === 'near' || queryType === 'nearSphere') {
    return nearQuery(req, next);
  } else if (queryType === 'geoIntersects' || queryType === 'geoWithin') {
    if (req.query.geometry.properties == undefined) {
      return spatialObjectQuery(req, next);
    } else {
      return centerSphereQuery(req, next);
    }
  } else {
    return '';
  }
}

/* Find parameter for Near query */
function nearQuery(req) {

  const queryType = req.query.queryType;
  const coordinates = req.query.geometry.coordinates;
  const maxDistance = maxDistanceExpr(req.query.maxDistance);
  const minDistance = minDistanceExpr(req.query.minDistance);

  return `"location":
         { "$${queryType}" :
            {
              "$geometry": { "type": "Point", "coordinates": [${coordinates}] }
              ${maxDistance}
              ${minDistance}
            }
         }`;
}

function filtersExpr(filters) {
  if (filters === undefined || filters.length === 0 || !filters.trim() || filters === '{}') {
    return '';
  } else {
    return `${filters.replace('{','').replace('}','')}`;
  }
}

function maxDistanceExpr(distance) {
  if (distance === undefined) {
    return '';
  } else {
    return `,"$maxDistance": ${distance}`;
  }
}

function minDistanceExpr(distance) {
  if (distance === undefined || distance === '') {
    return '';
  } else {
    return `,"$minDistance": ${distance}`;
  }
}

/* Find parameter for intersects and within queries */
function spatialObjectQuery(req) {

  const collection = req.query.collection;
  const queryType = req.query.queryType;
  const coordinates = coordinateExpr(req.query.geometry.geometry.coordinates);

  return `"location":
         { "$${queryType}" :
            {
              "$geometry": { "type": "Polygon", "coordinates": ${coordinates} }
            }
          }`;
}

/* Find parameter for centre sphere querys */
function centerSphereQuery(req) {

  const collection = req.query.collection;
  const queryType = req.query.queryType;
  const coordinates = coordinateExpr(req.query.geometry.geometry.coordinates);
  const properties = req.query.geometry.properties;
  const filters = filtersExpr(req.query.filters);

  return `"location":
         { "$${queryType}" :
            {
              "$centerSphere": [ ${coordinates} , ${properties.radius} ]
            }
          }`;
}

/* Reverse array and stringify coordinates */
function coordinateExpr(coordinates) {
  reversedCoordinates = [...coordinates].reverse();
  return JSON.stringify(reversedCoordinates).replace(/['"]+/g, '');
}

module.exports = router;
