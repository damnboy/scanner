var generator = require('./utils/import/netblock.js');
var WebBanner = require('./libs/http/banner');
var util = require('util');
var _ = require('lodash');

module.exports.command = 'netblock'

module.exports.describe = 'Scan specify netblock.'

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('netblock', {
      alias: 'b'
    , describe: 'netblock'
    , type: 'string'
    , demand: true
    })
    .option('ports', {
      alias: 'p'
    , describe: 'ports'
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

    var banner = new WebBanner();
    banner.timeout = argvs.timeout;
    console.log('Global timeout set to: %dms', banner.timeout);
    generator.on('hosts', function(hosts){
        var ports = argvs.ports ? argvs.ports.split(',') : ['80'];
        ports.forEach(function(port){
            hosts.forEach(function(host){
                banner.host(host, port)
            })
        })
    })


    generator.parse(argvs.netblock);
}
