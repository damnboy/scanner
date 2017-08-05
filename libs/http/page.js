
var util = require('util');
var request = require('request');
var iconv  = require('iconv-lite');

function WebPage(){
    this.encoding = '';
    this.request;
}

WebPage.prototype.request = function(options){
    var self = this;
    return new Promise(function(resolve, reject){
        request(options, function(err, response){
            if(err){
                reject(err)
            }
            else{ 
                resolve(response)           
            }   
        })
    })
    .then(function(response){
        self.encoding = self._detectEncoding(response.headers, response.body);
        if(self.encoding.toLowerCase() === 'utf-8'){
            response.body = response.body.toString();
            
        }
        else{
            var s = iconv.decode(response.body, self.encoding);
            response.body = s.toString('utf-8');
        } 
        return response;   
    })
}

WebPage.prototype._detectEncoding = function(headers, body){
    var e = null;
    if(headers['content-type']){
        e = headers['content-type'].match(/charset=([\w\d-]*)$/i);
    }

    if(e === null){
        ///<meta\s*(http-equiv="*content-type"*)(content="text\/html; charset=([\w\d-]*)")[\s\/]*>/i
        ///content="text\/html; charset=([\w\d-]*)"/i
        body = body.toString('utf-8')
        e = body.match(/charset="*([\w\d-]*)"*[\w\s]*/i);

    }

    if(e === null){
        e = ['utf-8', 'utf-8']
    }
    return e[1];
}

WebPage.prototype.url_request = function(url){

    return this.request({
        'id' : this.hosts.length,
        'description' : url,
        'request' :{
            'method' : 'GET',
            'uri' : url,
            'timeout' : 10000,
            'encoding' : null
        }
    });

}

WebPage.prototype.host_request = function(host, port, ssl){

    if(ssl){
        return this.url(util.format('https://%s:%d', host, port))
    }

    return this.url(util.format('http://%s:%d', host, port))
}


module.exports = WebPage;