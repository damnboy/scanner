'use strict';

// Register `phoneList` component, along with its associated controller and template
angular.
  module('phoneList').
  component('phoneList', {
    templateUrl: 'phone-list/phone-list.template.html',
    controller: ['$http',
      function PhoneListController($http) {
        var self = this;
        self.orderProp = 'age';
  
        $http.get('/task').then(function(response) {
          self.phones = response.data.data.map(function(d){
            d.createDate = new Date(d.createDate);
            return d;
          });
        });
      }
    ]
  });
