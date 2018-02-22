var dbApi = require('../../');
//扫描进度
module.exports.getTargetProgress = function(taskId){
    return dbApi.executeAggregation('service', 
    {
        "size" : 0,
        "aggs": {
            "progress": {
                "terms": { "field": "done" }
            }
        }
    })
}

//某任务下，无开放端口的主机
module.exports.getTargetOfflineHost = function(taskId){
    return dbApi.executeDSLSearch('services', { 
        "query": { 
            "bool": { 
                "must_not": { 
                    //Deprecated in 2.2.0. Use exists query inside a must_not clause instead 
                    "exists": { "field": "tcp" } 
                },
                "must" : [
                    {"match" : {"taskId" : "a8db5560-fc71-11e7-b457-45b900efcb68"}}
                ]
            } 
        } 
    })
}

//某任务下，开放端口数量小于50的主机 
module.exports.getTargetOnlineHost = function(taskId){
    return dbApi.executeDSLSearch('services', {
        "_source" : ["ip", "tcp"],
        "query": {
            "bool" : {
                "must" : {
                    "script" : {
                        "script" : {
                            "source": "(doc[\u0027taskId\u0027].value == params.param2) && (doc[\u0027tcp\u0027].length < params.param1) && (doc[\u0027tcp\u0027].length > 0)",
                            "params" : {
                                "param1" : 50,
                                "param2" : taskId//"1fce5d30-0a8b-11e8-975d-47e77e76979b"
                            }
                         }
                    }
                }
            }
        }
    })
}

//开放端口数量大于50的主机视为高防节点云主机
module.exports.getTargetCloudHosts = function(taskId){
    return dbApi.executeDSLSearch('services', {
        "_source" : ["ip", "tcp"],
        "query": {
            "bool" : {
                "must" : {
                    "script" : {
                        "script" : {
                            "source": "(doc[\u0027taskId\u0027].value == params.param2) && (doc[\u0027tcp\u0027].length > params.param1)",
                            "params" : {
                                "param1" : 50,
                                "param2" : taskId//"1fce5d30-0a8b-11e8-975d-47e77e76979b"
                            }
                         }
                    }
                }
            }
        }
    })
}
