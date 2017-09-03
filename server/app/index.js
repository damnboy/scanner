
require('angular');
require('angular-route');
require('angular-ui-bootstrap')

angular
.module('probeApp',[
    'ngRoute',
    'ui.bootstrap',
    require('./libs/services/socket').name,
    require('./libs/services/fakedb').name,
    require('./libs/components/dns').name,
    require('./libs/components/whois').name
])
.config(function config($locationProvider, $routeProvider){
    $locationProvider.hashPrefix('!');

    $routeProvider
    .when('/dns',{
        template : '<dns-list></dns-list>'
    })
    .when('/whois',{
        template : '<whois-list></whois-list>'
    })
    .otherwise('/');
})