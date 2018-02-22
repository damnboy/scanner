/*
    ERR/[WEBAPP-BANNER] 3691 [*] https://42.99.16.171:443 - socket hang up


    function socketOnEnd() {
    var socket = this;
    var req = this._httpMessage;
    var parser = this.parser;

    if (!req.res && !req.socket._hadError) {
        // If we don't have a response then we know that the socket
        // ended prematurely and we need to emit an error on the request.
        req.emit('error', createHangUpError());
        req.socket._hadError = true;
    }
    if (parser) {
        parser.finish();
        freeParser(parser, req, socket);
    }
    socket.destroy();
    }

    由socket上的end消息导致，
    fin消息并非来自client主动发起，而是endpoint的另一侧主动发送了fin消息。

    Event: 'end'#

    Added in: v0.1.90
    Emitted when the other end of the socket sends a FIN packet, thus ending the readable side of the socket.

    By default (allowHalfOpen is false) the socket will send a FIN packet back and destroy its file descriptor once it has written out its pending write queue. 
    However, if allowHalfOpen is set to true, the socket will not automatically end() its writable side, allowing the user to write arbitrary amounts of data. 
    The user must call end() explicitly to close the connection (i.e. sending a FIN packet back).

    设置allowHalfOpen属性，主动调用end无法fix这个bug
    
    Request is designed to be the simplest way possible to make http calls. It supports HTTPS and follows redirects by default.
    添加followRedirect选项，可fix
*/
var util = require('util');
var request = require('request');
var iconv  = require('iconv-lite');
var settings = require('../../settings');

function 
WebPage(){
    this.encoding = '';
    this.request;
}

WebPage.prototype.request = function(url){
    var self = this;
    return new Promise(function(resolve, reject){
        request.get({
            timeout : settings.timeout.web,
            url : url,
            //启动该选项会导致部分站点出现socket hang up错误，3xx前与3xx之后schema不一致导致？？？
            followRedirect: false, 
            agentOptions : {
                rejectUnauthorized : false,
                "checkServerIdentity" : function (servername, cert){
                    //console.log(servername, cert);
                }
            }
        }, function(err, response){
            if(err){
                reject(err);
            }
            else{ 
                resolve(response);           
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
        e = body.match(/charset=['"]*([\w\d-]*)['"]*[\w\s]*/i);
    }

    if(e === null){
        e = ['utf-8', 'utf-8']
    }
    return e[1];
}
/*
WebPage.prototype.url_request = function(url){
    
    return this.request({
        'id' : this.hosts.length,
        'description' : url,
        'request' : {
            'method' : 'GET',
            'uri' : url,
            'timeout' : settings.timeout.web,
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
*/

module.exports = WebPage;