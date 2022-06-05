const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const RentKaroSchema = new Schema({
    title: String,
    price: Number,
    description: String,
    image: String,
    location: String,
    ref: String
})
module.exports = mongoose.model('property',RentKaroSchema)