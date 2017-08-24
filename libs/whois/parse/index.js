/*
    全球一共有5个RIR：ARIN,RIPE,APNIC,LACNIC,AfriNIC. 
        ARIN主要负责北美地区业务，
        RIPE主要负责欧洲地区业务，
        LACNIC主要负责拉丁美洲美洲业务
        AfriNIC负责非洲地区业务，
        APNIC负责亚太地区国家的IP地址和AS号码分配由管理。
        https://www.apnic.net/about-apnic/organization/apnics-region/national-internet-registries/
        APNIC下属还有7个分支机构，可以到上面获取更相信的whois信息
            印尼  APJII (Indonesia)
            印度  IRINN (India)
            越南  VNNIC (Viet Nam)
            韩国  KISA (Republic of Korea)

            中国  CNNIC (China)
                貌似比较low，不提供ip地址查询功能，只能查查域名
                [whois.cnnic.net]
                Out of this registry.

            日本  JPNIC (Japan)
                比较完善的whois服务，提供多语言查询，功能上有不少扩充
                [Querying whois.nic.ad.jp]
                [whois.nic.ad.jp]
                [ JPNIC database provides information regarding IP address and ASN. Its use   ]
                [ is restricted to network administration purposes. For further information,  ]
                [ use 'whois -h whois.nic.ad.jp help'. To only display English output,        ]
                [ add '/e' at the end of command, e.g. 'whois -h whois.nic.ad.jp xxx/e'.      ]

                Network Information:            
                a. [Network Number]             ***********************
                b. [Network Name]               ***********************
                g. [Organization]               ***********************
                m. [Administrative Contact]     ***********************
                n. [Technical Contact]          ***********************
                p. [Nameserver]
                [Assigned Date]                 ***********************
                [Return Date]                   
                [Last Update]                   ***********************
                                                
                Less Specific Info.
                ----------
                Yahoo Japan Corporation
                                   ***********************
                Yahoo Japan Corporation
                        ***********************

                More Specific Info.
                ----------
                No match!!

            

            台湾  TWNIC (Taiwan)
                [Querying whois.twnic.net]
                [whois.twnic.net]

                Netname: ***********************
                Netblock: ****************

                Administrator contact:
                    *********************

                Technical contact:
                    *************************

            
    在RIR之下还可以存在一些注册机构, 如：
        国家级注册机构(NIR)，
        普通地区级注册机构(LIR)。
    这些注册机构都可以从APNIC那里得到Internet地址及号码, 并可以向其各自的下级进行分配。
*/
module.exports = (function(){

    /*
        部分whois信息会返回route而不是inetname与netname

        % Information related to '124.224.0.0/16AS4134'

        route:          124.224.0.0/16
        descr:          From Ningxia Network of ChinaTelecom
        origin:         AS4134
        mnt-by:         MAINT-CHINANET
        changed:        dingsy@cndata.com 20060707
        source:         APNIC

        因此在所返回的object中提供原始字符串，方便前端查询与后续的改进
    */
    function apnic(data){
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

        'whois.apnic.net' : apnic,
        'whois.ripe.net' : apnic
    }
})()