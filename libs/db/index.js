module.exports = (function(options){
    if(options.type === "elasticsearch"){
        var elasticSearch = require("./elasticsearch")({
            "host" : options.host,
            "port" : options.port
        })
        return new elasticSearch();
    }
    else{
        return new require('./api');
    }
})({
    "type" : "elasticsearch",
    "host" : "218.85.154.137",
    "port" : "9200"
})


