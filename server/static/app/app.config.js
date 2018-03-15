'use strict';

angular.
  module('phonecatApp').
  config(['$locationProvider' ,'$routeProvider',
    function config($locationProvider, $routeProvider) {
      $locationProvider.hashPrefix('!');

      $routeProvider.
        when('/phones', {
          template: '<phone-list></phone-list>'
        }).
        when('/phones/:phoneId', {
          template: '<phone-detail></phone-detail>'
        }).
        when('/host/:taskId/:ip', {
          template: '<host-detail></host-detail>'
        }).
        when('/whois/:taskId', {
          template: '<whois-list></whois-list>'
        }).
        otherwise('/phones');
    }
  ]);
