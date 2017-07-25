var ip = require('ip');
var _ = require('lodash')
var request = require('request');
var async = require('async');
var cheerio = require('cheerio');   //https://github.com/cheeriojs/cheerio
var util = require('util');
var events = require('events');

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
        _request(job.request)
        .then(function(response){
            
            var headers = response.headers;
            var body = response.body;
            const $ = cheerio.load(response.body);
            job.headers = response.headers;
            job.title = $('title').text();
            job.statusCode = response.statusCode;
            self.emit('job_done', job)
            //console.log(options.uri, $('title').text());
            done();
        })
        .catch(function(err){
            //console.log(options.uri, err.code)
            job.err = err;
            self.emit('job_error', job);
            /*
            var acceptableErrors = [
                'ECONNREFUSED',
                'ECONNRESET',
                'ENETUNREACH',
                'ETIMEDOUT',
                'ESOCKETTIMEDOUT',
                'EHOSTUNREACH'
            ];
            var is = acceptableErrors.reduce(function(cnt, errCode){
                if(err.code === errCode){
                    cnt = cnt + 1;
                }
                return cnt;
            }, 0);
            if(is === 0){
                console.log(err.name);
                console.log(options);
            }
            */
            done();
        });
    }, 32);

    this.works.drain = function() {
        console.log('finished');
        /*
        self.hosts.forEach(function(host){
            console.log(host)
        })
        */
    };
}

util.inherits(WebApplicationBanner, events.EventEmitter);//使这个类继承EventEmitter

var banner = new WebApplicationBanner();

banner.on('job', function(job){
    if(job.hosts){
        banner.hosts = banner.hosts.concat(job.hosts);
        
        job.hosts.forEach(function(host){
            job.ports.forEach(function(port){
                banner.works.push({
                    'id' : job.id,
                    'description' : job.description,
                    'request' :{
                        'method' : 'GET',
                        'uri' : util.format('http://%s:%s',host, port),
                        'timeout' : 5000
                    }
                })
            })
        })
        
    }
})

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


