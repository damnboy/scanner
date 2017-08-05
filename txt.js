var generator = require('./utils/import/txt.js');
var banner = require('./libs/http/banner');
var util = require('util');
var _ = require('lodash');

function TXT(options){
    generator.on('line', function(line){
        banner.emit('job.url', line);
    })

    banner.on('job_done', function(job){
        
        //console.log('[%d] [%d][%s]%s \t%s', job.id, job.statusCode,  job.encoding, job.request.uri, job.title);
        job.title = job.title.replace(/\n/g,'');
        console.log(' [%s]%s \t %s [%d]',  job.encoding.toLowerCase(), job.request.uri, job.title,  job.id);

    })

    banner.on('job_error', function(job){
        console.log('[%s]%s [%d] ',  job.err.message, job.request.uri, job.id)
        
    })

    generator.parse(options.file);
}

module.exports = TXT;

TXT({"file" : './test/url.txt'})