const mongodb = require('mongodb')
const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const GeoJSON = require('geojson');
const mongoDBConnection = require('./mongoDBConnection.js');
const config = require('../config/config');
const map = config.defaultMapConnection;

router.get('/', async (req, res) => {
  let database = req.query.database;
  let collection = req.query.collection;

  const client = await mongoDBConnection.establishConn(req);
  const db = client.db(map.db);
  db.collection(collection).find({}).toArray(function(err, result) {
    if (err) throw err;
    res.status(200).send(
      // TODO better parsing limited
      GeoJSON.parse(result, {GeoJSON: 'location'})
      );
  });
});

module.exports = router;
