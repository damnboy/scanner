var express = require('express');
var router = express.Router();

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now())
  next()
})

// define the about route
router.get('/application', function (req, res) {
  res
  .status(200)
  .json({
      "status" : "success",
      "data" : {
          
      }
  }).end()

})

// check db status
router.get('/database', function (req, res) {
  res.send('task details');
})


module.exports = router;