module.exports.command = 'server';

module.exports.describe = 'server...';

module.exports.builder = function(yargs) {
};

module.exports.handler = function(argvs){
  var run = require('../daemon/local');
  run.handler();
};
