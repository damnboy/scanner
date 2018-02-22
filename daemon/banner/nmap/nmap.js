var child_process = require("child_process");
var log = require('../../../utils/logger').createLogger('[util:nmap]');
var path = require("../../../utils/path.js");
var events = require('events');
var util = require('util');
var bluebird = require('bluebird');
var settings = require('../../../settings');
var _ = require('lodash');

function NmapSchedule(){
    events.EventEmitter.call(this);
    this.chainBanner = Promise.resolve('Banner Schedule Started...');
}

util.inherits(NmapSchedule, events.EventEmitter);//使这个类继承EventEmitter

NmapSchedule.prototype.wait = function(){
     return Promise.all([this.chainBanner]);
};

NmapSchedule.prototype.portBanner = function(bannerTask){

    this.chainBanner = new Promise(function(resolve, reject){
        var proc = child_process.spawn('nmap',[
            bannerTask.ip,
            '-vv',
            '-n',
            '-sV',
            '--version-trace',
            '--version-all',
            '-Pn',
            '-p', bannerTask.port,
            '--min-rate', settings.nmap.rate
        ]);
        
        log.info('detecting banner on %s://%s:%s', bannerTask.type, bannerTask.ip, bannerTask.port);
        
        proc.stdout.on('data', function(data){
            var output = data.toString('utf-8').split('\n');
            var reg = /\d*\/tcp]*\s*open\s*([a-z\/\-]*)\s*syn-ack*\s*(?:ttl)?\s?(?:\d*)?([\w\W]*)$/g;
            output.forEach(function(line){
                    var r = reg.exec(line, 'i');
                    if(r){
                        bannerTask.service = r[1].split('/').reverse()[0];
                        bannerTask.version = r[2];
                        bannerTask.raw = Buffer.from(line, 'utf8').toString('base64');
                    }
            });
        });

        proc.stderr.on('data', function(data){
            var output = data.toString('utf-8');
            if(!output.match(/NSOCK/)){
                log.warn(output);
            }
        });

        proc.on('exit', function(code, signal){
            if(code === 0){
                resolve(bannerTask);
            }
            else{
                log.warn('nmap exit unexcepted with code: ' + code);
                reject(code);
            }
        });
    })
    .catch(function(err){
        log.error('portBanner: ' + err);
    });
    
    return this.chainBanner;
};

module.exports = new NmapSchedule();