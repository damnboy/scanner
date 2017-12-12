var request = require('request');
var _ = require('lodash');
var util = require('util');
var log = require('../../../utils/logger.js');
var logger = log.createLogger('[DB-CLIENT-ELASTICSEARCH]');
module.exports = function(options){

    var DBClient = require('../dbclient');

    return new Promise(function(resolve, reject){
        var elasticsearch = require('elasticsearch');
        var client = new elasticsearch.Client({
            host: util.format('%s:%d', options.host, options.port)
        });

        client.ping({
            requestTimeout: 2000,
        }, function (error) {
            if (error) {
                client.close()
                logger.error('elasticsearch db client is down using fake instead...')
                resolve(new DBClient());
            } else {
                function server(){
                    var server = {
                        host : options.host,
                        port : options.port
                    }
                    return util.format('http://%s:%d', server.host, server.port)
                }
            
                DBClient.prototype.analyzeDNSRecord = function (){
                    var DSL = {
                        "aggs": {
                            "all_address": {
                                "terms": { "field": "domain" }
                            }
                        }
                    };
              
                    request.post({
                        'url' : server() + '/domain/record/_search',
                        'body': DSL, 
                        'json' : true
                    }, function(error, response){
                        if(error){
                            console.log(error)
                        }
                        else{
                            console.log(response.statusCode);
                            if(response.statusCode === 200){
                                console.log(response.body.aggregations.all_address.buckets)
                            }
                            else{
                                console.log(response.body)
                            }
                        }
                    })
                }
                DBClient.prototype.queryDNSRecord = function (domain){
                    var DSL_fulltext = {'query':{'match':{'domain':domain}}};
            
                    var DSL_fulltext_filter = {
                        "query" : {
                            "bool" : {
                                "must" : {
                                    "match" : {
                                        "domain" : domain
                                    }
                                },
                                "filter" : {
                                    "range" : {
                                        "count" : { "gt" : 1 } 
                                    }
                                }
                            }
                        }
                    }
                    
                    var DSL_phrase = {
                        "query" : {
                            "match_phrase" : {
                                "domain" : domain
                            }
                        }
                    }
                    
                    request.post({
                        'url' : server() + '/domain/record/_search',
                        'body': DSL_fulltext, 
                        'json' : true
                    }, function(error, response){
                        if(error){
                            console.log(error)
                        }
                        else{
                            /*
                            { _index: 'subdomain',
                _type: 'nsrecord',
                _id: 'mail.qq.com',
                _version: 5,
                result: 'updated',
                _shards: { total: 2, successful: 1, failed: 0 },
                created: false }
                */
                            console.log(response.statusCode);
                            if(response.statusCode === 200){
                                
                                response.body.hits.hits.forEach(function(record){
                                    console.log(record)
                                })
                            }
                            else{
                                
                            }
                        }
                    })
                }
                /*
                domain 会被elasticsearch引擎的分词器拆分，domain字段的检索变成全文检索，导致搜索结果不唯一
                搜索结果中包含权重值 "_score":         0.16273327, 
            
                */
                DBClient.prototype.saveDNSRecord =  function (record){
                    request.post({
                        'url' : server() + '/domain/record/',
                        'body' : _.assign(record , 
                            {
                                'create_date' : Date.now() ,
                                'task_id' : '00000000-0000-0000-000000000000',
                                'description' : 'description',
                                'remark' : 'remark'
                            }
                        ),
                        'json' : true
                    }, function(error, response){
                        if(error){
                            console.log(error)
                        }
                        else{
                            /*
                            { _index: 'subdomain',
                _type: 'nsrecord',
                _id: 'mail.qq.com',
                _version: 5,
                result: 'updated',
                _shards: { total: 2, successful: 1, failed: 0 },
                created: false }
                */
                            console.log(response.body)
                        }
                    })
                }
            
                logger.info('elasticsearch client is ready')
                resolve(new DBClient({
                    'host' : options.host,
                    'port' : options.port
                }));
        }});
    })
}
