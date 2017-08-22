var cheerio = require('cheerio');
var fs = require('fs');
var util = require('util')
var xml2sj = require('xml2js');

function getXMLContent(file){
    return new Promise(function(resolve, reject){
        var encoding = 'utf-8';
        fs.readFile(file, function(err, data){
            if(err){
                reject(err)
            }
            else{
                resolve(data.toString('utf-8'));
            }           
        })
    })
}

getXMLContent(process.argv[2])
.then(function(xml){
    return new Promise(function(resolve, reject){
        var parse = new xml2sj.Parser()
        parse.parseString(xml, function(err, object){
            if(err){
                reject(err)
            }
            else{
                resolve(object);
            }
        })
    })
})
.then(function(object){
    object.nmaprun.host.forEach(function(host){
        

    /*
        var windows = false;
        if(host.os !== undefined){
            host.os.forEach(function(os){
                if(os.osmatch !== undefined){
                    os.osmatch.forEach(function(name){
                        //console.log(name.$.name.match(/windows/i))
                        if(name.$.name.match(/windows/i) !== null){
                            windows = true;
                        }
                    })
                }
                
            })
        }
    */

         host.address.forEach(function(addr){
            console.log(addr.$.addr)
        })
        
        
        host.ports.forEach(function(result){
            result.port.forEach(function(port){
                console.log(port.$.portid)
            })
        })
        
    })
})

/*
getXMLContent(process.argv[2])
.then(function(xml){
    const $ = cheerio.load(xml, {
        "normalizeWhitespace" : true,
        "xmlMode" : true
    });

    $('service').each(function(index, service){
        var port = service.parent;

        var rmi_registry = ''
        var curr = service;
        while(curr){
            if(curr.name === 'script'){
                rmi_registry = curr.attribs['output'];
            }
            curr = curr.next;
        }

        var address = ''
        curr = port.parent;
        while(curr){
            if(curr.name === 'address'){
                address = util.format('%s:%s', curr.attribs['addr'], port.attribs['portid'])
            }
            curr = curr.prev;
        }

        console.log(address, rmi_registry)
    })

})
.catch(function(err){
    console.log(err)
})
*/