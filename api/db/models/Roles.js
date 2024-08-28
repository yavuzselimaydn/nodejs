const mongoose = require("mongoose");
const RolePrivilegers = require("./RolePrivilegers");

const schema = mongoose.Schema(
    {   
        role_name : {type : String,required : true, unique : true},
        is_active: {type : Boolean,default : true},
        created_by : {
            type : mongoose.SchemaTypes.ObjectId,
        }
    },
    {
        versionKey : false,
        timestamps :{
            createdAt : "created_at",
            updateAt : "updated_at"
        }
    }
);

class Roles extends mongoose.Model {

    static async deleteOne(query){                                    //deleteOne fonku override ettim ve silme oncesinde bir kac işelm yapıcam

        if(query._id){
            await RolePrivilegers.deleteMany({role_id : query._id})  //yani sunu yaptım bir rol silinirse ona ait role privilegerside sil.
        }
        
        await super.deleteOne(query);
    }

}

schema.loadClass(Roles);
module.exports = mongoose.model("roles",schema);