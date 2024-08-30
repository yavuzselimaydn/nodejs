/*global __dirname */
var express = require('express');
var router = express.Router();

const fs = require("fs");

//__filename ise index.js dosyasının yolunu verir : C:\Users\yavuz\OneDrive\Desktop\nodejs\nodejs\api\routes\index.js
let dosyalar = fs.readdirSync(__dirname);  //dirname index.js dosyasının bulundugu klasorun yolunu verir : C:\Users\yavuz\OneDrive\Desktop\nodejs\nodejs\api\routes

for(let dosya of dosyalar){
  if(dosya.includes(".js") && dosya != "index.js"){
    router.use("/"+dosya.replace(".js", ""), require("./"+dosya))
  }
}

module.exports = router;
