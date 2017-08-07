var ip = require('ip');
var _ = require('lodash')

var async = require('async');
var cheerio = require('cheerio');   //https://github.com/cheeriojs/cheerio
var util = require('util');
var events = require('events');
var WebPage = require('./page.js');

function _request(options){
   return new Promise(function(resolve, reject){
       request(options, function(err, response, body){
           if(err){
               reject(err)
           }
           else{
               resolve(response)
           }   
       })
   })
}

function WebApplicationBanner(){

    events.EventEmitter.call(this);
    this.hosts = [];
    var self = this;
    this.works = async.queue(function(job, done){
        var page = new WebPage();
        page.request(job.request)
        .then(function(response){
            
            var body = response.body;
            const $ = cheerio.load(response.body);
            job.encoding = page.encoding;
            job.title = $('title').text();
            job.statusCode = response.statusCode;
            self.emit('job_done', job)

            done();
        })
        .catch(function(err){

            job.err = err;
            self.emit('job_error', job);

            done();
        });
    }, 64);

    this.works.drain = function() {
        console.log('finished');

    };

}

util.inherits(WebApplicationBanner, events.EventEmitter);//使这个类继承EventEmitter

var banner = new WebApplicationBanner();

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
            'timeout' : 10000,
            'encoding' : null
        }
    });
});

module.exports = banner;


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


