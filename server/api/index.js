var express = require('express');
var router = express.Router();

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now())
  next()
})

// define the about route
router.get('/', function (req, res) {
  res.send('all tasks');
})

// define the about route
router.get('/detail/:id', function (req, res) {
  res.send('task details');
})

// define the about route
router.get('/detail/:id/dnsrecord/', function (req, res) {
  res.send('task details');
})

// define the about route
router.get('/detail/:id/services/:ip', function (req, res) {
  res.send('task details');
})

router.get('/detail/:id/servicebanners/:ip/:port', function (req, res) {
  res.send('task details');
})

module.exports = router;