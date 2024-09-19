const mongoose = require("mongoose");
const Enum = require("../../config/Enum");
const CustomError = require("../../lib/Error");
const is = require("is_js");
const bcrypt = require("bcrypt-nodejs");
const {DEFAULT_LANG} = require("../../config");
const schema = mongoose.Schema(     //şema mongo dbde saklanacak belgelerin yapısını belirler.
    {
        email: { type: String, required: true, unique : true },
        password: { type: String, required: true },         
        is_active: { type: Boolean, default: true },      
        first_name: String,
        last_name: String,
        phone_number: String,
        language : {type : String , default : DEFAULT_LANG}
    },
    {
        versionKey : false,
        //timestaps : true
        timestamps: {
            createdAt: "created_at",
            updateAt: "updated_at"
        }
    }
);

class Users extends mongoose.Model {

    validPassword(password){
        return bcrypt.compareSync(password,this.password);  //saglanan sifre ile dbdeki sifreyi hashlenmis hallerini karsılastırır: true false doner.
    }

    static validateFieldsBeforeAuth(email,password){
        if(typeof password !== "string" || password.length < Enum.PASS_LENGTH || is.not.email(email)){
            throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "Validation Error" , "email or password wrong");
        }
        return null;
    }

}

schema.loadClass(Users);                             //user sınıfını semaya yukler, buda user sınıfındaki metotların mongoose modeline eklemeye yarar.
module.exports = mongoose.model("users", schema);    //semaya dayalı mongoose modelini disa aktarır.