## ip - domain 映射聚合查询

curl -XGET 'http://127.0.0.1:9200/dnsrecord/_count?pretty' -H 'Content-Type: application/json' -d'
{
    "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"taskId" : "3b9cc4f0-fad4-11e7-a04f-016018e269c5"}}
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

## 服务信息统计
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "aggs": {
    "all_interests": {
      "terms": { "field": "service" }
    }
  }
}
'

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

## 尚未完成的扫描任务统计
curl -XGET 'http://218.85.154.137:9200/services/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"done" : "false"}}
         ]
       }
    }
}
'

## 获取指定服务
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"service" : "ldap"}}
         ]
       }
  }
}'

## ssl 主机信息收集sslSupport
curl -XGET 'http://127.0.0.1:9200/servicebanner/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"scannedBy" : "nmap"}}
         ]
       }
  },
  "aggs": {
    "all_interests": {
      "terms": { "field": "sslSupport" }
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
                    { "match" : {"detail.netblock" : "42.99.0.0 - 42.99.63.255"} }
                    ]
                }
            }
        }}
         ]
       }
    },
    "aggs" : {
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