var excel = require('./import/excel.js');
var banner = require('./http/banner.js');
var util = require('util');
var _ = require('lodash');

module.exports = function(options){
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

    excel.parse(options.file, options.col, function(sheet){
        sheet.on('row', function(rownum, row){
                if(rownum === 1){
                    return;
                }
                var targets = [];
                //处理G，H列
                var ports = row[util.format('T%d', rownum)];
                if(ports === undefined){
                    ports = ['80'];
                }
                else{
                    ports = ports.w.replace(/\s+|、|\//g, '\n').split('\n');
                }
                ports = ports.reduce(function(result, port){
                    var range = port.split('-');
                    if(range.length === 1){
                        result.push(range[0]);
                    }
                    else{
                        result = result.concat(_.range(range[0], range[1], 1));
                    }
                    return result;
                }, []);

                var hosts = row[util.format('S%d', rownum)];
                if(hosts !== undefined){
                    hosts = hosts.w.split('\n').reduce(function(r, host){
                        if(host.length !== 0){
                            r.push(host.replace(/\s+/g, ''));
                        }
                        return r;
                    },[])
                }
                
                //处理D列,该列信息太乱，暂时不处理
                /*
                    http://jmrware.com/articles/2009/uri_regexp/URI_regex.html

                */
                var domains = row[util.format('R%d', rownum)];
                if(domains !== undefined){
                    domains = domains.w.split('\n').map(function(domain){
                        return domain = domain.replace(/\s+/g, '');
                    })
                }       

                var job = {
                    'id' : rownum,
                    'description' : (row[util.format('C%d', rownum)] ? row[util.format('C%d', rownum)].w : '[]'),
                    'hosts' : hosts,
                    'ports' : ports,
                    'urls' : domains
                };
                banner.emit('job', job);
        });
    })
}
