const passport = require("passport");
const { ExtractJwt, Strategy } = require("passport-jwt");
const Users = require("../db/models/Users");
const UserRoles = require("../db/models/UserRoles");
const RolePrivileges = require("../db/models/RolePrivilegers");
const config = require("../config");
const privs = require("../config/role_privileges");
const Response = require("./Response");
const Enum = require("../config/Enum");
const CustomError = require("../lib/Error");

module.exports = function () {
    let strategy = new Strategy(                                       //jwt stratejisi ,kullanıcı kimlik bilgilerini dogrulamak icin kullanılır
        {   
            //strategy yapılandırması
            secretOrKey: config.JWT.SECRET,                            //jwt nin şifrelenmesinde kullanılan gizli anahtar
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()   //jwt nin nereden alınacagını belirtir
        },
        async (payload, done) => {                                     //jwt dogrulandıktan sonra calısan fonk. payload => jwt icindeki bilgiler. done =>passportun kımlik dogrulama icin cagırdıgı callback
            try {
                let user = await Users.findOne({ _id: payload.id });   //kullanıcı db de varmı yokmu ona bakıyorum.

                if (user) {

                    let userRoles = await UserRoles.find({ user_id: payload.id }); //kullanıcının sahıp olduggu roller 

                    let rolePrivileges = await RolePrivileges.find({ role_id: { $in: userRoles.map(ur => ur.role_id) } }); //rollerın ızınlerı
                    
                    let privileges = rolePrivileges.map(rp => privs.privileges.find(x => x.key == rp.permissions));  //rollerin ayrıntıları verdim kullanıcıya

                    done(null, {                                     //kimlik dogrulama işlemi basarılı kullanıcı bilgileri bu fonka gonderılır.
                        id: user._id,
                        roles: privileges,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        language : user.language,
                        exp: parseInt(Date.now() / 1000) * config.JWT.EXPIRE_TIME
                    });           

                } else {
                    done(new Error("User not found"), null);      //kimlik dogrulama basarısız
                }

            } catch (error) {
                done(error, null);
            }
        }
    );

    passport.use(strategy);                                          //yukarıda tanımlanan statereji passport kutuphanesine ekler.

    return {
        initialize : function() {
            return passport.initialize();                            //passportu baslatmak icin kullanılır.
        },
        authenticate : function(){
            return passport.authenticate("jwt", {session : false}); //jwt dogrulamasını baslatmak icin kullnaılır.
        },
        checkRoles : (...expectedRoles) =>{
            return(req,res,next) =>{

                let i = 0;
                let privileges = req.user.roles.map(x => x.key);

                while ( i < expectedRoles.length && !privileges.includes(expectedRoles[i])) i++;

                if(i >= expectedRoles.length){
                    let response = Response.errorResponse(new CustomError(Enum.HTTP_CODES.UNAUTHORIZED,"Need Permission", "Need Permission !"))
                    return res.status(response.code).json(response);
                }

                return next();
            }
        }
    }

};