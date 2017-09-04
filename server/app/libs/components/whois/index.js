module.exports = 
angular
.module('whoisModule',[
    
])
.component('whoisList',require('./component.js'))
.filter('newlines', function () {
    return function(text) {
        return text.replace(/\n/g, '<br/>');
    }
})