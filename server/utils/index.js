module.exports.successJSONResponse = function(data){
    return {
    "status" : "success",
    "data" : data
    }
}

module.exports.failedJSONResponse = function(error){
    return {
        "status" : "failed",
        "data" : error
    }
}