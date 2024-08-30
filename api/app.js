/*global process,__dirname */
if(process.env.NODE_ENV != "production"){              //eger uygulama production modunda değil ise .env dosyasını yukler.
  require("dotenv").config();
}             

//gerekli modulleri dahil etme
var createError = require('http-errors');              //http hatalarını ollusturmak icin kulllanıllr
var express = require('express');                      //exprees.js uygulamasını olusturmak icin kullanılır.
var path = require('path');                            //dosya ve dizin yollarını islemek icin node.js in yerlesik modulunu kullanır.
var cookieParser = require('cookie-parser');           //requests ve cerezleri(cookies) ayrıstırmak icin kullanılır.
var logger = require('morgan');                        //isteklerin loglarını tutmak icin kullanılır.


//express uygulamasını baslatma
var app = express();                                   //exprees.js uygulamasını baslatır ve app e atar.


//goruntu motorunu ayarlama
app.set('views', path.join(__dirname, 'views'));       //goruntu sablonlarının bulundugu dizini ayarlar.
app.set('view engine', 'ejs');                         //sablon motoru olarak ejs kullanacagını ayarlar.


//middleware'leri ayarlama
app.use(logger('dev'));                                  //gelen istekleri konsolda loglar
app.use(express.json());                                 //gelen json formatindaki istek govdelerini ayrıstırır.
app.use(express.urlencoded({ extended: false }));        //gelen url - encoded veri govdelerini ayrıstırır.
app.use(cookieParser());                                 //gelen istek ve cerezleri ayrıstırır.
app.use(express.static(path.join(__dirname, 'public'))); //public dizinini statik dosyalar icin kullanır.

app.use((req,res,next)=>{                                //bu middleware her istek geldiginde calısır
  console.log("ben app.js de tanımlanan middleware'im");
  next(); 
})


app.use('/api', require('./routes/index'));              //ana rotayı index router ile eşleştirir.(http://localhost:3000/api)


app.use(function(req, res, next) {                       //bu middleware yukaridaki rotalardan hicbiriyle eslesme olmaz ise 404 hatası olusturur.
  next(createError(404));
});

app.use(function(err, req, res, next) {                  //bu middleware yakalanan hataları işler
  res.locals.message = err.message;                      //sablon motoru tarafından erişilebilecek hata mesajı ayarlar
  res.locals.error = req.app.get('env') === 'development' ? err : {}; //uygulama deveplopment modunda ise hata detaylarını şablon motoruna aktarır değilse bos nesne gonderir.

  res.status(err.status || 500);                         //http durum kodunu ayarlar:err.status varsa onu kullanır yoksa 500 yani sunucu hatası dondurur.
  res.render('error');                                   //error sablonunu render eder ve istemciye hata sayfası olarak gonderir.
});

module.exports = app;                                    //Bu satır, uygulamayı dışa aktarır,örneğin, bir sunucu oluşturmak için.
