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
DB_DATABASE=berties_books
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

## Input Validation

Server-side input validation has been implemented using `express-validator` to ensure data integrity and security.

### User Registration (`/users/registered`):

**Validations Applied:**
- **Email**: Must be a valid email format (e.g., `user@example.com`)
- **Username**: Must be 5-20 characters long
- **Password**: Must be at least 8 characters long
- **First Name**: Required field, trimmed and sanitized (XSS protection)
- **Last Name**: Required field, trimmed and sanitized (XSS protection)

**Reasoning**: Registration requires strict validation to ensure:
- Valid contact information (email)
- Secure passwords (minimum 8 characters)
- Proper username length for database constraints
- Protection against XSS attacks through sanitization

### User Login (`/users/loggedin`):

**Validations Applied:**
- **Username**: Cannot be empty
- **Password**: Cannot be empty

**Reasoning**: Basic validation to prevent empty submissions and ensure both credentials are provided before database lookup.

### Book Addition (`/books/bookadded`):

**Validations Applied:**
- **Book Name**: Required field, trimmed and sanitized
- **Price**: Must be a positive decimal number (minimum 0.01)

**Reasoning**: Ensures:
- Books have valid names
- Prices are realistic positive values
- Protection against XSS attacks in book names

### Book Search (`/books/search-result`):

**Validations Applied:**
- **Keyword**: Cannot be empty, trimmed and sanitized

**Reasoning**: Prevents empty searches and protects against XSS attacks in search terms.

### Routes Without Validation:

**Routes with NO validation:**
- `/books/list` - No user input, just displays data
- `/users/list` - No user input, just displays data
- `/users/audit` - No user input, just displays data
- `/books/bargainbooks` - No user input, hardcoded query
- `/logout` - No user input, just destroys session
- All GET routes for rendering forms (register, login, search, addbook)

**Reasoning**: These routes either:
1. Display data without accepting user input
2. Are simple GET requests that render forms
3. Perform actions without user-submitted data

Validation is only necessary where user input is processed and stored/queried in the database.

### Security Features:

1. **XSS Protection**: `trim()` and `escape()` sanitize inputs to prevent cross-site scripting
2. **Type Validation**: `isEmail()`, `isFloat()`, `isLength()` ensure correct data types
3. **Required Fields**: `notEmpty()` prevents null/empty submissions
4. **Error Handling**: Invalid inputs redirect back to the form for correction

## Input Sanitization (XSS Protection)

Server-side input sanitization has been implemented using `express-sanitizer` to protect against Cross-Site Scripting (XSS) attacks.

### How express-sanitizer Works:

The `req.sanitize()` function removes potentially dangerous HTML tags and JavaScript code from user input. It:
- Strips `<script>` tags and their contents
- Removes event handlers like `onclick`, `onerror`, etc.
- Eliminates dangerous HTML elements like `<iframe>`, `<object>`, etc.
- Preserves safe text content while removing malicious code

### User Registration (`/users/registered`):

**Fields Sanitized:**
- **Username**: `req.sanitize(req.body.username)` - Prevents XSS in usernames
- **First Name**: `req.sanitize(req.body.first)` - Removes malicious scripts from names
- **Last Name**: `req.sanitize(req.body.last)` - Removes malicious scripts from names

**Fields NOT Sanitized:**
- **Email**: NOT sanitized - Email validation already ensures proper format; sanitization could break valid email addresses
- **Password**: NOT sanitized - Passwords are hashed with bcrypt, so any characters (including special ones) are safe; sanitization would alter the user's intended password

**Reasoning**: 
- Names and usernames are displayed on pages, so they need XSS protection
- Email is validated for format and not displayed as HTML
- Passwords are never displayed and are hashed, making sanitization unnecessary and potentially harmful

### User Login (`/users/loggedin`):

**No sanitization applied** - Login credentials are validated but not sanitized because:
- Username is used for database lookup only
- Password is compared with hashed value only
- Neither is displayed or rendered in HTML

### Book Addition (`/books/bookadded`):

**Fields Sanitized:**
- **Book Name**: `req.sanitize(req.body.name)` - Book names are displayed on multiple pages, need XSS protection

**Fields NOT Sanitized:**
- **Price**: NOT sanitized - Validated as a float number; numeric values don't pose XSS risks

**Reasoning**: Text fields displayed to users need sanitization; numeric fields validated by type don't.

### Book Search (`/books/search-result`):

**Fields Sanitized:**
- **Search Keyword**: `req.sanitize(req.query.keyword)` - Search terms are displayed on results page, need XSS protection

**Reasoning**: Search keywords are echoed back to the user on the results page, making them a potential XSS vector.

### Summary of Sanitization Strategy:

**Sanitize when:**
1. User input will be displayed/rendered in HTML pages
2. Input contains free-form text (names, descriptions, search terms)
3. Data could potentially contain HTML or JavaScript

**Do NOT sanitize when:**
1. Input is validated as a specific type (email, number, date)
2. Input is hashed or encrypted (passwords)
3. Input is only used for database lookups and never displayed
4. Sanitization would break the intended functionality

### Testing XSS Protection:

Try registering with malicious input:
- **First Name**: `<script>alert('XSS')</script>` → Should be sanitized to safe text
- **Username**: `<img src=x onerror=alert('XSS')>` → Should be sanitized
- **Book Name**: `<iframe src="evil.com"></iframe>` → Should be sanitized

After sanitization, these inputs will be stored as plain text without the dangerous HTML/JavaScript, protecting your application from XSS attacks.

## Books API Documentation

Berties Books provides a RESTful API endpoint to retrieve book information in JSON format. This allows other developers to programmatically access the book catalog.

### Base Endpoint

```
GET /api/books
```

Returns all books in the database as a JSON array.

**Example Request:**
```
http://localhost:8000/api/books
```

**Example Response:**
```json
[
  {
    "id": 1,
    "name": "Database Systems",
    "price": 45.99
  },
  {
    "id": 2,
    "name": "Web Development",
    "price": 32.50
  }
]
```

### Query Parameters

The API supports the following optional query parameters to filter and sort results:

#### 1. Search by Book Name

Filter books by name using a search term (case-insensitive, partial match).

**Parameter:** `search`

**Example:**
```
http://localhost:8000/api/books?search=world
```

Returns all books containing "world" in their name.

#### 2. Filter by Price Range

Filter books within a specific price range.

**Parameters:**
- `minprice` - Minimum price (inclusive)
- `maxprice` - Maximum price (inclusive)

**Examples:**
```
http://localhost:8000/api/books?minprice=5&maxprice=10
```
Returns books priced between £5 and £10.

```
http://localhost:8000/api/books?minprice=20
```
Returns books priced £20 or more.

```
http://localhost:8000/api/books?maxprice=15
```
Returns books priced £15 or less.

#### 3. Sort Results

Sort the results by name or price in ascending order.

**Parameter:** `sort`

**Valid Values:**
- `name` - Sort alphabetically by book name
- `price` - Sort numerically by price (lowest to highest)

**Examples:**
```
http://localhost:8000/api/books?sort=name
```
Returns all books sorted alphabetically.

```
http://localhost:8000/api/books?sort=price
```
Returns all books sorted by price (cheapest first).

### Combining Parameters

Multiple query parameters can be combined to create complex queries.

**Examples:**

Search for books containing "web" priced under £50, sorted by price:
```
http://localhost:8000/api/books?search=web&maxprice=50&sort=price
```

Find books priced between £10-£30, sorted alphabetically:
```
http://localhost:8000/api/books?minprice=10&maxprice=30&sort=name
```

### Error Handling

If a database error occurs, the API will return the error as a JSON object:

```json
{
  "code": "ER_...",
  "errno": 1234,
  "message": "Error description"
}
```

### Response Format

All successful responses return a JSON array of book objects. Each book object contains:
- `id` (integer) - Unique book identifier
- `name` (string) - Book title
- `price` (decimal) - Book price in pounds

If no books match the query criteria, an empty array `[]` is returned.