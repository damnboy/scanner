var ip = require('ip');
var _ = require('lodash')

var async = require('async');
var cheerio = require('cheerio');   //https://github.com/cheeriojs/cheerio
var util = require('util');
var events = require('events');
var WebPage = require('./page.js');
var Queue = require('../../utils/queue.js');
var log = require('../../utils/logger.js');
var logger = log.createLogger('[WEBAPP-BANNER]');

function WebApplicationBanner(){

    events.EventEmitter.call(this);
    this.hosts = [];
    var self = this;
    this.timeout = 5000;
    this.queue = new Queue(8);

    this.queue.on('done', function(response){
        logger.info('[%s/%s] %s - %s', 
            response.statusCode, response.encoding, response.url, response.title)
    })

    this.queue.on('error', function(error){
        logger.error('%s - %s', error.url, error.message)
    })  

    this.queue.on('finish', function(){
        //console.log('finished')
    })

}

util.inherits(WebApplicationBanner, events.EventEmitter);//使这个类继承EventEmitter


WebApplicationBanner.prototype.host = function(host, port){
    return this.url(util.format('http://%s:%s', host, port));
}

WebApplicationBanner.prototype.url = function(url){
    var self = this;
    this.queue.enqueue(function(){
        return new Promise(function(resolve, reject){
            var page = new WebPage();
            return page.request({
                'method' : 'GET',
                'uri' : url,
                'timeout' : self.timeout,  
                'encoding' : null
            })
            .then(function(response){
                var body = response.body;
                const $ = cheerio.load(response.body);

                resolve( {
                    'url' : url,
                    'encoding' : page.encoding,
                    'title' : $('title').text(),
                    'statusCode' : response.statusCode
                })
            })
            .catch(function(error){
                error.url = url;
                reject(error)
            })
        })

    })
}

module.exports = WebApplicationBanner;

/*
banner.on('job.host', function(job){
    if(job.hosts){
        banner.hosts = banner.hosts.concat(job.hosts);
        
        job.hosts.forEach(function(host){
            job.ports.forEach(function(port){
                var url = util.format('http://%s:%s',host, port); 
                banner.emit('job.url', url);
            })
        })
        
    }
})

banner.on('job.url', function(url){

    this.hosts.push(url);

    banner.works.push({
        'id' : this.hosts.length,
        'description' : url,
        'request' :{
            'method' : 'GET',
            'uri' : url,
            'timeout' : banner.timeout
            ,  'encoding' : null
        }
    });
});
*/



/*
Request is designed to be the simplest way possible to make http calls. It supports HTTPS and follows redirects by default.
*/

/*
TODO
重定向
ESOCKETTIMEOUT
TLSSocket Error：Hostname/IP doesn't match certificate's altnames: "IP: 101.37.96.81 is not in the cert's list: "
Socket Error：Parse Error
*/   


