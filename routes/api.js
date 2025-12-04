// Create a new router
const express = require("express")
const router = express.Router()

router.get('/books', function(req, res, next) {
    // Get query parameters
    let search = req.query.search
    let minPrice = req.query.minprice
    let maxPrice = req.query.maxprice
    let sort = req.query.sort
    
    // Build SQL query dynamically based on parameters
    let sqlquery = "SELECT * FROM books"
    let conditions = []
    let params = []
    
    // Add search condition if search term is provided
    if (search) {
        conditions.push("name LIKE ?")
        params.push('%' + search + '%')
    }
    
    // Add price range conditions
    if (minPrice) {
        conditions.push("price >= ?")
        params.push(parseFloat(minPrice))
    }
    
    if (maxPrice) {
        conditions.push("price <= ?")
        params.push(parseFloat(maxPrice))
    }
    
    // Add WHERE clause if there are any conditions
    if (conditions.length > 0) {
        sqlquery += " WHERE " + conditions.join(" AND ")
    }
    
    // Add ORDER BY clause if sort parameter is provided
    if (sort === 'name') {
        sqlquery += " ORDER BY name ASC"
    } else if (sort === 'price') {
        sqlquery += " ORDER BY price ASC"
    }

    // Execute the sql query
    db.query(sqlquery, params, (err, result) => {
        // Return results as a JSON object
        if(err) {
            res.json(err)
            next(err)
        }
        else {
            res.json(result)
        }
    })
})

// Export the router object so index.js can access it
module.exports = router
