const Property = require('/Users/sudeepkulkarni/Desktop/Rent Karo/models/rentkaro.js')
const mongoose = require('mongoose');
const cities = require('/Users/sudeepkulkarni/Desktop/Rent Karo/seeds/cities.js')
const BelgaumCities = require('/Users/sudeepkulkarni/Desktop/Rent Karo/seeds/belgaumHotels.js')
const {places,descriptors} = require('/Users/sudeepkulkarni/Desktop/Rent Karo/seeds/seedhelpers.js')
mongoose.connect('mongodb://localhost:27017/RentKaro',{
    useNewUrlParser: true, 
    useUnifiedTopology: true
})
.then(function(){
  console.log("Connected")
})
.catch(function(error){
  console.log("could not connect to server")
});
const sample = array =>  array[Math.floor(Math.random()*array.length)] 


const seedDB = async() => {
   await Property.deleteMany({})
   for(let i =0 ; i<5; i++){
     const random1000 = Math.floor(Math.random()*1000)
     let newProperty = new Property({
      //  location: `${cities[random1000].city} ${cities[random1000].state}`,
      //  title: `${sample(descriptors)} ${sample(places)}`,
       title: BelgaumCities[i].title,
       price: BelgaumCities[i].price,
       location: BelgaumCities[i].city + " " + BelgaumCities[i].state,
       description:  'Lorem ipsum dolor sit citationem fugiat, quaerat repudiandae sit voluptatum dignissimos distinctio at repellendus corrupti doloremque eaque eos..replace Inventorequod quas!',
       image: BelgaumCities[i].image
      
     })
     await newProperty.save();
   }

}

seedDB();