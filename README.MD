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