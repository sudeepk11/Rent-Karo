const mongoose = require('mongoose')
const passport = require('passport-local-mongoose')
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
})
UserSchema.plugin(passport)
module.exports = mongoose.model('User',UserSchema)