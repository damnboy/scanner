/*
    index: domain
    type: record
*/
var record = {
    "mappings" : {
        "_doc" : {
            "_all": {
                "enabled": true   
            },
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
};