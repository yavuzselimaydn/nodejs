class CustomError extends Error {
    constructor(code, message, description) {
        //json olarak error sınfına hata mesajını gonderiyoruz ve boylece customerror error sınıfının işlevseliğini tam olarak devalır
        super(`{"code": "${code}", "message": "${message}", "description":"${description}"}`); 
        this.code = code;
        this.message = message;
        this.description = description;
    }
}

module.exports = CustomError;