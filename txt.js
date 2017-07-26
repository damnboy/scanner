var generator = require('./utils/import/txt.js');
var banner = require('./libs/http/banner');
var util = require('util');
var _ = require('lodash');

module.exports = function(options){
    generator.on('job', function(job){
        job.ports = ['80'];
        //console.log(job);
        banner.emit('job', job);
    })

    banner.on('job_done', function(job){
        console.log('\r\n------%s--------\r\n', job.description)
        console.log('[%d]%s\t%s\r\n', job.statusCode, job.request.uri, job.title);
        Object.keys(job.headers).forEach(function(tag){
            console.log('%s:%s', tag, job.headers[tag]);
        })
        console.log('\r\n--------------\r\n')
        if(job.urls.length !== 0){
        job.urls.forEach(function(url){
            console.log(url);
        })
        console.log('\r\n--------------\r\n')
        }
    })

    banner.on('job_error', function(job){

    })

    generator.parse(options.file);
}
