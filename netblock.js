var generator = require('./utils/import/netblock.js');
var banner = require('./libs/http/banner');
var util = require('util');
var _ = require('lodash');

generator.on('job', function(job){
    job.ports = ['80'];
    banner.emit('job', job);
})

banner.on('job_done', function(job){
    console.log('[%d]%s\t%s', job.statusCode, job.request.uri, job.title);
})

banner.on('job_error', function(job){

})

generator.parse('127.0.0.1/24');