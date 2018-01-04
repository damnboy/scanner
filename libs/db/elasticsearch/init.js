var elasticsearch = require('elasticsearch');
var _ = require('lodash');
var util = require('util');
var log = require('../../../utils/logger.js').createLogger('[DB-CLIENT-ELASTICSEARCH]');

module.exports = function(options){

    var queuedConn = [];
    var globalConn;
    //createElasticSearchConnection调用对应db组件，给globalConn赋值
    (function (host, port){
        var client = new elasticsearch.Client({
            host: util.format('%s:%d', host, port)
        });
        client.ping({
            requestTimeout: 2000,
        }, function (error) {
            client.close()
            if (error) {
                log.error('Unable to connect to elasticsearch db %s:%d', host, port);
                log.error(error)
                queuedConn.forEach(function(promise){
                    promise.reject('connection is down');
                })
            } else {
                globalConn = 'connection is ok';
                log.info('ElastciSearch is Ready')
                queuedConn.forEach(function(promise){
                    promise.resolve(globalConn);
                })
            }
        });
    })(options.host, options.port);

    return {"connect" : function (){
        return new Promise(function(resolve, reject){
            if(globalConn){
                resolve(globalConn);
            }
            else{
                queuedConn.push({
                    "resolve" : resolve,
                    "reject" : reject
                })        
            }
        })
    }}
}


