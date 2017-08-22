module.exports = (function(){
    //var logger = options.logger;
    return {
        'whois.arin.net' : function(data){
            var infos = data.match(/#\s*start([\w\W]*?)#\s*end/g);
            if(infos === null){
                infos = [data];
            }
            if(infos){
                /*
                    NetRange:       8.0.0.0 - 8.255.255.255
                    CIDR:           8.0.0.0/8
                    NetName:        LVLT-ORG-8-8
                */
                return infos.map(function(i){
                    var ret = {
                        'detail' : i
                    }
                    var netname = i.match(/NetName:\s*([^\n]*)/)
                    var inetnum = i.match(/NetRange:\s*([^\n]*)/)
                    if(netname !== null && inetnum !== null){
                        //logger.info('%s\t%s', netname[1], inetnum[1])
                        ret['netname'] = netname[1];
                        ret['netblock'] = inetnum[1];
                    }
                    return ret;                    
                })
            }
        },

        'whois.apnic.net' : function(data){
            var infos = [];
            while(true){
                var m = data.lastIndexOf('% Information related to');
                if(m === -1){
                    break;
                }
                infos.push(data.substring(m, data.length));
                data = data.substring(0, m);
            }
            infos.reverse();
            /*
                inetnum:        218.85.0.0 - 218.86.127.255
                netname:        CHINANET-FJ
            */
            return infos.map(function(i){
                var ret = {
                    'detail' : i
                }
                var netname = i.match(/netname:\s*([^\n]*)/)
                var inetnum = i.match(/inetnum:\s*([^\n]*)/)
                if(netname !== null && inetnum !== null){
                    //logger.info('%s\t%s', netname[1], inetnum[1])
                    ret['netname'] = netname[1];
                    ret['netblock'] = inetnum[1];
                }
                return ret;
            })
        }
    }
})()