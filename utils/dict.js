var fs = require('fs')
var path = require("./path.js");

function getTxtDict(filename){
    var dict = [];
    if(dict.length > 0){
        return Promise.resolve(dict);
    }
    return new Promise(function(resolve, reject){
        fs.readFile(filename, function(err, data){
            if(err){
                reject(err);
            }
            else{
                var string = data.toString('ascii');
                resolve(string.split('\n'));
            }
        });
    });
}

module.exports.getDNSDict = function(dict){
    return getTxtDict(path.dict("./dns/" + dict))
}

