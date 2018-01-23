var Whois = require('../whois');
var w = new Whois();
w.whois('65.206.7.36')
.then(function(response){

    response.netnames = response.detail.reduce(function(ret, block){
        ret.push(block.netname);
        return ret;

    }, []).join('^');

    console.log('------- QUERY ----------')
    console.log('query: ' + response.ip);
    console.log('whois server: ' + response.server);
    console.log('netname: ' + response.netnames);
    console.log('------- QUERY ----------')
    console.log('')

    response.detail.forEach(function(block){
        console.log('------- BLOCK ----------');
        console.log(block.netname);
        console.log(block.netblock);
        console.log(block.detail);
        console.log('------- BLOCK ----------');
    })
})
