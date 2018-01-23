/*
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "_source" : ["ip",  "port"],
    "query": {
        "match_all": {}
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
/* 服务信息统计
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
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
}
'

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
DBApi.prototype.getServiceSummary = function(){

}

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
DBApi.prototype.getSSLSummary = function(){

}

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
DBApi.prototype.getScannerSummary = function(){

}
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
DBApi.prototype.getBannerTaskSummary = function(){
    
}

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