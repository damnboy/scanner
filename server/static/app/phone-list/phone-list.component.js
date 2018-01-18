'use strict';

// Register `phoneList` component, along with its associated controller and template
angular.
  module('phoneList').
  component('phoneList', {
    templateUrl: 'phone-list/phone-list.template.html',
    controller: ['$http',
      function PhoneListController($http) {
        
        var self = this;
        self.treeOptions = {
          nodeChildren: "children",
          dirSelectable: true,
          injectClasses: {
              ul: "a1",
              li: "a2",
              liSelected: "a7",
              iExpanded: "a3",
              iCollapsed: "a4",
              iLeaf: "a5",
              label: "a6",
              labelSelected: "a8"
          }
        }

        self.dataForTheTree =
        [
          { "name" : "Joe", "age" : "21", "children" : [
            { "name" : "Smith", "age" : "42", "children" : [] },
            { "name" : "Gary", "age" : "21", "children" : [
              { "name" : "Jenifer", "age" : "23", "children" : [
                { "name" : "Dani", "age" : "32", "children" : [] },
                { "name" : "Max", "age" : "34", "children" : [] }
              ]}
            ]}
          ]},
          { "name" : "Albert", "age" : "33", "children" : [] },
          { "name" : "Ron", "age" : "29", "children" : [] }
        ];

        self.showSelected = function(node){
          console.log(node)
          alert(node);
        }
        
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
