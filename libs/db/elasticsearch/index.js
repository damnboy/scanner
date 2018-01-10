module.exports = function(options){

    var db = require('./init')(options)
    var DBApi = require('../api');
    var request = require("request")
    var util = require("util")
    var log = require('../../../utils/logger').createLogger('[db:elasticsearch]');
    var _ = require("lodash")
    function server(){
        return util.format('http://%s:%d', options.host, options.port)
    }

    DBApi.prototype.analyzeDNSRecord = function (){
        return db.connect()
        .then(function(){
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
        })

    }

    DBApi.prototype.queryDNSRecord = function (domain){

        return db.connect()
        .then(function(){
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
        })
    }

    /*
    curl -i 192.168.100.254:9200/domaintask/_search?pretty -H 'Content-Type: application/json' -d '{
"sort" :[{"createDate":"desc"}]}'

    */
    DBApi.prototype.getRecentDomainTasks = function(){
        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){
                request.post({
                    'url' : server() + '/domaintask/_search',
                    'body' : {"sort" :[{"createDate":"desc"}]},
                    "json" : true
                }, function(error, response){
                    if(error){
                        reject(error);
                    }
                    else if(response.statusCode === 200){
                        resolve(response.body.hits.hits.map(function(result){
                            return result._source;
                        }));
                    }
                    else{
                        reject(response.body);
                    }
                })
            })
        })
    }

    DBApi.prototype.getDomainTask = function(id){
        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){   
                var url = server() + '/domaintask/doc/_search?q=id:'+id;
                request.get({
                    'url' : url,
                    "json" : true
                }, function(error, response){
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
        })
    }

    DBApi.prototype.saveDomainTask = function(taskInfo){
        return db.connect()
        .then(function(){
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
        })
    }
    DBApi.prototype.doneNmapTask = function(hostInfo, id){
        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){   
                request.post({
                    'url' : server() + '/services/doc/' + id + '/_update',
                    'body' : 
                        {
                            "doc":
                                _.assign(hostInfo , {
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
        })
    }
    //els排序
    DBApi.prototype.getScheduledNmapTask = function(){
        //TODO 清空servicebanner中对应任务下的banner记录
        return db.connect()
        .then(function(){
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
        })
    }
    DBApi.prototype.scheduleNmapTask = function(record){
        return db.connect()
        .then(function(){
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
                    log.error(error);
                }
                else{
                    ;//logger.info(response.body);
                }
            })
        })

    }
    DBApi.prototype.saveWhoisRecord = function(record){
        return db.connect()
        .then(function(){
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
                    log.error(error);
                }
                else{
                    ;//log.info(response.body);
                }
            })
        })
    }
    /*
    domain 会被elasticsearch引擎的分词器拆分，domain字段的检索变成全文检索，导致搜索结果不唯一
    搜索结果中包含权重值 "_score":         0.16273327, 

    */
    DBApi.prototype.saveDNSRecord =  function (record){
        return db.connect()
        .then(function(){
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
                    log.error(error);
                }
                else{
                    ;//log.info(response.body);
                }
            });
        })
    };

    DBApi.prototype.saveBanner = function(banner){
        return db.connect()
        .then(function(){
            request.post({
                'url' : server() + '/servicebanner/doc/',
                'body' : _.assign(banner , 
                    {
                        'create_date' : Date.now() ,
                        'description' : 'description',
                        'remark' : 'remark'
                    }
                ),
                'json' : true
            }, function(error, response){
                if(error){
                    log.error(error);
                }
                else{
                    ;//log.info(response.body);
                }
            });
        })
    }
    DBApi.prototype.updateBanner = function(options){

    }

    DBApi.prototype.doneBannerTask = function(bannerInfo, id){

        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){   
                request.post({
                    'url' : server() + '/servicebanner/doc/' + id + '/_update',
                    'body' : 
                        {
                            "doc": _.assign(bannerInfo, 
                                {
                                    "scanned_date" : Date.now(), 
                                    "done" : true
                                }
                            )
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
                        reject(response.body)
                    }
                })
            })
        })
    }

    DBApi.prototype.scheduleBannerTask = function(ip, port, type, taskId){
        return db.connect()
        .then(function(){
            request.post({
                'url' : server() + '/servicebanner/doc/',
                'body' : {
                    "ip" : ip,
                    "port" : port,
                    "type" : type,
                    "taskId" : taskId,
                    "create_date" : Date.now(),
                    "done" : false,
                    "description" : 'description',
                    "remark" : 'remark',
                    "service" : 'UNKNOWN',
                    "version" : 'UNKNOWN',
                    "sslSupport" : false,
                    "scannedBy" : 'UNKNOWN',
                    "raw" : Buffer.from("", 'utf8').toString('base64')
                },
                'json' : true
            }, function(error, response){
                if(error){
                    log.error(error);
                }
                else{
                    if(response.statusCode === 201){
                        ;//log.info(response.body._index, response.body._id);
                    } 
                    else{
                        log.error(response.body);
                    }
                }
            });
        })
    }

    DBApi.prototype.getScheduledBannerTask = function(){
        //TODO 清空servicebanner中对应任务下的banner记录
        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){
                request.get({
                    'url' : server() + '/servicebanner/_search?size=1',
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
        })
    }
    DBApi.prototype.getBanners = function(options, offset){
        var query = {}
        query.bool = {
            "must": []
        }

        if(options["ip"]){
            query.bool.must.push({"match" : {"ip" : options["ip"]}})
        }
        if(options["task_id"]){
            query.bool.must.push({"match" : {"taskId" : options["task_id"]}})
        }
        
        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){
                var param = {
                    "query" : query,
                    "from" : offset,
                    "size" : 20
                };
                console.log(param)
                request.post({
                    'url' : server() + '/servicebanner/_search',
                    'body' : param,
                    "json" : true
                }, function(error, response){
                    if(error){
                        reject(error);
                    }
                    else if(response.statusCode === 200){
                        resolve(response.body.hits.hits.map(function(result){
                            return result._source;
                        }));
                    }
                    else{
                        reject(response.body);
                    }
                })
            })
        })
    }

    DBApi.prototype.getServices = function(options, offset){
        var query = {}
        query.bool = {
            "must": []
        }

        if(options["ip"]){
            query.bool.must.push({"match" : {"ip" : options["ip"]}})
        }
        if(options["task_id"]){
            query.bool.must.push({"match" : {"task_id" : options["task_id"]}})
        }
        
        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){
                var param = {
                    "query" : query,
                    "from" : offset,
                    "size" : 20
                };

                request.post({
                    'url' : server() + '/services/_search',
                    'body' : param,
                    "json" : true
                }, function(error, response){

                    if(error){
                        reject(error);
                    }
                    else if(response.statusCode === 200){
                       
                        resolve(response.body.hits.hits.map(function(result){
                            return result._source;
                        }));
                    }
                    else{
                        reject(response.body);
                    }
                })
            })
        })
    }
    /*
    {
    "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"task_id" : "c9f31ab0-f52f-11e7-83e3-b19955fb51a7"}},
           {"exists": {"field": "a"}}
         ]
       }
    }
}
    */
    DBApi.prototype.getDNSARecordsByTaskId = function(taskId, offset){
        var query = {}
        query.bool = {}
        query.bool.must = []
        query.bool.must.push({"match" : {"task_id" : taskId}})
        query.bool.must.push({"exists": {"field": "a"}})

        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){
                var param = {
                    "query" : query,
                    "from" : offset,
                    "size" : 20
                };

                request.post({
                    'url' : server() + '/dnsrecord/_search',
                    'body' : param,
                    "json" : true
                }, function(error, response){
                    if(error){
                        reject(error);
                    }
                    else if(response.statusCode === 200){
                        resolve(response.body.hits.hits.map(function(result){
                            return result._source;
                        }));
                    }
                    else{
                        reject(response.body);
                    }
                })
            })
        })
    }

    return DBApi;
}
