var yargs = require('yargs')

var _argv = yargs.usage('Usage: $0 <command> [options]')
  .strict()
  .command(require('./target'))
  .command(require('./netblock'))
  .command(require('./txt'))
  .command(require('./whois'))
  .command(require('./domain'))
  .demandCommand(1, 'Must provide a valid command.')
  .help('h', 'Show help.')
  .argv