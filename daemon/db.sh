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

                "create_date" : {
                    "type" : "date"
                },

                "created_by" :{
                    "type" : "keyword"
                },

                "domain" : {
                    "type" : "keyword"
                },

                "dict" : {
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

                "task_id" : {
                    "type" : "keyword"
                },

                "description" : {
                    "type" : "text"
                },

                "remark" : {
                    "type" : "text"
                },

                "create_date" : {
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
                "task_id" : {
                    "type" : "keyword"
                },

                "description" : {
                    "type" : "text"
                },

                "remark" : {
                    "type" : "text"
                },

                "create_date" : {
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
                "task_id" : {
                    "type" : "keyword"
                },

                "description" : {
                    "type" : "text"
                },

                "remark" : {
                    "type" : "text"
                },

                "create_date" : {
                    "type" : "date"
                },

                "tcp" : {
                    "type" : "long"
                },
                "udp" : {
                    "type" : "long"
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
                "ip" : {
                    "type" : "ip"
                },

                "port" : {
                    "type" : "long"
                },

                "task_id" : {
                    "type" : "keyword"
                },

                "description" : {
                    "type" : "text"
                },

                "remark" : {
                    "type" : "text"
                },

                "create_date" : {
                    "type" : "date"
                },

                "banner" : {
                    "type" : "text"
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
                "task_id" : {
                    "type" : "keyword"
                },
                "create_date" : {
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