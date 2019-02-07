const express = require('express');
require('express-async-errors');
const mongoDB = require('../routes/mongoDBConnection')
const map = require('../routes/map');
const path = require('path');
const error = require('../middleware/error');

module.exports = function(app) {
  app.use(express.static(path.join(__dirname, '../public')));
  app.use('/api/mongoDB', mongoDB.router);
  app.use('/api/map', map);
  app.use(error);
  app.set('view engine', 'ejs');
  app.get('/', function (req, res) {
	res.render('index');
  })
  app.get('/map', function (req, res) {
  res.render('map');
  })
}
