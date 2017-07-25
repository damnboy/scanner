var request = require('request');


function _request(options){
   return new Promise(function(resolve, reject){
       request(options, function(err, response, body){
           if(err){
               reject(err)
           }
           else{
               resolve(response)
           }   
       })
   })
}

var uri = 'http://127.0.0.1';
_request({
    'method' : 'OPTIONS',
    'uri' : uri
})
.then(function(response){
    console.log('[%d] %s', response.statusCode, uri);
    Object.keys(response.headers).forEach(function(tag){
        console.log('\t%s:%s', tag, response.headers[tag]);
    })
})
.catch(function(err){
    console.log(err);
})