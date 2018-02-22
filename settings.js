module.exports = {
    timeout : {
        dns : 5000,
        ssl : 5000,
        web : 5000
    },

    nmap : {
        rate : 500,
        concurrence : 1
    },
    
    db :{
        elasticsearch : {
            "host" : "218.85.154.137",
            "port" : "9200"
        },

        mongodb : {

        }
    }
}