// All the Imports
const express = require('express');
const methodOverride = require('method-override')
const app = express();
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const property = require('./models/rentkaro');
const { propertySchema, reviewSchema } = require('./schemas')
const Review = require('./models/review')
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport')
const localStratergy = require('passport-local')
const user = require('./models/user');
const { populate } = require('./models/review');


app.use(methodOverride('_method'))
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);
app.use(express.static('public'))
const sessionConfig = {
    secret: 'sk',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', "You must be signed in first");
        return res.redirect('/login')
    }
    next();
}
const isAuthor = async(req,res,next) =>
{
    const {id} = req.params;
    const p = await property.findById(id)
    if(id){
    if(!p.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do this')
        return res.redirect(`/properties/${id}`)
    }}
    next();
}
const isReviewAuthor = async(req,res,next) =>
{
    const {reviewID,id} = req.params;
    const p = await Review.findById(id)
  
    if(!p.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do this')
        return res.redirect(`/properties/${id}`)
    }
    next();
}
app.use(session(sessionConfig))
app.use(flash());
app.use(passport.initialize())
app.use(passport.session());
passport.use(new localStratergy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


const validateCampground = (req, res, next) => {

    const { error } = propertySchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }
    else {
        next();
    }
}
const validateReview = (req, res, next) => 
{

    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }
    else {
        next();
    }
}

// Connecting Mongoose
mongoose.connect('mongodb://localhost:27017/RentKaro', {
    useNewUrlParser: true,
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

app.get('/register', async function (req, res) {
    res.render('register.ejs');
})

app.post('/register', catchAsync(async function (req, res) {
    try {
        const { email, username, password } = req.body;
        const User = new user({ email, username });
        const registeredUser = await user.register(User, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash("success", "Welcome to Rent Karo")
            res.redirect('/properties')
        })

    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register')
    }


}))

app.get('/login', async function (req, res) {
    res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login', keepSessionInfo: true, }), async function (req, res) {
    req.flash("success", "Welcome to Rent Karo")
    const redirectUrl = req.session.returnTo || '/properties'
    res.redirect(redirectUrl);
})


app.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success', "Goodbye!");
        res.redirect('/properties');
    });
});

app.get("/properties", catchAsync(async function (req, res, next) {
    const properties = await property.find({});
    res.render('index.ejs', { properties });
}));

app.get('/properties/new', isLoggedIn, catchAsync(async function (req, res) {

    res.render('newProperty.ejs');
}));
app.get("/properties/:id", catchAsync(async function (req, res) {

    const id = req.params.id;
    const prop = await property.findById(id).populate({
        path: 'reviews',
        populate:
        {
        path: 'author'
        }})
    .populate('author');
    if (!prop) {
        req.flash('error', 'Cannot Find that campground')
        return res.redirect('/properties')
    }
    res.render('show.ejs', { prop });
}));
app.get("/properties/:id/edit", isAuthor, isLoggedIn, catchAsync(async function (req, res) {
    const id = req.params.id;
    const prop = await property.findById(id);
    if (!prop) {
        req.flash('error', 'Cannot Find that campground!');
        return res.redirect('/properties')
    }
  
    res.render('edit.ejs', { prop });
}));
app.post('/properties/:id/reviews', isLoggedIn, validateReview, catchAsync(async (req, res) => {
    const prop = await property.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    prop.reviews.push(review);
    await review.save();
    await prop.save();
    res.redirect(`/properties/${prop._id}`)

}));

app.post("/properties", isLoggedIn, validateCampground, catchAsync(async function (req, res, next) {

    const prop = new property(req.body.property)
    prop.author = req.user._id;
    await prop.save()
    req.flash('success', "Succesfully Listed your Property");
    res.redirect(`/properties/${prop.id}`)

}));

app.put('/properties/:id', isLoggedIn, isAuthor, validateCampground, catchAsync(async function (req, res) {

    const id = req.params.id;
    const prop = await property.findByIdAndUpdate(id, { ...req.body.property });
    req.flash('success', 'Successfully Updated Property')
    res.redirect(`/properties/${id}`);
}));


app.delete("/properties/:id", isAuthor,  catchAsync(async function (req, res) {
    const id = req.params.id;
    const Property = await property.findById(id);
    if (!Property.author.equals(req.user._id)) {
        req.flash('error', 'You do not have the permission to do that!')
        return res.redirect(`/properties/${id}`)
    }
    await property.findByIdAndDelete(id)
    res.redirect('/properties')
}));

app.delete('/properties/:id/reviews/:reviewID', isAuthor, isLoggedIn, catchAsync(async (req, res) => {
    await property.findByIdAndUpdate(req.params.id, { $pull: { reviews: req.params.reviewID } })
    await Review.findByIdAndDelete(req.params.id);
    res.redirect(`/properties/${req.params.id}`)
    res.send('Delete Meeeeee');
}));


app.all('*', function (req, res, next) {
    next(new ExpressError('Page Not Found', 404));
});

// Error Handling
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) {
        err.message = 'Oh, No! Something went wrong'
    }
    res.status(statusCode).render('error.ejs', { err });
})

// For Setting Up the Port at Local Host 4000
app.listen('1000', function () {
    console.log("Listening");
});