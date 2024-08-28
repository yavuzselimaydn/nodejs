var express = require('express');
var router = express.Router();
const Categories = require("../db/models/Categories");                  //db işlemlerini yapmak icin kullanılan db modeli.
const Response = require("../lib/Response");                            //yanıtları standartlastırmak icin yazdıgım sınıf
const CustomError = require("../lib/Error");                            //hatayı daha kapsamlı acıklamak icin
const Enum = require("../config/Enum");                                 //sabit degerleri saklarım
const AuditLogs = require("../lib/AuditLogs");
const logger = require("../lib/logger/LoggerClass");

router.get('/', async (req, res, next) => {
    try {
        let categories = await Categories.find({});                     //db ye sorgu atar ve tum categorileri alır.
        res.json(Response.successResponse(categories));
    } catch (error) {
        let errorResponse = Response.errorResponse(err);
        res
            .status(errorResponse.code)                                    //yanıtın hhtp durum kodunu ayarladım
            .json(errorResponse);                                          //json formatinda yanıt gonderir.
    }
});


router.post("/add" , async (req,res) => {
    let body = req.body;
    try {
        if(!body.name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Validation Error!", "name fields must be filled")
        
        let category = new Categories({                                //yeni kategori nesnesi olusturur.
            name: body.name,
            is_active : true,
            created_by : body.user?.id,
        });

        await category.save();                                         //yeni kategoriyi db ye kaydeder.

        AuditLogs.info(req.user?.email, "Categories", "Add" , category);
        logger.info(req.user?.email,"Categories" , "Add" , category);

        res.json(Response.successResponse({success : true}));
        
    } catch (err) {
        logger.error(req.user?.email,"Categories" , "Add" , err);
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
})

router.post("/update" , async (req,res) => {
    let body = req.body;
    try {

        if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Validation Error!", "_id fields must be filled")
        
        let updates = {};

        if(body.name) updates.name = body.name;
        if(typeof body.is_active === "boolean") updates.is_active = body.is_active;

        await Categories.updateOne({ _id : body._id} , updates );        //db deki veriyi id ile bulur ve gunceller updates ile

        AuditLogs.info(req.user?.email, "Categories", "Update" , {_id : body._id, ...updates});

        res.json(Response.successResponse({success : true}));
        
    } catch (err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});


router.post("/delete", async (req, res) => {
    let body = req.body;

    try {
        if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"Validation Error!", "_id fields must be filled");

        await Categories.deleteOne({ _id: body._id });

        AuditLogs.info(req.user?.email, "Categories", "Delete" , {_id : body._id});

        res.json(Response.successResponse({ success: true }));
    } catch (err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }

});






module.exports = router;


