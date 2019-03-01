const mongodb = require('mongodb')
const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const GeoJSON = require('geojson');
const mongoDBConnection = require('./mongoDBConnection.js');
const config = require('../config/config');
const _ = require('underscore');

const latLongLabels = ['latitude', 'longitude', 'lat', 'long'];
const locLabels = ['loc', 'location', 'Loc', 'Location'];

router.get('/', async (req, res) => {
  let collection = req.query.collection;

  const client = await mongoDBConnection.establishConn(req);
  const db = client.db(req.query.database);
  db.collection(collection).find({}).limit(config.mapLimit).toArray(function(err, result) {
    if (err) throw err;
    res.status(200).send(
      parseJson(result)
    );
  });
});


/* Parse the JSON and deterimine the structure of the file
   Case 1: lat and long
   Case 2: loc and Location
   Else: Throw error, data needs to be in below format to be visualised*/

function parseJson(json) {
  let keys = Object.keys(json[0]);

  conLatLong = _.intersection(keys, latLongLabels);
  console.log(conLatLong);
  if (conLatLong.length > 0) {
    return GeoJSON.parse(json, {Point: [conLatLong[0], conLatLong[1]]});
  }

  conLocLabels = _.intersection(keys, locLabels);
  if (conLocLabels.length > 0) {
    return GeoJSON.parse(json, {GeoJSON: conLocLabels[0]});
  }

  throw console.error('GeoJson needs to be in format of lat, long, or loc{}, location{}');
}

module.exports = router;
