var path = require("path");

/* path.resolve 可以理解成一组 cd命令 */

module.exports.home = function(){
    return path.resolve(__dirname, '../');
}

module.exports.daemon = function(dict){
    return path.resolve(__dirname, '../daemon', dict);
}

module.exports.dict = function(dict){
    return path.resolve(__dirname, '../dicts', dict);
}