var settings = require('../../settings');
var type = 'elasticsearch';
module.exports = (function(options){
    if(type === "elasticsearch"){
        var elasticSearch = require("./elasticsearch")({
            "host" : options.host,
            "port" : options.port
        })
        return new elasticSearch();
    }
    else{
        return new require('./api');
    }
})(settings.db[type])


