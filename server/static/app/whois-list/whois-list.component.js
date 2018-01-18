'use strict';

// Register `phoneDetail` component, along with its associated controller and template
angular.
  module('whoisList').
  component('whoisList', {
    templateUrl: 'whois-list/whois-list.template.html',
    controller: ['$routeParams', '$http',
      function WhoisListController($routeParams, $http) {
        this.treeOptions = {
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
        this.dataForTheTree =
        [

        ];
        this.showSelected = function(node, selected){
          console.log(node, selected)
        }
        this.showToggle = function(node, expanded){
          if(node.type === "netname"){
            $http.get('/whois/netblocks/' + $routeParams.taskId + '/' + node.name).then(function(response) {
              node.children = response.data.data.map(function(i){
                return {"name" :i.netblock, "count":i.count, "type":"netblock", "children" : [{"name":""}]}
              })
            });
          }

          if(node.type === "netblock"){
            $http.get('/whois/hosts/' + $routeParams.taskId + '/' + node.name).then(function(response) {
              node.children = response.data.data.map(function(i){
                return {"name" :i.ip,  "type":"ip", "children" : [{"name":""}]}
              })
            });
          }
        }
        var self = this;

        $http.get('/whois/' + $routeParams.taskId).then(function(response) {
          self.dataForTheTree = response.data.data.map(function(i){
            return {"name" :i.netname, "count":i.count, "type":"netname", "children" : [{"name":""}]}
          })
        });
      }
    ]
  });
