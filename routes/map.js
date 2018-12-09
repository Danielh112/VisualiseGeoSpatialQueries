const mongodb = require('mongodb')
const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
var GeoJSON = require('geojson');

const map = {
  url: 'mongodb://172.17.0.2:27017/',
  db: 'spatialDB',
  collection: 'spatialObj'
}

router.get('/', async (req, res) => {
  const client = await establishConn();
  const db = client.db(map.db);
  db.collection(map.collection).find({}).toArray(function(err, result) {
    if (err) throw err;
    res.status(200).send(
      // TODO better parsing limited
      GeoJSON.parse(result, {GeoJSON: 'location'})
      );
  });
});

// MOVE OUT
function establishConn() {
  return new Promise((resolve, reject) => {
    MongoClient.connect(map.url, { useNewUrlParser: true }, function (err, client) {
      if (err) {
        console.log("Error Connecting to Default DB" + err);
      }
      else {
        console.log('connected to ' + map.url);
        resolve(client);
      }
    })
  });
}

module.exports = router;