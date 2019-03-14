const mongodb = require('mongodb')
const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const config = require('../config/config');
const map = config.defaultMapConnection;

router.get('/testConnection', async (req, res, next) => {
  const client = await establishConn(req);
  const db = client.db(req.query.database);

  db.listCollections().toArray(function(err, collections) {
    if (collections.length < 1) {
      next({
        message: 'No database exists with that name or no collections exist in the database'
      });
    }

    var response = {
      status: 200,
      success: 'Connection successfully established'
    }
    res.end(JSON.stringify(response));
  });
});

router.get('/collection', async (req, res) => {
  const client = await establishConn(req);
  const db = client.db(req.query.database);
  db.listCollections().toArray(function(err, collections) {
    if (err) throw err;
    res.status(200).send(
      collections
    );
  });
});

router.get('/collection/attributes', async (req, res) => {
  let collection = req.query.collection;

  const client = await establishConn(req);
  const db = client.db(req.query.database);

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
    }
  ]).toArray(function(err, result) {
    res.status(200).send(
      result[0].allkeys
    );
  });
});

router.get('/collection/size', async (req, res) => {
  let collection = req.query.collection;

  const client = await establishConn(req);
  const db = client.db(req.query.database);

  db.collection(collection).estimatedDocumentCount({}, function(err, result) {
    if (err) throw err;
    console.log(result);
    res.status(200).send({
      'documentCount': result
    });
  });
});

router.get('/findDocuments', async (req, res) => {
  const client = await establishConn(req);
  const db = client.db(req.query.database);
  const collection = req.query.collection;

  const mode = req.query.mode;
  const searchParam = req.query.searchParam;
  const shapeType = locType(req.query.toolMode);
  const limit = parseInt(req.query.limit);

  let findParam = {};

  for (key in searchParam) {
    if (searchParam.hasOwnProperty(key)) {
      findParam[key] = {
        '$regex': `${searchParam[key]}`,
        '$options': 'i'
      }
    }
  }

  if (mode !== 'filters') {
    findParam['location.type'] = `${shapeType}`;
  }

  db.collection(collection).find(findParam, { projection: { [`${Object.keys(findParam)[0]}`]: 1 }}).limit(limit).toArray(function(err, result) {
    newResult = '';

    if (err) throw err;
    if (result.length === 0) {
      newResult.push(`No results matched your search criteria`);
    } else {
      newResult = result.map(function(object) {
         return { _id: object['_id'], name: object[Object.keys(findParam)[0]]};
      });
    }
    res.status(200).send(
      newResult
    );
  });
});

router.get('/executeQuery', async (req, res) => {
  const client = await establishConn(req);
  const db = client.db(req.query.database);
  const collection = req.query.collection;

  const query = JSON.parse(req.query.query);
  const limit = parseInt(req.query.limit);

  db.collection(collection).find(query).limit(limit).toArray(function(err, result) {
    if (err) throw err;
    res.status(200).send(
      result
    );
  });
});

function locType(toolMode) {
  if (toolMode === 'near') {
    return 'Point';
  } else {
    return 'Polygon';
  }
}

function establishConn(req) {

  let url = req.query.url;
  let username = req.query.username;
  let password = req.query.password;
  let database = req.query.database;

  /*  Auth or no Auth */
  if (username & password) {
    url = 'mongodb://' + username + ':' + password + '@' + url + '/' + database;
  } else {
    url = 'mongodb://' + url + '/';
  }

  return new Promise((resolve, reject) => {
    MongoClient.connect(url, {
      useNewUrlParser: true
    }, function(err, client) {

      if (err) {
        reject(err);
      } else {
        console.log('connected to ' + req.query.url);
        resolve(client);
      }
    })
  });
}

module.exports = {
  router: router,
  establishConn: establishConn
}
