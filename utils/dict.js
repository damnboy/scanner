var fs = require('fs')
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
module.exports = {
   "getTxtDict" : getTxtDict
}