const mongoose = require("mongoose");

const schema = mongoose.Schema(     //şema mongo dbde saklanacak belgelerin yapısını belirler.
    {
        email: { type: String, required: true, unique : true },
        password: { type: String, required: true },         
        is_active: { type: Boolean, default: true },      
        first_name: String,
        last_name: String,
        phone_number: String
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

}

schema.loadClass(Users);                             //user sınıfını semaya yukler, buda user sınıfındaki metotların mongoose modeline eklemeye yarar.
module.exports = mongoose.model("users", schema);    //semaya dayalı mongoose modelini disa aktarır.