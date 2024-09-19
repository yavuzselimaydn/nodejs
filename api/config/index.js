/*global process*/
module.exports = {
    "PORT" : process.env.PORT || "3000", 
    "LOG_LEVEL" : process.env.LOG_LEVEL || "debug",
    "CONNECTION_STRING" : process.env.CONNECTION_STRING || "mongodb://localhost:27017/projeDB",
    "JWT" : {
        "SECRET" : "12345",
        "EXPIRE_TIME" : !isNaN(parseInt(process.env.TOKEN_EXPIRE_TIME)) ? parseInt(process.env.TOKEN_EXPIRE_TIME) : (24 * 60 * 60)
    },
    "DEFAULT_LANG" : process.env.DEFAULT_LANG || "EN"
}