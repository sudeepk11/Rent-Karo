const Joi = require('joi')
module.exports.propertySchema = Joi.object({
    property: Joi.object({
        title: Joi.string().required(),
        price: Joi.number().required().min(0),
        image: Joi.string().required(),
        location: Joi.string().required(),
        description: Joi.string().required(),
        // referral: Joi.string()
    }).required()
});
