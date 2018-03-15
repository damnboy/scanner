'use strict';

// Register `phoneDetail` component, along with its associated controller and template
angular.
  module('hostDetail').
  component('hostDetail', {
    templateUrl: 'host-detail/host-detail.template.html',
    controller: ['$routeParams', '$http',
      function HostDetailController($routeParams, $http) {
        var self = this;
        self.ip = $routeParams.ip;
        self.taskId = $routeParams.taskId;
        self.ports = []

        self.onPortBanner = function(port){
          var url = '/banner/'+ $routeParams.taskId + '/' + $routeParams.ip + '/' + port
          $http.get(url).then(function(response) {
            self.banner = response.data.data[0];
          });
        }
        $http.get('/services/'+ $routeParams.taskId + '/' + $routeParams.ip).then(function(response) {
          self.ports = response.data.data[0].tcp.sort(function(a,b){return a>b?1:-1})

        });
      }
    ]
  });
