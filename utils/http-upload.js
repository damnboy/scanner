var request = require('request');

var path = require('path')

function upload(url, cookie, buildFormData){
    return new Promise(function(resolve, reject){
        var r = request.post({
            'formData' : buildFormData(),
            'url': url,
            'proxy' : 'http://192.168.180.140:8080',
            'headers' : {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:45.0) Gecko/20100101 Firefox/45.0',
                'Cookie': cookie
            }}, function(err, response, body){
                if(err){
                    console.log(err);
                    reject(err)
                }
                else if(response.statusCode >= 500){
                    reject(response.body)
                }
                else{
                    resolve(response)
                }
            });
    })
}

module.exports = upload