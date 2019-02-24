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
      next({message: 'No database exists with that name or no collections exist in the database'});
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
      "$project": {
        "arrayofkeyvalue": {
          "$objectToArray": "$$ROOT"
        }
      }
    },
    {
      "$unwind": "$arrayofkeyvalue"
    },
    {
      "$group": {
        "_id": null,
        "allkeys": {
          "$addToSet": "$arrayofkeyvalue.k"
        }
      }
    }
  ]).toArray(function(err, result) {
    res.status(200).send(
      result[0].allkeys
    );
  });
});

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
