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
    dbApi.getServices({"task_id":req.params.taskId}, req.params.offset)
    .then(function(records){
        res.status(200)
        .json(utils.successJSONResponse(records.map(function(r){
            return {
                "ip" : r.ip,
                "done" : r.done,
                "scanned_date" : r['scanned_date'],
                "tcp" : r.tcp
            }
        })))
        .end()
    })
    .catch(function(err){
        res.status(500)
        .json(utils.failedJSONResponse(err))
        .end()
    })
})

// define the about route
router.post('/detail', function (req, res) {
    console.log(req.body)
    dbApi.getBanners(req.body, 0)
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