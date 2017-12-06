PUT /domain?pretty HTTP/1.1
Host: 127.0.0.1:9200
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:45.0) Gecko/20100101 Firefox/45.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-GB,en;q=0.5
Accept-Encoding: gzip, deflate
Connection: close
Content-Type: application/json
Content-Length: 852

{
    "mappings" : {
        "record " : {
            "properties" : {
                "domain" : {
                    "type" : "text",
                    "index" : "false"
                },

                "resolver" : {
                    "type" : "text",
                    "index" : "false"
                },

                "task_id" : {
                    "type" : "text",
                    "index" : "false"
                },

                "description" : {
                    "type" : "text",
                    "index" : "true"
                },

                "remark" : {
                    "type" : "text",
                    "index" : "true"
                },

                "create_date" : {
                    "type" : "date"
                }
            }
        }
    }
}