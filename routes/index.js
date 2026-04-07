var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
    title: 'TripNetwork',
    message: 'Welcome to TripNetwork API Server'
  });
});

module.exports = router;
