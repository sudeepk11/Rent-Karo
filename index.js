// All the Imports
const express = require('express');
const methodOverride = require('method-override')
const app = express();
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const property = require('./models/rentkaro');
const Joi = require('joi');
const {propertySchema} = require('./schemas')
const Review = require('./models/review')

// All Use and Set Properties
app.use(methodOverride('_method'))
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);

const validateCampground = (req,res,next) => { 

const {error} = propertySchema.validate(req.body);
if (error){
    const msg = error.details.map(el=> el.message).join(',')
    throw new ExpressError(msg,400)
}
else{
    next(); 
}
}

// Connecting Mongoose
mongoose.connect('mongodb://localhost:27017/RentKaro', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(function () {
        console.log("Connected")
    })
    .catch(function (error) {
        console.log("could not connect to server")
    });


// Defining all the routes
app.get("/", function (req, res) {
    res.render('home')
});

app.get("/properties", catchAsync(async function (req, res, next) {
    const properties = await property.find({});
    res.render('index.ejs', { properties });
}));

app.get('/properties/new', catchAsync(async function (req, res) {
    res.render('newProperty.ejs');
}));

app.get("/properties/:id", catchAsync(async function (req, res) {
    const id = req.params.id;
    const prop = await property.findById(id);
    res.render('show.ejs', { prop });
}));

app.get("/properties/:id/edit", catchAsync(async function (req, res) {
    const id = req.params.id;
    const prop = await property.findById(id);
    res.render('edit.ejs', { prop });
}));
app.post('/properties/:id/reviews',catchAsync(async(req,res) => {
    const prop = await property.findById(req.params.id);
    const review = new Review(req.body.review);
    prop.reviews.push(review);
    await review.save();
    await prop.save();
    res.redirect(`/properties/${prop._id}`)

}));

app.put('/properties/:id',validateCampground, catchAsync(async function(req, res) {
    const id = req.params.id;
    const prop = await property.findByIdAndUpdate(id, { ...req.body.property });
    res.redirect(`/properties/${id}`);
}));

app.post("/properties",  validateCampground ,catchAsync(async function(req, res, next) {
    const prop = new property(req.body.property)
    await prop.save()
    res.redirect(`/properties/${prop.id}`)

}));


app.delete("/properties/:id", catchAsync(async function(req, res) {
    const id = req.params.id;
    await property.findByIdAndDelete(id)
    res.redirect('/properties')
}));

app.all('*', function (req, res, next) {
    next(new ExpressError('Page Not Found',404));
})


// Error Handling
app.use((err, req, res, next) => {
    const { statusCode = 500} = err;
    if(!err.message){
        err.message = 'Oh, No! Something went wrong'
    }
    res.status(statusCode).render('error.ejs', { err });
})

// For Setting Up the Port at Local Host 4000
app.listen('4000', function () {
    console.log("Listening");
});