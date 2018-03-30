var yargs = require('yargs')

var _argv = yargs.usage('Usage: $0 <command> [options]')
  .strict()
  .command(require('./netblock'))
  .demandCommand(1, 'Must provide a valid command.')
  .help('h', 'Show help.')
  .argv