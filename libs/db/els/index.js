var elasticsearch = require('elasticsearch');
var util = require('util');

module.exports = function(options){

    return new Promise(function(resolve, reject){
        var client = new elasticsearch.Client({
            host: util.format('%s:%d', options.host, options.port)
        });

        client.ping({
            requestTimeout: 2000,
        }, function (error) {
            if (error) {
                client.close()
                resolve(require('./fake.js'))
            } else {
                console.log('els client ok')
                resolve(require('./raw.js')({
                    'host' : options.host,
                    'port' : options.port
                }));
        }});
    })
    
}

