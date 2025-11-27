# Berties Books

Berties Books is a simple Node.js web application for the Dynamic Web Applications module.
It demonstrates:

- Express routing
- EJS templating
- MySQL database access using `mysql2`

## Requirements

- Node.js
- MySQL server (local or on your network)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

Create the database and tables by running 
create_db.sql
 in your MySQL client:
SOURCE path/to/create_db.sql;


use 
node index.js

to run the app

## dotenv

Sensitive database credentials are loaded from environment variables using the `dotenv` module. The app reads the following variables from a local `.env` file (not committed to Git):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=berties_books_app
DB_PASSWORD=qwertyuiop
DB_NAME=berties_books
```

Changes made:

- Added `require('dotenv').config()` in `index.js`.
- Switched the MySQL pool to use `process.env.DB_*` with sensible defaults.
- Added `.env` to `.gitignore` so secrets are not committed.

How to use:

1. Copy `.env` to your environment (Windows and the VM) and adjust values as needed.
2. Run `npm install` to ensure `dotenv` is installed.
3. Start the app normally with `node index.js`.

## audit

Login attempts (both successful and failed) are recorded in an `audit_log` table.

Implementation details:

- New helper `ensureAuditTable()` creates the table if it does not exist.
- The `POST /users/loggedin` route inserts a row on:
  - User not found (FAIL)
  - Incorrect password (FAIL)
  - Successful login (SUCCESS)
- New route `GET /users/audit` renders `views/audit.ejs` to show the audit history.

Schema (created automatically):

```
audit_log(
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50),
  status VARCHAR(20),
  details VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

How to view:

1. Attempt logins via `/users/login`.
2. Visit `/users/audit` to see the audit list.

## Access Control & Authentication

Session-based authentication has been implemented using `express-session`. Users must log in to access certain protected routes.

### Protected Routes (Require Login):

- **`/books/list`** - View all books in the shop
- **`/users/list`** - View all registered users
- **`/logout`** - Logout (must be logged in to logout)

### Public Routes (No Login Required):

- **`/`** - Home page
- **`/about`** - About page
- **`/users/register`** - User registration
- **`/users/login`** - Login page
- **`/books/search`** - Search for books
- **`/books/addbook`** - Add a new book

### How It Works:

1. **Session Creation**: When a user successfully logs in via `/users/loggedin`, their username is saved in `req.session.userId`.

2. **Middleware Protection**: The `redirectLogin` middleware checks if `req.session.userId` exists:
   - If **not set**: Redirects to the login page
   - If **set**: Allows access to the protected route

3. **Session Expiration**: Sessions expire after 10 minutes (600,000ms) or when the browser is closed.

4. **Logout**: The `/logout` route destroys the session, requiring the user to log in again.

### Testing:

1. Try accessing `/books/list` without logging in → Should redirect to login
2. Log in with valid credentials
3. Access `/books/list` again → Should now display the book list
4. Click logout → Session destroyed
5. Try accessing `/books/list` again → Should redirect to login