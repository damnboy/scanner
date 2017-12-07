/*
    index: domain
    type: record
*/
var record = {
    "mappings" : {
        "record " : {
            "properties" : {
                "domain" : {
                    "type" : "text",
                    "index" : "not_analyzed"
                },

                "resolver" : {
                    "type" : "text",
                    "index" : "not_analyzed"
                },

                "task_id" : {
                    "type" : "text",
                    "index" : "not_analyzed"
                },

                "description" : {
                    "type" : "text",
                    "index" : "analyzed"
                },

                "remark" : {
                    "type" : "text",
                    "index" : "analyzed"
                },

                "create_date" : {
                    "type" : "date"
                },

                "a" : {
                    "type" : "text",
                    "index" : "not_analyzed"
                },

                "cname" : {
                    "type" : "text",
                    "index" : "not_analyzed"
                }
            }
        }
    }
};