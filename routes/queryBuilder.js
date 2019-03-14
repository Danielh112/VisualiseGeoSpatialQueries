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
    query = spatialObjectQuery(req, next);
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
         }
     }
   )`;
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
  const properties = req.query.geometry.geometry.properties;

  console.log(coordinates);

  return `
  db.${collection}.find(
    {
       "location":
         { "$${queryType}" :
            {
              "$geometry": { "type": "Polygon", "coordinates": ${coordinates} }
            }
         }
     }
   )`;
}

function centerSphereQuery(req) {

  const collection = req.query.collection;
  const queryType = req.query.queryType;
  const coordinates = coordinateExpr(req.query.geometry.geometry.coordinates);
  const properties = req.query.geometry.properties;

  //$geoWithin: { $centerSphere: [ [ <x>, <y> ], <radius> ] }

  return `
  db.${collection}.find(
    {
       "location":
         { "$${queryType}" :
            {
              "$centerSphere": [ ${coordinates} , ${properties.radius} ]
            }
         }
     }
   )`;
}

/* Reverse array and stringify coordinates */
function coordinateExpr(coordinates) {
  reversedCoordinates = [...coordinates].reverse();
  return JSON.stringify(reversedCoordinates).replace(/['"]+/g, '');
}

module.exports = router;
