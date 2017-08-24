var IPWhois = require('./libs/whois');
var util = require('util');
var _ = require('lodash');
var ip = require('ip');

module.exports.command = 'whois'

module.exports.describe = 'whois...'

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('address', {
      alias: 'a'
    , describe: 'ipv4 address'
    , type: 'string'
    , demand: false
    })
    .option('file', {
      alias: 'f'
    , describe: 'file'
    , type: 'string'
    , demand: false
    })
    .option('timeout', {
      alias: 'x'
    , describe: 'timeout'
    , type: 'number'
    , demand: false
    , default: 10000
    })
}

module.exports.handler = function(argvs){

    var whois = new IPWhois();


    whois.on('finish', function(summary){
        Object.keys(summary).forEach(function(k){
            console.log(k, summary[k])
        })
    })

    if(argvs.address){
        return whois.whois(argvs.address);
    }
    
    if(argvs.file){
        var fs = require('fs');
        fs.readFile(argvs.file, function(err, data){
            var addr = data.toString('utf-8').split('\n');
            
            addr.forEach(function(a){
                if(ip.isV4Format(a)){
                    whois.whois(a)
                }
            })
        })
    }
}
