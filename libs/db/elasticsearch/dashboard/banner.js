var dbApi = require('../../');
//progress
module.exports.bannerProgress = function(){
  return dbApi.executeAggregation('servicebanner', 
  {
    "size" : 0,
    "aggs": {
      "status": {
        "terms": { "field": "done" }
      }
    }
  })
  .then(function(r){
      var progress = r.status.buckets.reduce(function(r, i){
          if(i.key_as_string === 'true'){
              r.done = i.doc_count;
          }
          r.total += i.doc_count;
          return r;
      }, {done:0, total:0})
      console.log(((progress.done / progress.total) * 100).toFixed(2) + '%');
  })
}


module.exports.getAllBanners = function(taskId){
  return dbApi.getAll('servicebanner', {
      "query": {
          "match_all": {}
      }
  })
}

//服务信息统计
//nature 分布式特性导致的聚合查询的不准确性 
//https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-terms-aggregation.html#search-aggregations-bucket-terms-aggregation-approximate-counts
module.exports.getServiceCatalogs = function(taskId){
  return dbApi.executeAggregation('servicebanner', 
  {
    "query" : {   
         "bool" : {
           "must" : [
             {"match" : {"done" : true}}
           ]
         }
      },
    "from" : 0,
    "size" : 1000,
    "aggs": {
      "services": {
        "terms": { 
          "field": "service" , 
          "size" : 100
        }
      }
    }
  });
}

/*
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "size" : 0,
  "aggs": {
    "status": {
      "terms": { "field": "done" }
    }
  }
}
'
*/


/*
//获取某任务下所有完成了指纹识别的服务
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "_source" : ["ip",  "port", "service", "version"],
    "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"done" : true}}
         ]
       }
    }
}'
*/


/*
端口统计
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "size" : 0,
  "aggs": {
    "summary": {
      "terms": { "field": "port" }
    }
  }
}
'
*/
/* 

## 获取指定服务
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{ 
  "_source" : ["ip", "port"],
  "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"service" : "nagios-nsca"}}
         ]
       }
  }
}'

*/


/*
## ssl 主机信息收集sslSupport
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "size" : 0,
  "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"done" : true}}
         ]
       }
  },
  "aggs": {
    "ssl": {
      "terms": { "field": "sslSupport" }
    }
  }
}
'
*/


/*
## 扫描器统计
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "aggs": {
    "all_interests": {
      "terms": { "field": "scannedBy" }
    }
  }
}
'
*/


/*
## 尚未完成的扫描任务统计
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "size" : 0,
  "aggs": {
    "all_interests": {
      "terms": { "field": "done" }
    }
  }
}
'
*/


/*
ssl端口统计
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"sslSupport" : true}}
         ]
       }
    },
  "size" : 0,
  "aggs": {
    "summary": {
      "terms": { "field": "port" }
    }
  }
}
'
*/

/*
某主机上的端口指纹详情
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "from" : 0,
  "size" : 100,
  "_source" : ["port", "service", "version"],
  "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"ip" : "218.30.114.54"}}
         ]
       }
    }
}
'
*/