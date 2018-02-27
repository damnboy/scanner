var MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');
var util = require('util');
var log = require('../../../utils/logger.js').createLogger('[DB-CLIENT-MONGODB]');

module.exports = function(options){
    var queuedConn = [];
    var globalConn;
    //createElasticSearchConnection调用对应db组件，给globalConn赋值
    (function (uri){//host, port, username, password){
        //var uri = util.format("mongodb://%s:%s@%s:%d/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin",username, password, host, port)
        MongoClient.connect(uri, function(err, client) {
            if(err){
                log.error('Unable to connect to mongdb %s:%d', host, port);
                log.error(err);
                queuedConn.forEach(function(promise){
                    promise.reject('connection is down');
                });
            }
            else{
                globalConn = client;
                log.info('mongdb client is ready');
                queuedConn.forEach(function(promise){
                    promise.resolve(globalConn);
                });
            }
        });
    })(options.uri);

    return {"connect" : function (){
        return new Promise(function(resolve, reject){
            if(globalConn){
                resolve(globalConn);
            }
            else{
                queuedConn.push({
                    "resolve" : resolve,
                    "reject" : reject
                });        
            }
        });
    }};
};


