## ip - domain 映射聚合查询

curl -XGET 'http://127.0.0.1:9200/dnsrecord/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "from" : 0,
    "size" : 25,
    "_source" : "domain",
    "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"taskId" : "a8db5560-fc71-11e7-b457-45b900efcb68"}},
           {"match" : {"a" : "113.108.216.239"}}
         ]
       }
    }
}'

curl -XGET 'http://127.0.0.1:9200/dnsrecord/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"taskId" : "3b9cc4f0-fad4-11e7-a04f-016018e269c5"}}
         ]
       }
    },
    "_source" : "a"
}'

curl -XGET 'http://127.0.0.1:9200/dnsrecord/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"taskId" : "3b9cc4f0-fad4-11e7-a04f-016018e269c5"}}
         ]
       }
    },
  "size": 0,
  "aggs": {
    "all_interests": {
      "terms": { "field": "a" ,"size": 3000}
    }
  }
}
'




## whois信息，netblock下的主机数量
curl -XGET 'http://127.0.0.1:9200/whois/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "size" : 0,
    "query" : {
        "match" : { "taskId" : "13a4c710-fc62-11e7-a13b-2bbc7490144a" }
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
}
'

## 某网段下的host信息
curl -XGET 'http://127.0.0.1:9200/whois/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "_source" : "ip",
    "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"taskId" : "a8db5560-fc71-11e7-b457-45b900efcb68"}},
           {"nested" : {
            "path" : "detail",
            "query" : {
                "bool" : {
                    "must" : [
                    { "match" : {"detail.netblock" : "113.96.0.0 - 113.111.255.255"} }
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
}'

## 某网段下的host信息
curl -XGET 'http://127.0.0.1:9200/whois/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "size" : 0,
    "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"taskId" : "13a4c710-fc62-11e7-a13b-2bbc7490144a"}},
           {"nested" : {
            "path" : "detail",
            "query" : {
                "bool" : {
                    "must" : [
                    { "match" : {"detail.netname" : "CHINANET-GD"} }
                    ]
                }
            }
        }}
         ]
       }
    },
    "aggs" : {
        "detail" : {
            "nested" : {
                "path" : "detail"
            },
            "aggs" : {
                "hosts" : { "terms" : { "field" : "detail.netblock" } }
            }
        }
    }
}'

## 某网段下的host信息
curl -XGET 'http://127.0.0.1:9200/whois/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "query": {
        "nested" : {
            "path" : "detail",
            "query" : {
                "bool" : {
                    "must" : [
                    { "match" : {"detail.netblock" : "ALISOFT"} }
                    ]
                }
            }
        }
    },
    "aggs": {
      "ip": {"terms": { "field": "ip" }}
    }
}'