# 安装 (Installtion)

    npm install

# 说明 (Description)

    前期踩点常用toolkits，功能陆续添加中 :)

    some useful nodejs script for target recon , i am working on this project :)


##  http banner 

c段http指纹识别 

### TODO
    https支持
    https support

    
### COMMAND
    node . netblock -b 192.168.1.1/24 -p 80,81,8080



## 子域名爆破 - dns brute

    建议在网速较快的vps上执行该脚本，否则会出现很多超时错误。

支持自动以及手动，两种爆破方式。
自动：自动尝试从根域名服务器开始，以递归的方式获取到目标域名的权威ns服务器，使用目标的权威ns服务器进行子域名爆破。
手动：某些域名没有配置ns服务器，或者ns服务器配置有误，手工指定dns服务器。


###TODO
    自定义字典支持
    custom dict support
    
    暂时不支持手动类型的爆破，对于无法获取到ns服务器的域名，尝试使用递归目标域名所获取到的最后一级ns服务器作为权威ns服务器来进行解析。

###COMMAND
    node . target -d github.com
    
    
### OUTPUT
    扫描结果自动列出查询目标权威ns服务器的解析过程，爆破过程中dns响应的汇总信息，便于分析错误。
    cname记录，a记录，以及排序去重之后的ip地址信息。
    并根据ip地址，尝试获取对应ip上的80端口的http信息。

    ------
    { name: 'a.gtld-servers.net', ip: '192.5.6.30' }
    { name: 'b.gtld-servers.net', ip: '192.33.14.30' }
    { name: 'c.gtld-servers.net', ip: '192.26.92.30' }
    { name: 'd.gtld-servers.net', ip: '192.31.80.30' }
    { name: 'e.gtld-servers.net', ip: '192.12.94.30' }
    { name: 'f.gtld-servers.net', ip: '192.35.51.30' }
    { name: 'g.gtld-servers.net', ip: '192.42.93.30' }
    { name: 'h.gtld-servers.net', ip: '192.54.112.30' }
    { name: 'i.gtld-servers.net', ip: '192.43.172.30' }
    { name: 'j.gtld-servers.net', ip: '192.48.79.30' }
    { name: 'k.gtld-servers.net', ip: '192.52.178.30' }
    { name: 'l.gtld-servers.net', ip: '192.41.162.30' }
    { name: 'm.gtld-servers.net', ip: '192.55.83.30' }
    ------
    ------
    { name: 'ns2.google.com', ip: '216.239.34.10' }
    { name: 'ns1.google.com', ip: '216.239.32.10' }
    { name: 'ns3.google.com', ip: '216.239.36.10' }
    { name: 'ns4.google.com', ip: '216.239.38.10' }
    ------
    ------
    ns3.google.com
    ns2.google.com
    ns1.google.com
    ns4.google.com
    ------
    DNS probe ok, got 4 nameserver from target domain
    216.239.36.10
    216.239.34.10
    216.239.32.10
    216.239.38.10
    
    Start buster target domain: google.com
    Detecting wildcard record on target domain...
    wildcard addresses not found...
    { domain: 'ns1.google.com', data: '216.239.32.10' }
    { domain: 'vpn.google.com', data: '64.9.224.68' }
    { domain: 'vpn.google.com', data: '64.9.224.69' }
    ....
    ----- Summary ------ 
    NOERROR : 180
    FORMERR : 0
    SERVFAIL : 0
    NXDOMAIN : 2819
    NOTIMP : 0
    REFUSED : 0
    YXDOMAIN : 0
    YXPREST : 0
    NXRREST : 0
    NOTAUTH : 0
    NOTZONE : 0
    UNKNOWN : 0
    ----- Summary ------ 
    
    ----- Public ------ 
    
    { domain: 'accounts.google.com', data: '216.58.219.45' }
    { domain: 'admin.google.com', data: '216.58.219.46' }
    ...
    ----- Public ------ 
    
    ----- CName ------ 
    
    { domain: 'advisor.google.com', data: 'www3.l.google.com' }
    { domain: 'alerts.google.com', data: 'www3.l.google.com' }
    { domain: 'analytics.google.com', data: 'www3.l.google.com' }
    ...
    ----- Cname ------ 
    
    ----- Private ------ 
    
    ----- Private ------ 
    
    ----- Wildcard ------ 
    
    ----- Wildcard ------ 
    
    ----- IP ------ 
    
    108.170.217.160
    108.177.119.123
    108.177.96.123
    172.217.11.163
    ...
    ----- IP ------ 
    
    [404]http://ap.google.com:80    Error 404 (Not Found)!!1
    [404]http://api.google.com:80    Error 404 (Not Found)!!1
    [404]http://apis.google.com:80	Error 404 (Not Found)!!1
    [404]http://apis.google.com:80	Error 404 (Not Found)!!1
    [404]http://apis.google.com:80	Error 404 (Not Found)!!1
    [404]http://apis.google.com:80	Error 404 (Not Found)!!1
    [404]http://apis.google.com:80	Error 404 (Not Found)!!1
        
    