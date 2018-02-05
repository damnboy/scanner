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
router.get('/:taskId', function (req, res) {
    dbApi.getJoinedNetnames(req.params.taskId)
    .then(function(results){
        res.status(200)
        .json(utils.successJSONResponse(results))
        .end();
    })
    .catch(function(err){
        res.status(500)
        .json(utils.failedJSONResponse(err))
        .end()
    })
})

router.get('/netblocks/:taskId/:netName', function (req, res) {
    dbApi.getNetblocks(req.params.taskId, req.params.netName)
    .then(function(records){
        res.status(200)
        .json(utils.successJSONResponse(records.map(function(r){
            return r
        })))
        .end()
    })
    .catch(function(err){
        res.status(500)
        .json(utils.failedJSONResponse(err))
        .end()
    })
})

router.get('/hosts/:taskId/:netBlock', function (req, res) {
    dbApi.getHostsOnNetblock(req.params.taskId, req.params.netBlock)
    .then(function(records){
        res.status(200)
        .json(utils.successJSONResponse(records.map(function(r){
            return r
        })))
        .end()
    })
    .catch(function(err){
        res.status(500)
        .json(utils.failedJSONResponse(err))
        .end()
    })
})
module.exports = router;