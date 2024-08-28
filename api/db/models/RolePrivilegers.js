const mongoose = require("mongoose");

const schema = mongoose.Schema(
    {
        role_id: { type: mongoose.SchemaTypes.ObjectId, required: true },      //dbdeki roles tablosundaki id
        permissions: { type: String, required: true },                         //role_privileges deki key alanına denk gelir
        created_by: { type: mongoose.SchemaTypes.ObjectId}
    },
    {
        versionKey: false,
        timestamps: {
            createdAt: "created_at",
            updateAt: "update_at"
        }
    }
);

class RolePrivilegers extends mongoose.Model {

}

schema.loadClass(RolePrivilegers);
module.exports = mongoose.model("role_privilegers", schema); 