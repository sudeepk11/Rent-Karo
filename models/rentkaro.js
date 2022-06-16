const { func } = require('joi');
const mongoose = require('mongoose');
const review = require('./review');
const Schema = mongoose.Schema;
const RentKaroSchema = new Schema({
    title: String,
    price: Number,
    description: String,
    image: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
    {
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }
    ]
})
RentKaroSchema.post("findOneAndDelete", async function(doc){
   if(doc){
       await review.remove({
           _id: doc.reviews
       })
   }
})
module.exports = mongoose.model('property',RentKaroSchema)