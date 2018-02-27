var settings = require('../../settings');

module.exports = (function(options){
    if(settings.db.type === "elasticsearch"){
        var Elasticsearch = require("./elasticsearch")(settings.db.elasticsearch);
        return new Elasticsearch();
    }
    if(settings.db.type === 'mongodb'){
        var Mongodb = require('./mongodb')(settings.db.mongodb);
        return new Mongodb();
    }
    else{
        return new require('./api');
    }
})(settings.db.type);


