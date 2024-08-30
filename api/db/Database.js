/*global process*/
const mongoose = require("mongoose");

let instance = null;                      //bu clasın sadece bir ornegi olusturulsun diye tanımladım
class Database {

    constructor() {
        if (!instance) {                //eger instance degiskeni null ise yani daha once bir database ornegi olusturulmamıs ise asagıdaki kod calısır.
            this.mongoConnection = null;
            instance = this;             //instance degiskeni suanki sinif ornegine atar boylece sınıf her olsutugunda hep aynı ornek doner.
        }

        return instance;                 //her olusturmada hep aynı instance doner : Singleton tasarım deseni
    }

    async connect(options) {
        try {
            console.log("DB Connecting...");
            let db = mongoose.connect(options.CONNECTION_STRING);
            this.mongoConnection = db;
            console.log("DB Connected.");
        } catch (error) {
            console.log(error);
            process.exit(1);
        }
    }


}

module.exports = Database;