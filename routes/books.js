// Create a new router
const express = require("express")
const { check, validationResult } = require('express-validator');
const router = express.Router()

const redirectLogin = (req, res, next) => {
   if(!req.session.userId ) {
     res.redirect('/users/login') // redirect to the login page
   } else {
       next (); // move to the next middleware function
   }
}

router.get('/search',function(req, res, next){
    res.render("search.ejs")
});

router.get('/search-result', 
[check('keyword').notEmpty().withMessage('Search keyword cannot be empty').trim().escape()],
function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.redirect('./search')
    }
    let keyword = req.sanitize(req.query.keyword)
    let sqlquery = "SELECT * FROM books WHERE name LIKE ?"
    let searchPattern = '%' + keyword + '%'
    db.query(sqlquery, [searchPattern], (err, result) => {
        if (err) {
            next(err)
        }
        res.render("searchresults.ejs", { keyword: keyword, results: result })
    })
});

router.get('/list', redirectLogin, function(req, res, next) {
    let sqlquery = "SELECT * FROM books"; // query database to get all the books
    // execute sql query
    db.query(sqlquery, (err, result) => {
        if (err) {
            next(err)
        }
        res.render("list.ejs", {availableBooks: result})
    });
});

router.get('/addbook', function(req, res, next) {
    res.render("addbook.ejs")
});

router.post('/bookadded',
[check('name').notEmpty().withMessage('Book name is required').trim().escape(),
 check('price').isFloat({min: 0.01}).withMessage('Price must be a positive number')],
function(req,res,next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.redirect('./addbook')
    }
    // saving data in database
    const bookName = req.sanitize(req.body.name)
    const bookPrice = req.body.price
    let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)"
    // execute sql query
    let newrecord = [bookName, bookPrice]
    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            next(err)
        }
        else
            res.send(' This book is added to database, name: ' + bookName + ' price ' + bookPrice)
    })
})

router.get('/bargainbooks', function(req, res, next) {
    let sqlquery = "SELECT * FROM books WHERE price < 20";
    db.query(sqlquery, (err, result) => {
        if (err) {
            next(err)
        }
        res.render("bargainbooks.ejs", { bargainBooks: result })
    })
})

// Export the router object so index.js can access it
module.exports = router
