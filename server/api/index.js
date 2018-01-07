var express = require('express');
var router = express.Router();
var dbApi = require('../../libs/db')
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
    .json(tasks)
    .end();
  })
  .catch(function(err){
    res.status(500)
    .json({

      "status" : "failed",
      "data" : err
    })
  })

})

// define the about route
router.get('/detail/:id', function (req, res) {
   dbApi.getDomainTask(req.params.id)
  .then(function(task){
    res.status(200)
    .json(task)
    .end();
  })
  .catch(function(err){
    res.status(500)
    .json({

      "status" : "failed",
      "data" : err
    })
  })
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