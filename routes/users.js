// Create a new router
const express = require("express")
const bcrypt = require('bcrypt')
const router = express.Router()
const saltRounds = 10

router.get('/register', function (req, res, next) {
    res.render('register.ejs')
})

router.post('/registered', function (req, res, next) {
    // saving data in database
    const plainPassword = req.body.password
    const { username, first, last, email } = req.body

    bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
        if (err) {
            return next(err)
        }

        const createTableSql = `CREATE TABLE IF NOT EXISTS users (
            username VARCHAR(50),
            first VARCHAR(50),
            last VARCHAR(50),
            email VARCHAR(100),
            hashedPassword VARCHAR(255)
        )`

        db.query(createTableSql, (err) => {
            if (err) {
                return next(err)
            }

            const insertSql = "INSERT INTO users (username, first, last, email, hashedPassword) VALUES (?,?,?,?,?)"
            const newrecord = [username, first, last, email, hashedPassword]
            db.query(insertSql, newrecord, (err, result) => {
                if (err) {
                    return next(err)
                }
                let message = ' Hello ' + req.body.first + ' ' + req.body.last + ' you are now registered!  We will send an email to you at ' + req.body.email
                message += ' Your password is: ' + req.body.password + ' and your hashed password is: ' + hashedPassword
                res.send(message)
            })
        })
    })
}); 

router.get('/list', function (req, res, next) {
    const sql = 'SELECT username, first, last, email FROM users'
    db.query(sql, (err, result) => {
        if (err) {
            return next(err)
        }
        res.render('userslist.ejs', { users: result })
    })
})

router.get('/login', function (req, res, next) {
    res.render('login.ejs')
})

router.post('/loggedin', function (req, res, next) {
    const { username, password } = req.body
    const sql = 'SELECT hashedPassword FROM users WHERE username = ? LIMIT 1'
    db.query(sql, [username], (err, rows) => {
        if (err) {
            return next(err)
        }
        if (!rows || rows.length === 0) {
            const insertAudit = "INSERT INTO audit_log (username, status, details) VALUES (?,?,?)"
            ensureAuditTable(() => db.query(insertAudit, [username, 'FAIL', 'user not found'], () => {}))
            return res.send('Login failed: user not found')
        }
        const hashedPassword = rows[0].hashedPassword
        bcrypt.compare(password, hashedPassword, function (err, result) {
            if (err) {
                return next(err)
            }
            if (result === true) {
                const insertAudit = "INSERT INTO audit_log (username, status, details) VALUES (?,?,?)"
                ensureAuditTable(() => db.query(insertAudit, [username, 'SUCCESS', 'password matched'], () => {}))
                res.send('Login successful for user: ' + username)
            } else {
                const insertAudit = "INSERT INTO audit_log (username, status, details) VALUES (?,?,?)"
                ensureAuditTable(() => db.query(insertAudit, [username, 'FAIL', 'incorrect password'], () => {}))
                res.send('Login failed: incorrect password')
            }
        })
    })
})

// Ensure audit_log table exists
function ensureAuditTable(callback) {
    const createAudit = `CREATE TABLE IF NOT EXISTS audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50),
        status VARCHAR(20),
        details VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    db.query(createAudit, (err) => {
        if (err) {
            // do not block login flow; just log error
            console.error('Audit table error:', err)
        }
        if (typeof callback === 'function') callback()
    })
}

// Show audit history
router.get('/audit', function (req, res, next) {
    ensureAuditTable(() => {
        db.query('SELECT username, status, details, created_at FROM audit_log ORDER BY created_at DESC', (err, rows) => {
            if (err) {
                return next(err)
            }
            res.render('audit.ejs', { logs: rows })
        })
    })
})

// Export the router object so index.js can access it
module.exports = router
