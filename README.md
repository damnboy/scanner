# 说明
前期踩点常用toolkits，功能陆续添加中 :)
## 模块
### 子域名爆破 
./daemon/domain.js

### 全端口扫描 
./daemon/service.js

### whois信息收集 
./daemon/whois.js

### ssl信息收集 
./daemon/banner/ssl/index.js


### http信息收集 
./daemon/banner/web/index.js

### nmap端口指纹识别 
./daemon/banner/nmap/index.js

# 依赖

## Nmap 7.60
https://nmap.org/dist/nmap-7.60.tar.bz2

## zeromq
sudo yum install -y epel-release
sudo yum install -y zeromq-devel

## mongodb 3.6.2
https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-3.6.3.tgz
 
#安装&运行
下载以上依赖后，执行npm install & node ./deamon local


# remark
http://www.alolo.co/blog/2013/10/11/10-books-on-javascript
