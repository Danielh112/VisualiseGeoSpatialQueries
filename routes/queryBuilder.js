const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {

  let query = '';
  const queryType = req.query.queryType;

  if (queryType === 'near' || queryType === 'nearSphere') {
    query = nearQuery(req, next);
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
       location:
         { $${queryType} :
            {
              $geometry: { type: "Point", coordinates: [${coordinates}] }
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
    return `,$maxDistance: ${distance}`;
  }
}

function minDistanceExpr(distance) {
  if (distance === undefined) {
    return '';
  } else {
    return `,$minDistance: ${distance}`;
  }
}



module.exports = router;
