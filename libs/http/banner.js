var ip = require('ip');
var _ = require('lodash')

var async = require('async');
var cheerio = require('cheerio');   //https://github.com/cheeriojs/cheerio
var util = require('util');
var events = require('events');
var WebPage = require('./page.js');
var Queue = require('../../utils/q.js');
var log = require('../../utils/logger.js');
var logger = log.createLogger('[WEBAPP-BANNER]');
var settings = require('../../settings');

function WebApplicationBanner(){

    events.EventEmitter.call(this);

    var self = this;
    this.queue = new Queue(8, [], function(options){
        return function(){
            return new Promise(function(resolve, reject){
                options.url = options.ssl ? util.format('https://%s:%s', options.host, options.port) : util.format('http://%s:%s', options.host, options.port);
                var page = new WebPage();
                return page.request(options.url)
                .then(function(response){
                    var title = response.body;

                    if(title.length > 50){
                        const $ = cheerio.load(title);
                        title = $('title').text();
                    }

                    if(title.length === 0  && response.statusCode.toString().startsWith('3')){
                        title = response.headers.location;
                    }
                    
                    options.encoding = page.encoding;
                    options.title = title;
                    options.statusCode = response.statusCode;
                    options.headers = response.headers;
                    resolve(options);
                })
                .catch(function(error){
                    options.error = error;
                    reject(options);
                });
            });
        };
    });

    this.queue.on('done', function(response){
        logger.info('[%s/%s] %s - %s', 
            response.statusCode, response.encoding, response.url, response.title);

        self.emit('web', response);
    });

    this.queue.on('error', function(error){
        logger.error('%s - %s', error.url, error.error.message);

        self.emit('nonWeb', error);
    });  

    this.queue.on('empty', function(){
        self.emit('empty');
    })

}

util.inherits(WebApplicationBanner, events.EventEmitter);//使这个类继承EventEmitter

WebApplicationBanner.prototype.scanHost = function(hostInfo){
    this.scanHosts([options]);
};

WebApplicationBanner.prototype.scanHosts = function(hostsInfo){
    var self = this;
    hostsInfo.forEach(function(hostInfo){
        self.queue.addJob(hostInfo);
    });
};

/*
WebApplicationBanner.prototype.host = function(host, port){
    this.queue.addJob(util.format('http://%s:%s', host, port));
}


WebApplicationBanner.prototype.sslhost = function(host, port){
    this.queue.addJob(util.format('https://%s:%s', host, port));
}
*/

module.exports = WebApplicationBanner;

/*
TODO
重定向
ESOCKETTIMEOUT
TLSSocket Error：Hostname/IP doesn't match certificate's altnames: "IP: 101.37.96.81 is not in the cert's list: "
Socket Error：Parse Error
*/   


