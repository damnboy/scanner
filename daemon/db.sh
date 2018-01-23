#!/bin/sh
curl -XDELETE '127.0.0.1:9200/dnsrecord?pretty'
curl -XDELETE '127.0.0.1:9200/whois?pretty'
curl -XDELETE '127.0.0.1:9200/domaintask?pretty'
curl -XDELETE '127.0.0.1:9200/services?pretty'
curl -XDELETE '127.0.0.1:9200/servicebanner?pretty'
curl -XDELETE '127.0.0.1:9200/nmaptask?pretty'

curl -XPUT 'localhost:9200/domaintask?pretty' -H 'Content-Type: application/json' -d'
{
  "mappings" : {
        "doc" : {
            "properties" : {
                "id" : {
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

                "createdBy" :{
                    "type" : "keyword"
                },

                "domain" : {
                    "type" : "keyword"
                },

                "dict" : {
                    "type" : "keyword"
                },

                "customNameservers" : {
                    "type" : "keyword"
                }
            }
        }
    }
}
'

curl -XPUT 'localhost:9200/dnsrecord?pretty' -H 'Content-Type: application/json' -d'
{
  "mappings" : {
        "doc" : {
            "properties" : {
                "domain" : {
                    "type" : "keyword",
                    "fields" :{
                        "text" : {
                            "type" : "text"
                        }
                    }
                },

                "resolver" : {
                    "type" : "ip"
                },

                "taskId" : {
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

                "a" : {
                    "type" : "ip"
                },

                "cname" : {
                    "type" : "keyword",
                    "fields" :{
                        "text" : {
                            "type" : "text"
                        }
                    }
                }
            }
        }
    }
}
'
curl -XPUT 'localhost:9200/whois?pretty' -H 'Content-Type: application/json' -d'
{
  "mappings" : {
        "doc" : {
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
    }
}
'

curl -XPUT 'localhost:9200/services?pretty' -H 'Content-Type: application/json' -d'
{
  "mappings" : {
        "doc" : {
            "properties" : {
                "ip" : {
                    "type" : "ip"
                },
                "taskId" : {
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

                "tcp" : {
                    "type" : "long"
                },
                "udp" : {
                    "type" : "long"
                },
                "done" : {
                    "type" : "boolean"
                },
                "scannedDate" : {
                    "type" : "date"
                }
            }
        }
    }
}
'

curl -XPUT 'localhost:9200/servicebanner?pretty' -H 'Content-Type: application/json' -d'
{
  "mappings" : {
        "doc" : {
            "properties" : {
                "done" : {
                    "type" : "boolean"
                },
                "taskId" : {
                    "type" : "keyword"
                },
                "ip" : {
                    "type" : "ip"
                },

                "type" : {
                    "type" : "keyword"
                },

                "port" : {
                    "type" : "integer"
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

                "scannedDate" : {
                    "type" : "date"
                },

                "service" : {
                    "type" : "keyword"
                },

                "version" : {
                    "type" : "text",
                    "fields" : {
                        "raw" : {
                            "type" : "keyword"
                        }
                    }
                },

                "sslSupport" : {
                    "type" : "boolean"
                },

                "scannedBy" : {
                    "type" : "keyword"
                },

                "raw" : {
                    "type" : "binary"
                }
            }
        }
    }
}
'

curl -XPUT 'localhost:9200/nmaptask?pretty' -H 'Content-Type: application/json' -d'
{
  "mappings" : {
        "doc" : {
            "properties" : {
                "ip" : {
                    "type" : "ip"
                },
                "taskId" : {
                    "type" : "keyword"
                },
                "createDate" : {
                    "type" : "date"
                },
                "done" : {
                    "type" : "boolean"
                }

            }
        }
    }
}
'