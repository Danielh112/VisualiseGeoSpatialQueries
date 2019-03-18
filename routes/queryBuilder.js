const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {

  let query = '';
  const queryType = req.query.queryType;


  if (queryType === 'near' || queryType === 'nearSphere') {
    query = nearQuery(req, next);
  }

  /* If the geospatial object does not contain properties
  it means we are searching within/interesecting a spatial polygon */

  if (queryType === 'geoIntersects' || queryType === 'geoWithin') {
    if (req.query.geometry.properties == undefined) {
      query = spatialObjectQuery(req, next);
    } else {
      query = centerSphereQuery(req, next);
    }
  }

  var response = {
    status: 200,
    query: query
  }
  res.end(JSON.stringify(response));
});

function nearQuery(req) {

  const collection = req.query.collection;
  const queryType = req.query.queryType;
  const filters = filtersExpr(req.query.filters);
  const coordinates = req.query.geometry.coordinates;
  const maxDistance = maxDistanceExpr(req.query.maxDistance);
  const minDistance = minDistanceExpr(req.query.minDistance);

  return `
  db.${collection}.find(
    {
       "location":
         { "$${queryType}" :
            {
              "$geometry": { "type": "Point", "coordinates": [${coordinates}] }
              ${maxDistance}
              ${minDistance}
            }
         } ${filters}
    }
   )`;
}

function filtersExpr(filters) {
  if (filters === undefined || filters != ' ') {
    return '';
  } else {

    return `,${filters.replace('{','').replace('}','')}`;
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


function spatialObjectQuery(req) {

  const collection = req.query.collection;
  const queryType = req.query.queryType;
  const coordinates = coordinateExpr(req.query.geometry.geometry.coordinates);
  const filters = filtersExpr(req.query.filters);

  return `
  db.${collection}.find(
    {
       "location":
         { "$${queryType}" :
            {
              "$geometry": { "type": "Polygon", "coordinates": ${coordinates} }
            }
         } ${filters}
     }
   )`;
}

function centerSphereQuery(req) {

  const collection = req.query.collection;
  const queryType = req.query.queryType;
  const coordinates = coordinateExpr(req.query.geometry.geometry.coordinates);
  const properties = req.query.geometry.properties;
  const filters = filtersExpr(req.query.filters);

  return `
  db.${collection}.find(
    {
       "location":
         { "$${queryType}" :
            {
              "$centerSphere": [ ${coordinates} , ${properties.radius} ]
            }
         } ${filters}
     }
   )`;
}

/* Reverse array and stringify coordinates */
function coordinateExpr(coordinates) {
  reversedCoordinates = [...coordinates].reverse();
  return JSON.stringify(reversedCoordinates).replace(/['"]+/g, '');
}

module.exports = router;
