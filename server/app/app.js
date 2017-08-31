'use strict';

// Define the `phonecatApp` module
angular.module('probeApp', [
  // ...which depends on the `phoneList` module
  'dnsModule',
  'webServerModule',
  'whoisModule',
  'debugModule',
  'socketModule'
]);
