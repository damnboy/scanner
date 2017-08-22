function d(domain){
    return new Promise(function(resolve, reject){
        whois.lookup(domain, function(err, data){
            if(err){
                reject(err);
            }

            resolve(data);

        })
    })
}
