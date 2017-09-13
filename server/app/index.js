
require('angular');
require('angular-route');
require('angular-ui-bootstrap');
require('angular-ui-router');

angular
.module('probeApp',[
    'ngRoute',
    'ui.bootstrap',
    'ui.router',
    require('./libs/services/socket').name,
    require('./libs/services/fakedb').name,
    require('./libs/components/dns').name,
    require('./libs/components/whois').name,
    require('./libs/components/probe').name
])
/*
.config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
        
        $stateProvider
        .state('/whois', {
            url: "/whois",
            views: {
              "whois": { template: "<whois-list></whois-list>" }
            }
          })
          .state('/dns', {
            url: "/dns",
            views: {
              "dns": { template: "<dns-list></dns-list>" }
            }
          });
        $urlRouterProvider.otherwise('/');
}]);
*/
/*.config(function config($locationProvider, $routeProvider){
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
*/