const mongodb = require('mongodb')
const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const config = require('../config/config');
const map = config.defaultMapConnection;

/* Test a MongoDB database connection
  - Check whether a connection is able to successfully be made
  - Validate that more than one collection exists within the connected database
*/
router.get('/test-connection', async (req, res, next) => {
  const client = await establishConn(req.query);
  const db = client.db(req.query.database);

  db.listCollections().toArray(function(err, collections) {
    if (collections.length < 1) {
      next({
        message: 'No database exists with that name or no collections exist in the database'
      });
    }

    console.log('connected to ' + req.url);
    var response = {
      status: 200,
      success: 'Connection successfully established'
    }
    res.end(JSON.stringify(response));
  });
});

/* Retrieve a list of x number of documents within a MongoDB collection
  Note: Can be filtered on,
    - geospatial parameters (e.g. find objects within region)
    - Limit on the collectione (e.g. first 10 documents)*/
router.get('/find-documents', async (req, res) => {
  const client = await establishConn(req.query);
  const db = client.db(req.query.database);
  const collection = req.query.collection;

  const mode = req.query.mode;
  const findParam = findParams(req.query.searchParam);
  const shapeType = locType(req.query.toolMode);
  const limit = parseInt(req.query.limit);

  if (mode !== 'filters') {
    findParam['location.type'] = `${shapeType}`;
  }

  db.collection(collection).find(findParam).limit(limit).toArray(function(err, result) {
    let newResult = [];

    if (err) throw err;
    if (result.length === 0) {
      newResult.push(`No results matched your search criteria`);
    } else {
      newResult = renameField(result, Object.keys(findParam)[0]);
    }
    res.status(200).send(
      newResult
    );
  });
});

/* Run the generated MongoDB query */
router.get('/execute-query', async (req, res) => {
  const client = await establishConn(req.query);
  const db = client.db(req.query.database);
  const collection = req.query.collection;
  const query = JSON.parse(req.query.query);

  const limit = parseInt(req.query.limit);

  db.collection(collection).find(query).limit(limit).toArray(function(err, result) {
    if (err) {
      res.status(400).send(
        err
      );
    } else {
      res.status(200).send(
        result
      );
    }
  });
});

function findParams(searchParam) {
  findParam = {};

  for (key in searchParam) {
    if (searchParam.hasOwnProperty(key)) {
      findParam[key] = {
        '$regex': `${searchParam[key]}`,
        '$options': 'i'
      }
    }
  }

  return findParam;
}

function renameField(json, field) {
  json[renameField] = json.name;
  delete json[renameField];

  return json;
}

function locType(toolMode) {
  if (toolMode === 'near') {
    return 'Point';
  } else {
    return 'Polygon';
  }
}

/* Used to establish an inital connectiont to a MongoDB instance */
function establishConn(req) {

  let url = req.url;
  let username = req.username;
  let password = req.password;
  let database = req.database;

  /*  Auth or no Auth */
  if (username !== '' & password !== '') {
    url = 'mongodb://' + username + ':' + password + '@' + url + '/' + database;
  } else {
    url = 'mongodb://' + url + '/';
  }

  return new Promise((resolve, reject) => {
    MongoClient.connect(decodeURIComponent(url), {
      useNewUrlParser: true
    }, function(err, client) {
      if (err) {
        console.log('Error ' + err);
        reject(err);
      } else {
        resolve(client);
      }
    })
  });
}

module.exports = {
  router: router,
  establishConn: establishConn
}
