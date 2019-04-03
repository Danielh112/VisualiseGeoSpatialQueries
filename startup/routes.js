const express = require('express');
require('express-async-errors');
const bodyParser = require("body-parser");
const mongoDB = require('../routes/mongoDBConnection')
const mongoDBCollection = require('../routes/mongoDBCollection')
const map = require('../routes/map');
const queryBuilder = require('../routes/queryBuilder');
const nlpQueryBuilder = require('../routes/nlpQueryBuilder');
const path = require('path');
const error = require('../middleware/error');

module.exports = function(app) {
  app.use(express.static(path.join(__dirname, '../public')));
  app.use('/api/mongoDB', mongoDB.router);
  app.use('/api/mongoDB/collection', mongoDBCollection);
  app.use('/api/map', map);
  app.use('/api/query', queryBuilder);
  app.use('/api/query/breakdown', nlpQueryBuilder);
  app.use(error);
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.set('view engine', 'ejs');
  app.get('/', function (req, res) {
	res.render('index');
  })
  app.get('/map', function (req, res) {
  res.render('map');
  })
}
