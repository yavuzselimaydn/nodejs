const mongoose = require("mongoose");

const schema = mongoose.Schema(
    {
        role_id: { type: mongoose.SchemaTypes.ObjectId, required: true },
        permission: { type: String, required: true },
        created_by: { type: mongoose.SchemaTypes.ObjectId, required: true }
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