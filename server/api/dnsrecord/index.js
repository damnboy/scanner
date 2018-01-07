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
    dbApi.getDNSARecordsByTaskId(req.params.taskId, req.params.offset)
    .then(function(records){
        res.status(200)
        .json(utils.successJSONResponse(records.map(function(r){
            return {
                "domain" : r.domain,
                "data" : r.a
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

/*
    http://127.0.0.1:3000/dnsrecord/detail
    task_id=6c746750-f074-11e7-895b-25fb9132e396&domain=www.qq.com&ip=1.1.1.1
    原始参数提交到db接口进行组装，生成专用的查询语法
*/
router.post('/detail', function (req, res) {
    res.status(200)
    .json(req.body)
    .end()
})


module.exports = router;