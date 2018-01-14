curl -XPUT 'localhost:9200/my_index?pretty' -H 'Content-Type: application/json' -d'
{
  "mappings": {
    "my_type": {
      "properties": {
        "date": {
          "type": "date" 
        }
      }
    }
  }
}
'
curl -XPUT 'localhost:9200/my_index/my_type/1?pretty' -H 'Content-Type: application/json' -d'
{ "date": "2015-01-01" }
'
curl -XPUT 'localhost:9200/my_index/my_type/2?pretty' -H 'Content-Type: application/json' -d'
{ "date": "2015-01-01T12:10:30Z" }
'
curl -XPUT 'localhost:9200/my_index/my_type/3?pretty' -H 'Content-Type: application/json' -d'
{ "date": 1420070400001 }
'
curl -XGET 'localhost:9200/_search?size=1&pretty' -H 'Content-Type: application/json' -d'
{
  "query" :{
      "bool" :{
          "must" : [
             { "match" :{"done" : false} }
          ]
      }
  },
  "sort": { "create_date": "desc"} 
}
'
curl -XGET 'localhost:9200/nmaptask/_search?size=1&pretty' -H 'Content-Type: application/json' -d'
{
  "query" :{
      "bool" :{
          "filter" : [
             { "term" :{"done" : false} }
          ]
      }
  },
  "sort": { "create_date": "asc"} 
}
'

curl -XPOST 'localhost:9200/nmaptask/doc/b8dEnGABAXOjpfvP3Uu2/_update?pretty' -H 'Content-Type: application/json' -d'
{
    "doc" : {
        "done" : true
    }
}
'

curl -XGET 'localhost:9200/my_index/my_type/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "sort" : [
        { "post_date" : {"order" : "asc"}},
        "user",
        { "name" : "desc" },
        { "age" : "desc" },
        "_score"
    ],
    "query" : {
        "term" : { "user" : "kimchy" }
    }
}
'

curl -XPOST 'localhost:9200/servicebanner/doc?pretty' -H 'Content-Type: application/json' -d'
{ "ip": "61.154.14.126",
  "port": 587,
  "type": "tcp",
  "taskId": "c1b99170-f512-11e7-992a-e1063ddbdfb1",
  "create_date": 1515484672172,
  "description": "description",
  "remark": "remark",
  "service": "UNKNOWN",
  "version": "UNKNOWN",
  "sslSupport": false,
  "scannedBy": "UNKNOWN",
  "raw": "<Buffer 55 4e 4b 4e 4f 57 4e>" }'

curl -XPOST 'localhost:9200/servicebanner/doc/arQV2mAB55FimIyTrfiT/_update' -H 'Content-Type: application/json' -d'
  {"doc":{ 
  "done": false }}'


curl -XPOST 'localhost:9200/servicebanner/doc' -H 'Content-Type: application/json' -d '
  {"ip":"61.154.14.124","port":80,"type":"tcp","taskId":"a0510d40-f573-11e7-b73c-a1343f047d8d","create_date":1515526266225,"done":false,"description":"description","remark":"remark","service":"UNKNOWN","version":"UNKNOWN","sslSupport":false,"scannedBy":"UNKNOWN","raw":{"type":"Buffer","data":[]}}'
  


  '
curl -XGET '218.85.154.137:9200/dnsrecord/_search?pretty' -H 'Content-Type: application/json' -d'
{
    "query" : {   
       "bool" : {
         "must" : [
           {"match" : {"task_id" : "c9f31ab0-f52f-11e7-83e3-b19955fb51a7"}},
           {"exists": {"field": "a"}}
         ]
       }
    }
}'



,
    