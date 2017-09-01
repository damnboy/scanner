
var angular = require('angular');

angular.module('probeApp',[
    require('./libs/services/socket').name,
    require('./libs/components/dns').name
])