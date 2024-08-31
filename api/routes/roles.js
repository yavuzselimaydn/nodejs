const express = require("express");
const router = express.Router();

const Roles = require("../db/models/Roles");
const RolePrivilegers = require("../db/models/RolePrivilegers");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const role_privileges = require("../config/role_privileges");

const auth = require("../lib/auth")();

router.all("*", auth.authenticate(), (req, res, next) => {
    next();
});

router.get("/",auth.checkRoles("role_view"), async (req, res) => {
    try {
        let roles = await Roles.find({});

        res.json(Response.successResponse(roles));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.succes(errorResponse.code).json(errorResponse);
    }
})

router.post("/add",auth.checkRoles("role_add"), async (req, res) => {
    let body = req.body;
    try {

        if (!body.role_name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error !", "role_name field must be filled.");

        if (!body.permissions || !Array.isArray(body.permissions) || body.permissions.length == 0) {
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "permissions field must be in array");
        }
        
        let role = new Roles({
            role_name: body.role_name,
            is_active: true,
            created_by: req.user?.id
        })


        await role.save();

        for (let i = 0; i < body.permissions.length; i++) {
            let priv = new RolePrivilegers({
                role_id: role._id,                        //yukarıda olusturdugum role un idsini aldım.
                permissions: body.permissions[i],
                created_by: req.user?.id
            })

            await priv.save();
        }

        res.json(Response.successResponse({ success: true }));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post("/update", auth.checkRoles("role_update"),  async (req, res) => {
    let body = req.body;
    try {

        if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error !", "_id field must be filled.")

        let updates = {};

        if (body.role_name) updates.role_name = body.role_name;
        if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

        if (body.permissions && Array.isArray(body.permissions) && body.permissions.length > 0) {   //body.permissions alanı gecerli ise bu if calısır
 
            let permissions = await RolePrivilegers.find({role_id : body._id}); //mevcut izinler dbden getirilir. Role atanmıs izinleri dizi olarak doner

            //body.permissions  = [ "category_view", "user_add", ... ]
            //permissions = [ {"role_id" : "abc" , permissions : "user_add" , _id : "acsasd"} , { "role_id": "abc", "permissions": "category_view", "_id": "qweqwe" }]
            
            //dbdeki izinlerden hangilerinin body de olmadıgını bulur
            //eger db de olan mevcut izin bodyde yoksa removed listesine eklenir
            let removedPermissions = permissions.filter(x => !body.permissions.includes(x.permissions)); 
            
            //body den gelen izinnlerin hangileri dbde yok onu bulur
            //body deki izinlerde db de olmayanlar newpermis listeisne eklenir
            let newPermissions = body.permissions.filter(x => !permissions.map(y => y.permissions).includes(x));

            if(removedPermissions.length > 0 ){
                await RolePrivilegers.deleteMany({_id : {$in : removedPermissions.map(x => x._id)}});
            }

            if(newPermissions.length > 0 ){
                for (let i = 0; i < newPermissions.length; i++) {
                    let priv = new RolePrivilegers({
                        role_id: body._id,                        //yukarıda olusturdugum role un idsini aldım.
                        permissions: newPermissions[i],
                        created_by: req.user?.id
                    })
        
                    await priv.save();
                }     
            } 
        }


        await Roles.updateOne({ _id: body._id }, updates);

        res.json(Response.successResponse({ success: true }));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post("/delete", auth.checkRoles("role_delete"),async (req, res) => {
    let body = req.body;
    try {

        if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error !", "_id field must be filled.");

        await Roles.deleteOne({ _id: body._id });

        res.json(Response.successResponse({ success: true }));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});


router.get("/role_privilegers", async (req, res) => {
    try {
        res.json(Response.successResponse(role_privileges));
    } catch (err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});


module.exports = router;