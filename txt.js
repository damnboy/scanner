var generator = require('./utils/import/txt.js');
var banner = require('./libs/http/banner');
var util = require('util');
var _ = require('lodash');

module.exports.command = 'txt'

module.exports.describe = 'Scan specify txtfile.'

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('file', {
      alias: 'f'
    , describe: 'filename'
    , type: 'string'
    , demand: true
    })
    .option('type', {
      alias: 't'
    , describe: 'file type'
    , type: 'string'
    , demand: true
    })
    .option('ports', {
      alias: 'p'
    , describe: 'ports'
    , type: 'string'
    , default: '80'
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
    banner.timeout = argvs.timeout;

     generator.on('line', function(line){
         if(argvs.type === 'url'){
            banner.emit('job.url', line);
         }
        
         if(argvs.type === 'ip'){
            banner.emit('job.host', {
                "hosts": [line],
                "ports" : argvs.ports.split(',')
            });
         }
         /*
         if(argvs.type === 'netblock'){
             require('./netblock').handler(argvs);
         }
        */
    })

    banner.on('job_done', function(job){
        
        //console.log('[%d] [%d][%s]%s \t%s', job.id, job.statusCode,  job.encoding, job.request.uri, job.title);
        job.title = job.title.replace(/\n/g,'');
        console.log(' [%s]%s \t %s [%d]',  job.encoding.toLowerCase(), job.request.uri, job.title,  job.id);

    })

    banner.on('job_error', function(job){
//        console.log('[%s]%s [%d] ',  job.err.message, job.request.uri, job.id)
        
    })

    generator.parse(argvs.file);

}
