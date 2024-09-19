const Enum = require("../config/Enum");
const CustomError = require("./Error");
const {DEFAULT_LANG} = require("../config");

const i18n = new (require("./i18n"))(DEFAULT_LANG);

class Response {
    constructor() { }

    static successResponse(data,code = 200){         //basarıllı yanıtı dondurur.
        return {code,data};
    }

    static errorResponse(error,lang){                     //hata durumlarını yonetir.
        console.error(error)

        if(error instanceof CustomError){  //eger hata custom error ise hata ozellestirilmis hata oldugu icin bu sekilde doner hata bilgilerini 
            return{
                code : error.code,
                error: {
                    message: error.message,
                    description : error.description
                }
            }
        }
        else if(error.message.includes("E11000")) {
            return{                           //hata custom erorr degilse genel bir hata doner
                code : Enum.HTTP_CODES.CONFLICT,
                error: {
                    message: i18n.translate("COMMON.ALREADY_EXISTS",lang),
                    description : i18n.translate("COMMON.ALREADY_EXISTS",lang),
                }
            };
        }


        return{                           //hata custom erorr degilse genel bir hata doner
            code : Enum.HTTP_CODES.INT_SERVER_ERROR,
            error: {
                message: i18n.translate("COMMON.UNKNOWN_ERROR",lang),
                description : error.message,
            }
        }
    }
   
}

module.exports = Response;


