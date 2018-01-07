var express = require('express');
var router = express.Router();
var dbApi = require('../../../libs/db')
var utils = require('../../utils')
// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now())
  next()
})

// define the about route
router.get('/:taskId/:offset', function (req, res) {
  res.send('dnsrecord details');
})


// define the about route
router.post('/detail', function (req, res) {
  res.send('task details');
})

module.exports = router;