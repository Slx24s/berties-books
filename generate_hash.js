// Temporary script to generate bcrypt hash for 'smiths'
const bcrypt = require('bcrypt');
const saltRounds = 10;

bcrypt.hash('smiths', saltRounds, function(err, hash) {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Bcrypt hash for "smiths":');
        console.log(hash);
    }
    process.exit();
});
