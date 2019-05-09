const mongodb = require('mongodb')
const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const mongoDBConnection = require('./mongoDBConnection.js');
const config = require('../config/config');
const map = config.defaultMapConnection;
var qs = require('querystring');


router.get('/', async (req, res) => {
  const client = await mongoDBConnection.establishConn(req.query);
  const db = client.db(req.query.database);
  db.listCollections().toArray(function(err, collections) {
    if (err) throw err;
    res.status(200).send(
      collections
    );
  });
});

router.get('/attributes', async (req, res) => {
  let collection = req.query.collection;

  const client = await mongoDBConnection.establishConn(req.query);
  const db = client.db(req.query.database);

  const collectionAttributes = await getCollectionAttributes(db, collection);

  res.status(200).send(collectionAttributes);

});

router.get('/size', async (req, res) => {
  const collection = req.query.collection;

  const client = await mongoDBConnection.establishConn(req.query);
  const db = client.db(req.query.database);

  db.collection(collection).estimatedDocumentCount({}, function(err, result) {
    if (err) throw err;
    res.status(200).send({
      'documentCount': result
    });
  });
});

router.get('/attribute/type', async (req, res) => {
  let collection = req.query.collection;

  const client = await mongoDBConnection.establishConn(req.query);
  const db = client.db(req.query.database);

  const attr = req.query.attribute;
  let attrType = '';

  db.collection(collection).findOne({}, function(err, result) {
    if (err) throw err;

    for (let key in result) {
      if (result.hasOwnProperty(key)) {
        console.log(key + ":" + attr);
        if (key === attr) {
          attrType = typeof result[key];
        }
      }
    }

    res.status(200).send({
      'attributeType': attrType
    });
  });
});

router.get('/size', async (req, res) => {
  const collection = req.query.collection;

  const client = await mongoDBConnection.establishConn(req.query);
  const db = client.db(req.query.database);

  db.collection(collection).estimatedDocumentCount({}, function(err, result) {
    if (err) throw err;
    res.status(200).send({
      'documentCount': result
    });
  });
});

router.get('/index/geospatial', async (req, res) => {

  const client = await mongoDBConnection.establishConn(req.query);
  const db = client.db(req.query.database);
  const collection = req.query.collection;

  db.collection(collection).indexes({}, function(err, result) {
    if (err) throw err;

    let spatialIndex = {};

    result.forEach(function(indexObj) {
      if (indexObj.hasOwnProperty('2dsphereIndexVersion')) {
        spatialIndex = indexObj;
      }
    });

    if (Object.entries(spatialIndex).length === 0) {
      res.status(200).send({
        spatialIndex: 'Not Found'
      });
    } else {
      res.status(200).send({
        spatialIndex: spatialIndex
      });
    }
  });
});

router.post('/index/geospatial', async (req, res, next) => {

  let body = '';
  req.on('data', function(data) {
    body += data;
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });
  req.on('end', async function() {

    const query = qs.parse(body);

    const client = await mongoDBConnection.establishConn(query);
    const db = client.db(query.database);
    const collection = query.collection;
    const geospatialIndex = geospatialIndexBuilder(query.attribute, next);

    db.collection(collection).createIndex(geospatialIndex, function(err, result) {
      if (err) {
        next(err);
      } else {
        res.status(200).send({
          spatialIndex: result
        });
      }
    });


  });
});

function geospatialIndexBuilder(attribute, next) {
  if (attribute !== undefined) {
    return JSON.parse(`{ "${attribute}" : "2dsphere" }`);
  } else {
    next('Please provide the attribute on which to create the index');
  }
}

function getCollectionAttributes(db, collection) {
  return new Promise((resolve, reject) => {
    var result = db.collection(collection).aggregate([{
        '$project': {
          'arrayofkeyvalue': {
            '$objectToArray': '$$ROOT'
          }
        }
      },
      {
        '$unwind': '$arrayofkeyvalue'
      },
      {
        '$group': {
          '_id': null,
          'allkeys': {
            '$addToSet': '$arrayofkeyvalue.k'
          }
        }
      }, {'$limit' : 100}
    ]).toArray(function(err, result) {
      if (Object.entries(result).length > 0) {
        resolve(result[0].allkeys);
      } else {
        resolve(result);
      }
    });
  });
}

module.exports = router;
