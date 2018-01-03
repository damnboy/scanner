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

                DBClient.prototype.getDomainTask = function(id){
                    return new Promise(function(resolve, reject){   
                        var url = server() + '/domaintask/doc/_search?q=id:'+id;
                        logger.info(url);
                        request.get({
                            'url' : url,
                            "json" : true
                        }, function(error, response){
                            logger.info(response.body)
                            if(error){
                                reject(error)
                            }
                            else if(response.statusCode === 200 && response.body.hits.hits.length === 1){
                                resolve(response.body.hits.hits[0]._source);
                            }
                            else{
                                reject(response.body);
                            }
                        })
                    }) 
                }

                DBClient.prototype.saveDomainTask = function(taskInfo){
                    return new Promise(function(resolve, reject){   
                        request.post({
                            'url' : server() + '/domaintask/doc',
                            'body' : taskInfo,
                            'json' : true
                        }, function(error, response){
                            if(error){
                                reject(error);
                            }
                            else if(response.statusCode === 201){
                                resolve(response.body);
                            }
                            else{
                                reject(response.body);
                            }
                        })
                    })
                }

                DBClient.prototype.doneNmapTask = function(doc){
                    return new Promise(function(resolve, reject){   
                        request.post({
                            'url' : server() + '/services/doc/' + doc._id + '/_update',
                            'body' : 
                                {
                                    "doc":
                                        _.assign(doc._source , {
                                        'scanned_date' : Date.now() ,
                                        'done' : true})
                                    
                                },
                            'json' : true
                        }, function(error, response){
                            if(error){
                                reject(error)
                            }
                            else if(response.statusCode === 200){
                                resolve(response.body)
                            }
                            else{
                                reject(response.statusCode)
                            }
                        })
                    })
                }
                //els排序
                DBClient.prototype.getScheduledNmapTask = function(){
                    //TODO 清空servicebanner中对应任务下的banner记录
                    return new Promise(function(resolve, reject){
                        request.get({
                            'url' : server() + '/services/_search?size=1',
                            'body' : {
                                "query" :{
                                    "bool" :{
                                        "filter" : [
                                            { "term" :{"done" : false} }
                                        ]
                                    }
                                },
                                "sort": { "create_date": "asc"} 
                            },
                            'json' : true
                        }, function(error, response){
                            if(error){
                                reject(error)
                            }
                            else if(response.statusCode === 200 && response.body.hits.hits.length === 1){
                                resolve(response.body.hits.hits[0]);
                            }
                            else{
                                reject(response.statusCode)
                            }
                        })
                    })
                }

                DBClient.prototype.scheduleNmapTask = function(record){
                    request.post({
                        'url' : server() + '/services/doc/',
                        'body' : _.assign(record , 
                            {
                                'create_date' : Date.now() ,
                                'done' : false
                            }
                        ),
                        'json' : true
                    }, function(error, response){
                        if(error){
                            logger.error(error);
                        }
                        else{
                            ;//logger.info(response.body);
                        }
                    })
                }

                DBClient.prototype.saveWhoisRecord = function(record){
                    request.post({
                        'url' : server() + '/whois/doc/',
                        'body' : _.assign(record , 
                            {
                                'create_date' : Date.now() ,
                                'description' : 'description',
                                'remark' : 'remark'
                            }
                        ),
                        'json' : true
                    }, function(error, response){
                        if(error){
                            logger.error(error);
                        }
                        else{
                            ;//logger.info(response.body);
                        }
                    })
                }
                /*
                domain 会被elasticsearch引擎的分词器拆分，domain字段的检索变成全文检索，导致搜索结果不唯一
                搜索结果中包含权重值 "_score":         0.16273327, 
            
                */
                DBClient.prototype.saveDNSRecord =  function (record){
                    request.post({
                        'url' : server() + '/dnsrecord/doc/',
                        'body' : _.assign(record , 
                            {
                                'create_date' : Date.now() ,
                                'description' : 'description',
                                'remark' : 'remark'
                            }
                        ),
                        'json' : true
                    }, function(error, response){
                        if(error){
                            logger.error(error);
                        }
                        else{
                            ;//logger.info(response.body);
                        }
                    });
                };
            
                logger.info('elasticsearch client is ready');
                resolve(new DBClient({
                    'host' : options.host,
                    'port' : options.port
                }));
        }});
    });
};
