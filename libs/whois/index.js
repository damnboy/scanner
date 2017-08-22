/*
*   tcp43端口上的纯文本协议
    请求：以\r\n为结束
    相应：服务端主动关闭连接表示结束

    whois的标准定义非常含糊，几乎每个域名都有自己的whois服务，实现都存在各式各样的差异。
    标准化是一个很艰辛的过程，诸如RWhois，Whois++之类的项目都死了。

    whois服务器存在许多接口，公共接口，私有接口等。某些域名甚至不提供whois查询的功能。

    https://maxchadwick.xyz/blog/dealing-with-whois-records
    ruby版本的whois解析器内置大量tld的解析方式，（https://github.com/weppos/whois-parser/tree/4806a7c82c155f0cf50c8a01b71b1d42bca0ec66/lib/whois/parsers）
    作者直接使用该project配合sinatra框架搭建一个ruby版本的whois服务器
    然后在php中使用Novutec来作whois请求与响应


    top level domain maintained by iana http://data.iana.org/TLD/tlds-alpha-by-domain.txt

    top level domain and their managers https://www.iana.org/domains/root/db

    所以，目前看来，并没有什么特别好的方法来处理whois，只能见到一个写一个。
    使用统计分析与机器学习的方式也不是不可以，只不过太过繁琐了，可以参考。
    https://ian.ucsd.edu/papers/imc15-whois.pdf

    好在ip不像域名那么变态，只有全球只有五大机构负责ip地址的分配，所以解析的工作相对没有域名工作量那么大。
    不过要细化到每个nic自己的whois解析记录，实际上还是有一定工作量的。


*   whois内置的递归查询存在问题，follow参数存在bug
*
*
*
*   TODO
    抽取remark中的提示信息
    remarks:        This information has been partially mirrored by APNIC from
    remarks:        JPNIC. To obtain more specific information, please use the
    remarks:        JPNIC WHOIS Gateway at
    remarks:        http://www.nic.ad.jp/en/db/whois/en-gateway.html or
    remarks:        whois.nic.ad.jp for WHOIS client. (The WHOIS client
    remarks:        defaults to Japanese output, use the /e switch for English
    remarks:        output)
*/


module.exports = require('./ip');
/*
var whois = new IPWhois();

whois.on('result', function(data){
    console.log(data)
})

whois.whois('192.168.0.1')
*/


