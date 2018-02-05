/*
高防节点统计
"04185650-fc70-11e7-837e-6d9c9724c93c" efi.com
"033f3ef0-fc71-11e7-8293-23f200917cdf" qq.com
"13a4c710-fc62-11e7-a13b-2bbc7490144a" 189.cn
curl -XGET 'http://127.0.0.1:9200/services/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "_source" : "taskId",
  "script_fields": {
    "portCount": {
      "script": {
        "source": "doc[\u0027ip\u0027].value + \u0027(\u0027 + doc[\u0027tcp\u0027].length + \u0027)\u0027"
      }
    }
  },
    "query": {
        "bool" : {
            "must" : {
                "script" : {
                    "script" : {
                        "source": "(doc[\u0027taskId\u0027].value == params.param2) && (doc[\u0027tcp\u0027].length > params.param1)",
                        "params" : {
                            "param1" : 50,
                            "param2" : "033f3ef0-fc71-11e7-8293-23f200917cdf"
                        }
                     }
                }
            }
        }
    }
}'

无开放端口节点Warning
Deprecated in 2.2.0.
Use exists query inside a must_not clause instead 

curl -XGET 'http://127.0.0.1:9200/services/_count?pretty' -H 'Content-Type: application/json' -d'
{ 
    "query": { 
        "bool": { 
            "must_not": { 
                "exists": { "field": "tcp" } 
            },
            "must" : [
                {"match" : {"taskId" : "a8db5560-fc71-11e7-b457-45b900efcb68"}}
            ]
        } 
    } 
}'
*/