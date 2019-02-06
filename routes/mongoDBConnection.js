const mongodb = require('mongodb')
const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const config = require('../config/config');
const map = config.defaultMapConnection;

router.get('/testConnection', async (req, res) => {
  const client = await establishConn(req);

  var response = {
    status  : 200,
    success : 'Connection successfully established'
  }
  res.end(JSON.stringify(response));
});

router.get('/getCollections', async (req, res) => {
  const client = await establishConn(req);
  const db = client.db(map.db);
  db.listCollections().toArray(function(err, collections) {
    if (err) throw err;
    res.status(200).send(
      collections
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
