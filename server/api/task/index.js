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
router.get('/', function (req, res) {
  dbApi.getRecentDomainTasks()
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

// define the about route
router.get('/detail/:id', function (req, res) {
   dbApi.getDomainTask(req.params.id)
  .then(function(task){
    res.status(200)
    .json(utils.successJSONResponse(task))
    .end();
  })
  .catch(function(err){
    res.status(500)
    .json(utils.failedJSONResponse(err))
    .end()
  })
})

module.exports = router;