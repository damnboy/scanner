module.exports = function(options){

    var db = require('./init')(options)
    var DBApi = require('../api');
    var request = require("request")
    var util = require("util")
    var log = require('../../../utils/logger').createLogger('[db:elasticsearch]');
    var _ = require("lodash");
    function server(){
        return util.format('http://%s:%d', options.host, options.port);
    }

    DBApi.prototype._executeDSLQuery = function(index, op, query){
        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){
                request.post({
                    'url' : server() + '/' + index + '/' + op,
                    'body' : query,
                    "json" : true
                }, function(error, response){
                    if(error){
                        log.debug(JSON.stringify(query));
                        log.error(error);
                        reject(error);
                        return;
                    }

                    if(response.statusCode >= 200 && response.statusCode < 300){
                        resolve(response.body);
                    }
                    else{
                        log.error(response.body);
                        reject(response.statusCode);
                    }
                });
            });
        });
    }

    DBApi.prototype.executeUpdate = function(index, id, doc){
        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){   
                request.post({
                    'url' : server() + index + id + '/_update',
                    'body' : {"doc": doc},
                    'json' : true
                }, function(error, response){
                    if(error){
                        reject(error);
                    }
                    else if(response.statusCode === 200){
                        resolve(response.body);
                    }
                    else{
                        reject(response.body);
                    }
                });
            });
        });
    };

    DBApi.prototype.executeAggregation = function(index, query){
        return this._executeDSLQuery(index, '_search', query)
        .then(function(result){
            return result.aggregations;
        })
    }

    DBApi.prototype.executeBulk = function(index, query){
        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){
                request.post({
                    'url' : server() + '/' + index + '/_bulk',
                    'body' : query,
                    'headers' : {
                        "Content-Type" : "application/x-ndjson"
                    }
                }, function(error, response){
                    if(error){
                        reject(error);
                    }
                    if(response.statusCode >= 200 && response.statusCode < 300){
                        resolve(JSON.parse(response.body));
                    }
                    else{
                        log.error(response.body);
                        reject(response.statusCode);
                    }
                });
            });
        });
    }

    DBApi.prototype.executeDSLSearch = function(index, query){
        return this._executeDSLQuery(index, '_search', query)
        .then(function(result){
            return result.hits.hits.map(function(record){
                return record._source
            })
        })
    }

    DBApi.prototype.executeDSLCount = function(index, query){
        return this._executeDSLQuery(index, '_count', query).
        then(function(result){
            return result.count
        })
    }

    DBApi.prototype.getAll = function(index, query){
        var self = this;
        return this.executeDSLCount(index, query)
        .then(function(count){
            query.from = 0;
            query.size = count;

            return self.executeDSLSearch(index, query);
        })
    }
    ///////////////////////
    //  TASK
    //////////////////////
    
    //curl -i 192.168.100.254:9200/domaintask/_search?pretty -H 'Content-Type: application/json' -d '{"sort" :[{"createDate":"desc"}]}'
    DBApi.prototype.getRecentDomainTasks = function(){
        return this.executeDSLSearch('domaintask', 
        {
            "sort" :[{"createDate":"desc"}]
        });
    };

    DBApi.prototype.getDomainTask = function(id){
        return this.executeDSLSearch('domaintask', 
        {
            "query" : {   
               "bool" : {
                 "must" : [
                   {"match" : {"id" : id}}
                 ]
               }
            }
        })
        .then(function(results){
            return results[0];
        })
    }

    DBApi.prototype.saveMixTask = function(taskInfo){
        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){   
                request.post({
                    'url' : server() + '/mixtask/doc',
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
                });                        
            });
        });
    };

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
                });                        
            });
        });
    };

    DBApi.prototype.doneNmapTask = function(hostInfo, id){

        var self = this;
        return this._executeDSLQuery('services', '_search', {
            "query" :{
                "bool" :{
                    "must" : [
                        {"term" : {"ip" : hostInfo.ip}},
                        {"term" : {"taskId" : hostInfo.taskId}}
                    ]
                }
            },
            "size" : 1
        })
        .then(function(raw){
            return raw.hits.hits[0]._id;
        })
        .then(function(id){
            hostInfo.scannedDate = Date.now();
            hostInfo.done = true;
            return self.executeUpdate('/services/doc/', id, hostInfo);
        })
        .catch(function(err){
            log.error(err);
        });
    };
    //els排序
    DBApi.prototype.getScheduledNmapTask = function(size){
        var self = this;
        return db.connect()
        .then(function(){
            var query = {
                "query" :{
                    "bool" :{
                        "filter" : [
                            { "term" :{"done" : false} }
                        ]
                    }
                },
                "sort" : { "createDate": "asc"},
                "size" : size
            };
            return self.executeDSLSearch('services', query);
        })
        .catch(function(err){
            log.error('getScheduledNmapTask', err);
        })
    }


    DBApi.prototype.scheduleNmapTask = function(record){
        return db.connect()
        .then(function(){
            request.post({
                'url' : server() + '/services/doc/',
                'body' : _.assign(record , 
                    {
                        'createDate' : Date.now() ,
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
                        'createDate' : Date.now() ,
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
                        'createDate' : Date.now() ,
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


    DBApi.prototype.scheduleNmapServiceTasks = function(taskId, hosts){
        if(hosts.length === 0){
            log.warn('no valid hosts found on task(%s)', taskId);
        }

        log.info('Bulking ip addresses of task(' + taskId + ') into service scanning...');
        var bulkBody = hosts
        .map(function(host){
            return {
                "createDate" : Date.now() ,
                "done" : false,
                "ip" : host,
                "taskId" : taskId
            }
        })
        .reduce(function(bulk, record){
            bulk.push(JSON.stringify({ "index":{ "_index": "services", "_type": "doc" } }));
            bulk.push(JSON.stringify(record));
            return bulk;
        },[])

        return this.executeBulk('services', bulkBody.join('\n') + '\n')
        .then(function(result){
            log.info('%d host service scan task created!' , result.items.length);
        })
    }

    DBApi.prototype.getScheduledServiceBannerTask = function(type, size){
        var query = {
            "query" :{
                "bool" :{
                    "filter" : [
                        { "term" :{"done" : false} }
                    ]
                }
            },
            "sort": { "createDate": "asc"} 
        };
        if(size){
            query.size = size;
        }
        if(type){
            query.query.bool.filter.push({"term" : {"scannedBy" : type}});
        }
        return this.executeDSLSearch('servicebanner', query);
    }

    DBApi.prototype.doneScheduledServiceBannerTask = function(taskInfo){
        var self = this;
        return this._executeDSLQuery('servicebanner', '_search', {
            "query" :{
                "bool" :{
                    "must" : [
                        {"term" : {"ip" : taskInfo.ip}},
                        {"term" : {"taskId" : taskInfo.taskId}},
                        {"term" : {"port" : taskInfo.port}}
                    ]
                }
            },
            "size" : 1
        })
        .then(function(raw){
            return raw.hits.hits[0]._id;
        })
        .then(function(id){
            return self.executeUpdate('/servicebanner/doc/', id, taskInfo);
        })
        .catch(function(err){
            log.error(err);
        });
    };

    DBApi.prototype.getScheduledSSLBannerTasks = function(){
        return this.getScheduledServiceBannerTask('-', 16);
    };

    //cert批量入库
    DBApi.prototype.saveSSLCert = function(sslHostInfo){
        delete sslHostInfo.cert.raw;
        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){   
                request.post({
                    'url' : server() + '/sslcerts/doc',
                    'body' : sslHostInfo,
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
                });                        
            });
        });
    };

    DBApi.prototype.doneScheduledSSLBannerTask = function(taskInfo){
        return this.doneScheduledServiceBannerTask(taskInfo);
    };


    DBApi.prototype.saveWebInfo = function(webInfo){
        return db.connect()
        .then(function(){
            return new Promise(function(resolve, reject){   
                request.post({
                    'url' : server() + '/web/doc',
                    'body' : webInfo,
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
                });                        
            });
        });
    }

    DBApi.prototype.getScheduledWebBannerTasks = function(){
        return this.getScheduledServiceBannerTask('ssl', 16);
    };

    DBApi.prototype.doneScheduledWebBannerTask = function(taskInfo){
        return this.doneScheduledServiceBannerTask(taskInfo);
    };

    DBApi.prototype.getScheduledNmapBannerTasks = function(){
        return this.getScheduledServiceBannerTask('web', 1);
    };

    DBApi.prototype.doneScheduledNmapBannerTask = function(taskInfo){
        taskInfo.done = true;
        taskInfo.scannedBy = 'nmap';
        return this.doneScheduledServiceBannerTask(taskInfo);
    };

    DBApi.prototype.saveBanner = function(banner){
        return db.connect()
        .then(function(){
            request.post({
                'url' : server() + '/servicebanner/doc/',
                'body' : _.assign(banner , 
                    {
                        'createDate' : Date.now() ,
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
        });
    };

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
                                    "scannedDate" : Date.now(), 
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
                        reject(response.body);
                    }
                })
            })
        })
    }

    DBApi.prototype.scheduleBannerTasks = function(ip, ports, type, taskId){
        if(ports.length === 0){
            log.warn('no valid ports found on %s', ip);
        }
        log.info('Bulking banner tasks on ' + ip + ' into banner scanning...');
        var bulkBody = ports
        .map(function(port){
            return {
                "ip" : ip,
                "port" : port,
                "type" : type,
                "taskId" : taskId,
                "createDate" : Date.now(),
                "done" : false,
                "description" : 'description',
                "remark" : 'remark',
                "service" : '-',
                "version" : '-',
                "sslSupport" : false,
                "scannedBy" : '-',
                "raw" : Buffer.from("", 'utf8').toString('base64')
            }
        })
        .reduce(function(bulk, record){
            bulk.push(JSON.stringify({ "index":{ "_index": "servicebanner", "_type": "doc" } }));
            bulk.push(JSON.stringify(record));
            return bulk;
        },[])

        return this.executeBulk('servicebanner', bulkBody.join('\n') + '\n')
        .then(function(result){
            log.info('%d banner scan task created!' , result.items.length);
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
                        "sort": { "createDate": "asc"} 
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
                        reject(response.statusCode);
                    }
                })
            })
        });
    }

    DBApi.prototype.getBanners = function(options, offset){
        return this.executeDSLSearch('servicebanner', 
        {
            "from" : offset,
            "size" : 20,
            "query" : {
                "bool" : {
                    "must" : Object.keys(options).reduce(function(ret, key){
                        if(key === "ip" || key === "taskId"){
                            ret.push({"match" : {[key]: options[key]}})
                        }
                        return ret;
                    }, [])
                }
            }
        });
    }

    //不具备实时一致性，无法实现
    DBApi.prototype.checkServicesExist = function(taskId, ip){
        return this.getServices({
            "ip" : ip,
            "taskId" : taskId
        }, 0);
    }

    //使用聚合查询
    DBApi.prototype.getHosts = function(taskId){
        var self = this;

        return this.getAll('dnsrecord', {
            "query" : {   
               "bool" : {
                 "must" : [
                   {"match" : {"taskId" : taskId}}
                 ]
               }
            }
        })
        .then(function(result){
            var raw = result.reduce(function(ret, elem){
                return ret.concat(elem.a);
            }, []);
            
            return _.uniq(raw);
        })
    }

    DBApi.prototype.getServices = function(options, offset){
        return this.executeDSLSearch('services', 
        {
            "from" : offset,
            "size" : 20,
            "query" : {
                "bool" : {
                    "must" : Object.keys(options).reduce(function(ret, key){
                        if(key === "ip" || key === "taskId"){
                            ret.push({"match" : {[key]: options[key]}})
                        }
                        return ret;
                    }, [])
                }
            }
        });
    }
    DBApi.prototype.getDNSARecordsByTaskId = function(taskId, offset){
        return this.executeDSLSearch('dnsrecord', 
        {
            "from" : offset,
            "size" : 20,
            "query" : {
                "bool" : {
                    "must" : [
                        {"match" : {"taskId" : taskId}},
                        {"exists": {"field": "a"}}
                    ]
                }
            }
        });
    }
    //dashboard
    DBApi.prototype.getSSLHosts = function(){
        return this.executeDSLSearch('servicebanner', 
        {
            "from" : 0,
            "size" : 100,
            "query" : {
                "bool" : {
                    "must" : [
                        {"match":{"sslSupport":"true"}}
                    ]
                }
            }
        });
    }

    DBApi.prototype.getJoinedNetnames = function(taskId){
        
        return this.executeAggregation('whois',
        {
            "size" : 0,
            "query" : {
                "match" : { "taskId" : taskId }
            },
            "aggs" : {
                "netname" : { "terms" : { "field" : "joinedNetname" ,"size": 3000} }
            }
        })
        .then(function(results){
            return results.netname.buckets.map(function(r){
                return {'joinedNetnames' : r.key ,'count': r.doc_count}
            }).sort()
        })
    }
    /*

    */
    DBApi.prototype.getNetnames = function(taskId){
        
        return this.executeAggregation('whois',
        {
            "size" : 0,
            "query" : {
                "match" : { "taskId" : taskId }
            },
            "aggs" : {
                "detail" : {
                    "nested" : {
                        "path" : "detail"
                    },
                    "aggs" : {
                        "hosts" : { "terms" : { "field" : "detail.netname" ,"size": 3000} }
                    }
                }
            }
        })
        .then(function(results){
            return results.detail.hosts.buckets.map(function(r){
                return {'netname' : r.key ,'count': r.doc_count}
            }).sort()
        })
    }

    DBApi.prototype.getNetblocks = function(taskId, netName){
        return this.executeAggregation('whois',
        {
            "size" : 0,
            "query" : {   
               "bool" : {
                 "must" : [
                   {"match" : {"taskId" : taskId}},
                   {"nested" : {
                    "path" : "detail",
                    "query" : {
                        "bool" : {
                            "must" : [
                            { "match" : {"detail.netblock" : netName} }
                            ]
                        }
                    }
                }}
                 ]
               }
            },
            "aggs" : {
                "hosts" : { "terms" : { "field" : "ip" } }
            }
           
        })
        .then(function(results){
            return results.hosts.buckets.map(function(i){
                return {'ip':i.key, 'count':i.doc_count}
            })

        })
    }
    DBApi.prototype.getVirtualHost = function(taskId, ip, size){
        return this.executeDSLSearch('dnsrecord',
        {
            "from" : 0,
            "size" : size,
            "_source" : "domain",
            "query" : {   
               "bool" : {
                 "must" : [
                   {"match" : {"taskId" : taskId}},
                   {"match" : {"a" : ip}}
                 ]
               }
            }
        })
    }
    //todo
    DBApi.prototype.getHostsOnNetblock = function(taskId, netBlock){
        return this.executeAggregation('whois', {
            "size" : 0,
            "query" : {   
               "bool" : {
                 "must" : [
                    {"match" : {"taskId" : taskId}},
                    {"nested" : {
                        "path" : "detail",
                        "query" : {
                            "bool" : {
                                "must" : [
                                { "match" : {"detail.netblock" : netBlock} }
                                ]
                            }
                        }
                    }}
                 ]
               }
            },
            "aggs": {
                "ip": {"terms": { "field": "ip" }}
              }
        })
        .then(function(results){
            return results.ip.buckets.map(function(i){
                return {
                    ip : i.key,
                    count : i.doc_count
                }
            })
        })
    }

    DBApi.prototype.getHostsBySerivce = function(service){
        return this.executeDSLSearch('servicebanner',{ 
            "_source" : ["ip", "port"],
            "query" : {   
                 "bool" : {
                   "must" : [
                     {"match" : {"service" : service}}
                   ]
                 }
            }
        })
    }
    //Dashboard
    DBApi.prototype.getServicesSummary = function(){
        return this.executeAggregation('servicebanner',
        {
          "query" : {   
               "bool" : {
                 "must" : [
                   {"match" : {"done" : true}}
                 ]
               }
            },
          "size" : 0,
          "aggs": {
            "summary": {
              "terms": { "field": "service" }
            }
          }
        })
        .then(function(results){
            return results.summary.buckets;
        })
        
    }
    return DBApi;
}