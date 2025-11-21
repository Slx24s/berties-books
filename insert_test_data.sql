# Insert data into the tables

USE berties_books;

INSERT INTO books (name, price)VALUES('Brighton Rock', 20.25),('Brave New World', 25.00), ('Animal Farm', 12.99) ;

# Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50),
    first VARCHAR(50),
    last VARCHAR(50),
    email VARCHAR(100),
    hashedPassword VARCHAR(255)
);

# Insert default 'gold' user with password 'smiths'
# Hash generated with bcrypt saltRounds=10 for password 'smiths'
INSERT INTO users (username, first, last, email, hashedPassword) 
VALUES ('gold', 'Gold', 'User', 'gold@example.com', '$2b$10$mDZBhe29EVDiVspuEQKYcuUqhD16kapigRuDg5gavUjNL9W.81MqW')
ON DUPLICATE KEY UPDATE username=username;