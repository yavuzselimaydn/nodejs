var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt-nodejs");
const is = require("is_js");
const jwt = require("jwt-simple");

const Users = require("../db/models/Users");
const Roles = require("../db/models/Roles");
const UserRoles = require("../db/models/UserRoles");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const config = require("../config/index");
const auth = require("../lib/auth")();

const {DEFAULT_LANG} = require("../config");
const i18n = new (require("../lib/i18n"))(DEFAULT_LANG);

router.post("/register", async (req, res) => {
  let body = req.body;
  try {

    let user = await Users.findOne({});
    if (user) {
      return res.sendStatus(Enum.HTTP_CODES.NOT_FOUND);
    }

    if (!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "email filed must be filled");
    if (is.not.email(body.email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "email filed must be an email format");

    if (!body.password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "password filed must be filled");
    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "password length must be greater than" + Enum.PASS_LENGTH);
    }

    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);    //parolayı hashledim 

    let created_user = await Users.create({
      email: body.email,
      password: password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number
    });

    let role = await Roles.create({
      role_name: Enum.SUPER_ADMIN,
      is_active: true,
      created_by: created_user._id
    });

    await UserRoles.create({
      role_id: role._id,
      user_id: created_user._id
    })

    res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED));

  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/auth", async (req,res) => {
  try {
    let {email,password} = req.body;

    Users.validateFieldsBeforeAuth(email,password);          //eposta ve şifre gecerlimi diye kontrol

    let user = await Users.findOne({email : email});         //email ile dbde kullanıcıyı buluyorum var ise

    if(!user) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED,i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language), i18n.translate("USERS.AUTH_ERROR",req.user?.language)); //db de kullanıcı yoksa hata

    //kullnıcı var ise sifre dogrumu diye bakıyorum
    if(!user.validPassword(password)) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED,i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language), i18n.translate("USERS.AUTH_ERROR",req.user?.language));

    let payload = {                                          //jwt icin payload olusturdum
      id : user._id,
      exp : parseInt(Date.now() / 1000) * config.JWT.EXPIRE_TIME
    }

    let token = jwt.encode(payload, config.JWT.SECRET);      //payload jwt olarak kodlanır. Kodlanırken gizli anahtar kullnaılır.

    let userData = {
      _id : user._id,
      first_name : user.first_name,
      last_name : user.last_name
    }

    res.json(Response.successResponse({token,userData}));
    
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.all("*", auth.authenticate(), (req, res, next) => {
  next();
});

router.get("/",auth.checkRoles("user_view"), async (req, res) => {
  try {
    let users = await Users.find({});

    res.json(Response.successResponse(users));

  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/add", auth.checkRoles("user_add"),async (req, res) => {
  let body = req.body;
  try {

    //gerekli kontroller yapılıyor 
    if (!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["email"]));
    if (is.not.email(body.email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language), i18n.translate("USERS.EMAIL_FORMAT_ERROR",req.user?.language));

    if (!body.password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["password"]));
    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language), i18n.translate("USERS.PASSWORD_LENGTH_ERROR",req.user?.language,[Enum.PASS_LENGTH]));
    }

    if (!body.roles || !Array.isArray(body.roles) || body.roles.length == 0) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,  i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language), i18n.translate("COMMON.FIELD_MUST_BE_TYPE",req.user?.language,["roles","Array"]));
    }


    let roles = await Roles.find({ _id: { $in: body.roles } });                    //gelen rol idleeri ile db deki karsılıkları cekiliyor
    if (roles.length == 0) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,  i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language), i18n.translate("COMMON.FIELD_MUST_BE_TYPE",req.user?.language,["roles","Array"]));
    };

    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);    // 8 turluk rastgele veri ile şifre hashlenir

    let user = await Users.create({                                                 //kullanıcı db ye kaydedilir.
      email: body.email,
      password: password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number
    });

    for (let i = 0; i < roles.length; i++) {                                       //her bir rol icin userRoles tablosuna bir kayıt eklenir
      await UserRoles.create({                                                     //bu kayıt user ve rol arasındaki ilişkiyi tutar.
        role_id : roles[i]._id,
        user_id : user._id,
      })
    };

    res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED));

  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/update", auth.checkRoles("user_update"),async (req, res) => {
  try {
    let body = req.body;
    let updates = {};

    if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["_id"]));

    if (body.password && body.password.length >= Enum.PASS_LENGTH) {
      updates.password = bcrypt.genSaltSync(body.password, bcrypt.genSaltSync(8), null);
    }

    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (body.first_name) updates.first_name = body.first_name;
    if (body.last_name) updates.last_name = body.last_name;
    if (body.phone_number) updates.phone_number = body.phone_number;


    if(Array.isArray(body.roles) && body.roles.length > 0){

      let userRoles = await UserRoles.find({user_id : body._id});                 //kullanıcının mevcut rolleri dbden getirilir

      let removeRoles = userRoles.filter( x => !body.roles.includes(x.role_id) ); //db olan ama gelen listede olamyanlar bu listeye atanır
      let newRoles = body.roles.filter( y => !userRoles.map(r => r.role_id).includes(y));  //dbde olmayan ama gelen listede olanlar bu listeye atanır.

      if(removeRoles.length > 0){ 
        await UserRoles.deleteMany({_id : { $in : removeRoles.map(x => x._id.toString()) } }); //olmayan roller silinir
      };

      if(newRoles.length > 0){                                                             //yeni roller eklenir her biri ayrı ayrı
        for(let i = 0; i<newRoles.length; i++){
          let userRole = new UserRoles({
            role_id : newRoles[i],
            user_id : body._id
          });

          await userRole.save();
        }
      }
    }

    await Users.updateOne({ _id: body._id }, updates);

    res.json(Response.successResponse({ success: true }));

  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/delete",auth.checkRoles("user_delete"), async (req, res) => {
  try {
    let body = req.body;

    if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,  i18n.translate("COMMON.VALIDATION_ERROR_TITLE",req.user?.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED",req.user?.language,["_id"]));

    await Users.deleteOne({ _id: body._id });

    await UserRoles.deleteMany({user_id : {$in : body._id}});

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;