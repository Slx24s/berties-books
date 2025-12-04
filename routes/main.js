// Create a new router
const express = require("express")
const request = require("request")
const router = express.Router()

const redirectLogin = (req, res, next) => {
   if(!req.session.userId ) {
     res.redirect('./login') // redirect to the login page
   } else {
       next (); // move to the next middleware function
   }
}

// Handle our routes
router.get('/',function(req, res, next){
    res.render('index.ejs')
});

router.get('/about',function(req, res, next){
    res.render('about.ejs')
});

router.get('/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('./')
        }
        res.send('you are now logged out. <a href=' + './' + '>Home</a>');
    })
})

router.get('/weather', function(req, res, next) {
    let apiKey = 'a452cd53428004c98837504eec643e8c'
    let city = req.query.city || 'london'
    let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
    
    request(url, function(err, response, body) {
        if(err) {
            next(err)
        } else {
            var weather = JSON.parse(body)
            
            // Error handling for invalid city names
            if(weather !== undefined && weather.main !== undefined && weather.cod === 200) {
                // Render the weather page with weather data
                res.render('weather.ejs', { weather: weather })
            } else {
                // Handle error - city not found or API error
                res.render('weather.ejs', { 
                    weather: { 
                        error: 'City not found. Please check the city name and try again.' 
                    } 
                })
            }
        }
    });
})

// Export the router object so index.js can access it
module.exports = router