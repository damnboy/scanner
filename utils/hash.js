var crypto = require('crypto');

/*
cmd5.com 常见带盐算法
md5($pass.$salt) 	
md5($salt.$pass)
md5(md5($pass).$salt);
md5(md5($salt).md5($pass))
sha1($salt.$pass)
sha256($pass.$salt)
sha256($salt.$pass)
sha256($salt.$pass)
*/
var password = '123456';
var salt = '1jgZQ';
console.log(genMD5String(password + salt));
console.log(genMD5String(salt + password));
console.log(genMD5String(genMD5String(password)+salt));
console.log(genMD5String(genMD5String(password)+genMD5String(salt)));
//179b7df94f6af65badc029ceed4bd6d7
function genSHA256String(raw){

}
function genMD5String(raw){
    var md5 = crypto.createHash('md5');
    md5.update(raw);
    return md5.digest('hex')
}

