var express = require('express');
var router = express.Router();
var dashboard = require('../../../libs/db/mongodb/dashboard')
var utils = require('../../utils')
// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now())
  next()
})

// define the about route
//00b8fe60-2754-11e8-ac07-27d04a0ff43d/223.221.8.7/8891
router.get('/:taskId/:ip/:port', function (req, res) {
  dashboard.getBanner(req.params.taskId, req.params.ip, req.params.port)
    .then(function(records){
        res.status(200)
        .json(utils.successJSONResponse(records))
        .end()
    })
    .catch(function(err){
        res.status(500)
        .json(utils.failedJSONResponse(err))
        .end()
    })
})
module.exports = router;
/*
router.get('/:taskId/:offset', function (req, res) {
  res.send('dnsrecord details');
})


// define the about route
router.post('/detail', function (req, res) {
  res.send('task details');
})
*/
