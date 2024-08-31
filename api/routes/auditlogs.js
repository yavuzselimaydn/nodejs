const express = require("express");
const router = express.Router();
const moment = require("moment");

const Response = require("../lib/Response");
const AuditLogs = require("../db/models/AuditLogs");
const auth = require("../lib/auth")();

router.all("*", auth.authenticate(), (req, res, next) => {
    next();
});

router.post("/",auth.checkRoles("auditlogs_view"), async (req, res) => {
    try {
        let body = req.body;
        let query = {};
        let skip = body.skip;                    //sorgu sonucundan kac tane atlanarak getirilecegi
        let limit = body.limit;                  //sorgu sonucundan kac tane getirilecegi

        if (typeof skip !== "number") {
            skip = 0;
        }
        if (typeof body.limit !== "number" || body.limit > 500) {
            limit = 500;
        }

        if (body.begin_date && body.end_date) {   //eger istekte tarihler verilmis ise 
            query.created_at = {
                $gte: moment(body.begin_date), //dbdeki created_at tarihi begin_daten buyuk olmalı
                $lte: moment(body.end_date)    //dbdeki created_at tarihi end_date ten kucuk olmalı
            };
        }
        else {
            query.created_at = {
                $gte: moment().subtract(1, "day").startOf("day"),   //suanki zamandan bir gun oncesi
                $lte: moment()                                     //suanki gun
            }
        }

        let auditLogs = await AuditLogs.find(query)
            .sort({ created_at: -1 })              //kayıtları en yeniden en eskiye dogru sıralar
            .skip(skip)
            .limit(limit);


        res.json(Response.successResponse(auditLogs));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});


module.exports = router;




