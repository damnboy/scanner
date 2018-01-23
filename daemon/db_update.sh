#!/usr/bin/env bash
#https://www.elastic.co/blog/changing-mapping-with-zero-downtime
curl -XPUT 'localhost:9200/whois/_mappings/doc?pretty' -H 'Content-Type: application/json' -d'
{

            "properties" : {
                "ip" : {
                    "type" : "ip"
                },
                "server" : {
                    "type" : "keyword"
                },
                "taskId" : {
                    "type" : "keyword"
                },
                
                "joinedNetname" : {
                    "type" : "keyword"
                },

                "description" : {
                    "type" : "text"
                },

                "remark" : {
                    "type" : "text"
                },

                "createDate" : {
                    "type" : "date"
                },

                "detail" :{
                    "type" : "nested",
                    "properties": {
                        "detail":  { "type": "text" },
                        "netblock": { "type": "keyword" ,"fields" :{
                        "text" : {
                            "type" : "text"
                        }
                    } },
                        "netname": { "type": "keyword" ,"fields" :{
                        "text" : {
                            "type" : "text"
                        }
                    }  }
                    }
                }
            }
        
    
}
'