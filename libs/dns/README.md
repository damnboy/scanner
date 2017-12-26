# SERVFAIL
## 189.cn域名下ssl，与music两个子域名在dig查询时，会返回未知的dns服务器，基于这两个ns服务器进行dig查询，返回SERVFAIL
### music.189.cn
; <<>> DiG 9.3.6-P1-RedHat-9.3.6-16.P1.el5 <<>> music.189.cn @118.85.203.176
;; global options:  printcmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 52461
;; flags: qr rd; QUERY: 1, ANSWER: 0, AUTHORITY: 2, ADDITIONAL: 2

;; QUESTION SECTION:
;music.189.cn.			IN	A

;; AUTHORITY SECTION:
music.189.cn.		28800	IN	NS	ns1.music.189.cn.
music.189.cn.		28800	IN	NS	ns2.music.189.cn.

;; ADDITIONAL SECTION:
ns1.music.189.cn.	28800	IN	A	118.85.203.41
ns2.music.189.cn.	28800	IN	A	125.88.75.134

;; Query time: 38 msec
;; SERVER: 118.85.203.176#53(118.85.203.176)
;; WHEN: Tue Dec 26 10

### ssl.189.cn
; <<>> DiG 9.3.6-P1-RedHat-9.3.6-16.P1.el5 <<>> ssl.189.cn @118.85.203.176
;; global options:  printcmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 21245
;; flags: qr rd; QUERY: 1, ANSWER: 0, AUTHORITY: 2, ADDITIONAL: 2

;; QUESTION SECTION:
;ssl.189.cn.			IN	A

;; AUTHORITY SECTION:
ssl.189.cn.		28800	IN	NS	ns1.crm.189.cn.
ssl.189.cn.		28800	IN	NS	ns2.crm.189.cn.

;; ADDITIONAL SECTION:
ns1.crm.189.cn.		28800	IN	A	42.99.16.141
ns2.crm.189.cn.		28800	IN	A	223.255.252.34

;; Query time: 40 msec
;; SERVER: 118.85.203.176#53(118.85.203.176)
;; WHEN: Tue Dec 26 10:10:51 2017
;; MSG SIZE  rcvd: 100

