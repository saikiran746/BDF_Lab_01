# Lab 2: SQLite Book API

A Node.js and Express REST API for managing books stored in a SQLite database. Demonstrates full CRUD operations, parameterized SQL queries, request validation, and structured error handling.

---

## Project Overview

This project implements a RESTful HTTP API with five endpoints that create, read, update, and delete book records. The data is persisted in a local SQLite file (`books.db`). On first startup, the application creates the database file, creates the `book` table, and inserts eight seed records automatically.

---

## Prerequisites

- **Node.js** v18 or later
- **npm** (bundled with Node.js)
- No global SQLite installation required — the `sqlite3` npm package includes the native bindings.

---

## Installation

Open PowerShell inside the `lab-02` directory and install the dependencies:

```powershell
npm install
```

---

## Starting the Server

```powershell
npm start
```

The server starts on port **3000** by default:

```
Server is running at http://localhost:3000
```

To use a different port, set the `PORT` environment variable before starting:

```powershell
$env:PORT = 4000
npm start
```

---

## Database Details

| Property | Value |
| --- | --- |
| Engine | SQLite 3 (via the `sqlite3` npm package) |
| File | `lab-02/books.db` (created automatically on first run) |
| Table | `book` |

### `book` table schema

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY (auto-increment) |
| `title` | TEXT | required, non-empty |
| `author` | TEXT | required, non-empty |
| `price` | INTEGER | required, >= 0 |
| `pages` | INTEGER | required, >= 1 |

### Seed data

Eight books are inserted when the table is empty at startup:

| id | title | author | price | pages |
| --- | --- | --- | --- | --- |
| 1 | The Hobbit | J.R.R. Tolkien | 12 | 310 |
| 2 | Pride and Prejudice | Jane Austen | 10 | 432 |
| 3 | 1984 | George Orwell | 14 | 328 |
| 4 | To Kill a Mockingbird | Harper Lee | 13 | 281 |
| 5 | The Great Gatsby | F. Scott Fitzgerald | 11 | 180 |
| 6 | The Alchemist | Paulo Coelho | 9 | 208 |
| 7 | Clean Code | Robert C. Martin | 35 | 464 |
| 8 | A Brief History of Time | Stephen Hawking | 20 | 256 |

---

## API Endpoints

| Method | Endpoint | Purpose | Success status |
| --- | --- | --- | --- |
| `GET` | `/books/` | Retrieve all books | `200 OK` |
| `GET` | `/books/:bookId/` | Retrieve one book by ID | `200 OK` |
| `POST` | `/books/` | Add a new book | `201 Created` |
| `PUT` | `/books/:bookId/` | Update an existing book | `200 OK` |
| `DELETE` | `/books/:bookId/` | Delete a book | `200 OK` |

### Request body for POST and PUT

All four fields are required:

```json
{
  "title": "Atomic Habits",
  "author": "James Clear",
  "price": 15,
  "pages": 320
}
```

Field rules:
- `title` — non-empty string
- `author` — non-empty string
- `price` — non-negative integer (0 or greater)
- `pages` — positive integer (1 or greater)

---

## Request and Response Examples

### GET /books/

**Request**
```
GET http://localhost:3000/books/
```

**Response — 200 OK**
```json
[
  { "id": 1, "title": "The Hobbit", "author": "J.R.R. Tolkien", "price": 12, "pages": 310 },
  { "id": 2, "title": "Pride and Prejudice", "author": "Jane Austen", "price": 10, "pages": 432 }
]
```

---

### GET /books/:bookId/

**Request**
```
GET http://localhost:3000/books/1/
```

**Response — 200 OK**
```json
{ "id": 1, "title": "The Hobbit", "author": "J.R.R. Tolkien", "price": 12, "pages": 310 }
```

---

### POST /books/

**Request**
```
POST http://localhost:3000/books/
Content-Type: application/json

{ "title": "Atomic Habits", "author": "James Clear", "price": 15, "pages": 320 }
```

**Response — 201 Created**
```json
{ "id": 9, "title": "Atomic Habits", "author": "James Clear", "price": 15, "pages": 320 }
```

---

### PUT /books/:bookId/

**Request**
```
PUT http://localhost:3000/books/9/
Content-Type: application/json

{ "title": "Atomic Habits", "author": "James Clear", "price": 16, "pages": 320 }
```

**Response — 200 OK**
```json
{ "id": 9, "title": "Atomic Habits", "author": "James Clear", "price": 16, "pages": 320 }
```

---

### DELETE /books/:bookId/

**Request**
```
DELETE http://localhost:3000/books/9/
```

**Response — 200 OK**
```json
{ "message": "Book deleted successfully" }
```

---

## Error Responses

| Scenario | Status | Response body |
| --- | --- | --- |
| Invalid `bookId` (e.g. `abc`, `-1`) | `400 Bad Request` | `{ "error": "bookId must be a positive integer" }` |
| Missing or invalid body fields | `400 Bad Request` | `{ "error": "<field> must be ..." }` |
| Malformed JSON body | `400 Bad Request` | `{ "error": "Request body contains invalid JSON" }` |
| Book not found | `404 Not Found` | `{ "error": "Book not found" }` |
| Unknown route | `404 Not Found` | `{ "error": "Route not found" }` |
| Unexpected server error | `500 Internal Server Error` | `{ "error": "Internal server error" }` |

---

## Testing with PowerShell

Start the server first (`npm start`), then open a second PowerShell window.

### GET all books
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/books/' -Method Get
```

### GET one book
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/books/1/' -Method Get
```

### POST — create a book
```powershell
$body = @{ title = 'Atomic Habits'; author = 'James Clear'; price = 15; pages = 320 } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/books/' -Method Post -ContentType 'application/json' -Body $body
```

### PUT — update a book
```powershell
$body = @{ title = 'Atomic Habits'; author = 'James Clear'; price = 16; pages = 320 } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/books/9/' -Method Put -ContentType 'application/json' -Body $body
```

### DELETE — delete a book
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/books/9/' -Method Delete
```

### Error — book not found (404)
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/books/999/' -Method Get
```

### Error — invalid ID (400)
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/books/abc/' -Method Get
```

### Error — missing fields (400)
```powershell
$bad = '{"title":""}'
Invoke-RestMethod -Uri 'http://localhost:3000/books/' -Method Post -ContentType 'application/json' -Body $bad
```

---

## Screenshots Required for Submission

Capture the following screenshots and save them in the `screenshots/` folder:

1. **`01_get_all_books.png`** — PowerShell output of `GET /books/` showing all 8 seed books.
2. **`02_get_one_book.png`** — PowerShell output of `GET /books/1/` showing The Hobbit.
3. **`03_post_create_book.png`** — PowerShell output of `POST /books/` showing the new book with its assigned `id`.
4. **`04_put_update_book.png`** — PowerShell output of `PUT /books/:id/` showing the updated `price` field.
5. **`05_delete_book.png`** — PowerShell output of `DELETE /books/:id/` showing `Book deleted successfully`.
6. **`06_error_404_not_found.png`** — Error response for `GET /books/999/` (404 Book not found).
7. **`07_error_400_invalid_id.png`** — Error response for `GET /books/abc/` (400 bookId must be a positive integer).
8. **`08_error_400_invalid_body.png`** — Error response for `POST /books/` with an invalid/empty body (400 validation error).
9. **`09_server_startup.png`** — Terminal showing `Server is running at http://localhost:3000`.
10. **`10_database_table.png`** *(optional but recommended)* — A DB browser or SQLite query showing the `book` table schema and data.
