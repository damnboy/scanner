var generator = require('./utils/import/netblock.js');
var banner = require('./libs/http/banner');
var util = require('util');
var _ = require('lodash');

module.exports.command = 'netblock'

module.exports.describe = 'Scanning specifical netblock.'

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
}

module.exports.handler = function(argvs){

    generator.on('hosts', function(hosts){
        banner.emit('job.host', {
            "hosts": hosts,
            "ports" : argvs.ports ? argvs.ports.split(',') : ['80']
        });
    })

    banner.on('job_done', function(job){
        console.log('[%d]%s\t%s', job.statusCode, job.request.uri, job.title);
    })

    banner.on('job_error', function(job){

    })

    generator.parse(argvs.netblock);
}
