var yargs = require('yargs')

var _argv = yargs.usage('Usage: $0 <command> [options]')
  .strict()
  .command(require('./task'))
  .command(require('./domain'))
  .command(require('./whois'))
  .command(require('./service'))
  .command(require('./banner'))
  .command(require('./local'))
  .command(require('./ssl'))
  .demandCommand(1, 'Must provide a valid command.')
  .help('h', 'Show help.')
  .argv