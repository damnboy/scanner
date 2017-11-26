var request = require('request');
var _ = require('lodash')
var util = require('util')

function server(){
    var server = {
        host : '127.0.0.1',
        port : 9200
    }

    return util.format('http://%s:%d', server.host, server.port)
}
function analyzeDNSRecord(){
    var DSL = {
        "aggs": {
          "all_address": {
            "terms": { "field": "domain" }
          }
        }
      }

          
    request.post({
        'url' : server() + '/subdomain/nsrecord/_search',
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
function queryDNSRecord(domain){
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
        'url' : server() + '/subdomain/nsrecord/_search',
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
function saveDNSRecord(record){
    request.post({
        'url' : server() + '/subdomain/nsrecord/' + record.domain,
        'body' : _.assign(record,{'count' : record.cname.length + record.a.length}),
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

module.exports = {
    'saveDNSRecord' : saveDNSRecord,
    'queryDNSRecord' : queryDNSRecord,
    'analyzeDNSRecord': analyzeDNSRecord
}