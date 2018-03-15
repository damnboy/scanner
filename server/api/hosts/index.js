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
router.get('/:taskId', function (req, res) {
  dashboard.getHosts(req.params.taskId)
  .then(function(tasks){
    res.status(200)
    .json(utils.successJSONResponse(tasks))
    .end();
  })
  .catch(function(err){
    res.status(500)
    .json(utils.failedJSONResponse(err))
    .end()
  })
})

module.exports = router;