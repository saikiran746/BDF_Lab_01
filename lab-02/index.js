'use strict';

const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = Number(process.env.PORT) || 3000;
const database = new sqlite3.Database(path.join(__dirname, 'books.db'));

app.use(express.json());

const run = (sql, parameters = []) =>
	new Promise((resolve, reject) => {
		database.run(sql, parameters, function (error) {
			if (error) {
				reject(error);
				return;
			}
			resolve({ lastID: this.lastID, changes: this.changes });
		});
	});

const get = (sql, parameters = []) =>
	new Promise((resolve, reject) => {
		database.get(sql, parameters, (error, row) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(row);
		});
	});

const all = (sql, parameters = []) =>
	new Promise((resolve, reject) => {
		database.all(sql, parameters, (error, rows) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(rows);
		});
	});

const seedBooks = [
	['The Hobbit', 'J.R.R. Tolkien', 12, 310],
	['Pride and Prejudice', 'Jane Austen', 10, 432],
	['1984', 'George Orwell', 14, 328],
	['To Kill a Mockingbird', 'Harper Lee', 13, 281],
	['The Great Gatsby', 'F. Scott Fitzgerald', 11, 180],
	['The Alchemist', 'Paulo Coelho', 9, 208],
	['Clean Code', 'Robert C. Martin', 35, 464],
	['A Brief History of Time', 'Stephen Hawking', 20, 256],
];

const validateBook = (body) => {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		return { error: 'Request body must be a JSON object' };
	}

	const { title, author, price, pages } = body;

	if (typeof title !== 'string' || title.trim() === '') {
		return { error: 'title must be a non-empty string' };
	}
	if (typeof author !== 'string' || author.trim() === '') {
		return { error: 'author must be a non-empty string' };
	}
	if (!Number.isInteger(price) || price < 0) {
		return { error: 'price must be a non-negative integer' };
	}
	if (!Number.isInteger(pages) || pages <= 0) {
		return { error: 'pages must be a positive integer' };
	}

	return {
		book: {
			title: title.trim(),
			author: author.trim(),
			price,
			pages,
		},
	};
};

const parseBookId = (value) => {
	const bookId = Number(value);
	return Number.isInteger(bookId) && bookId > 0 ? bookId : null;
};

app.get('/books/', async (request, response) => {
	const books = await all('SELECT * FROM book ORDER BY id');
	response.status(200).json(books);
});

app.get('/books/:bookId/', async (request, response) => {
	const bookId = parseBookId(request.params.bookId);
	if (bookId === null) {
		response.status(400).json({ error: 'bookId must be a positive integer' });
		return;
	}

	const book = await get('SELECT * FROM book WHERE id = ?', [bookId]);
	if (!book) {
		response.status(404).json({ error: 'Book not found' });
		return;
	}

	response.status(200).json(book);
});

app.post('/books/', async (request, response) => {
	const validation = validateBook(request.body);
	if (validation.error) {
		response.status(400).json({ error: validation.error });
		return;
	}

	const { title, author, price, pages } = validation.book;
	const result = await run(
		'INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)',
		[title, author, price, pages],
	);

	response.status(201).json({ id: result.lastID, ...validation.book });
});

app.put('/books/:bookId/', async (request, response) => {
	const bookId = parseBookId(request.params.bookId);
	if (bookId === null) {
		response.status(400).json({ error: 'bookId must be a positive integer' });
		return;
	}

	const validation = validateBook(request.body);
	if (validation.error) {
		response.status(400).json({ error: validation.error });
		return;
	}

	const { title, author, price, pages } = validation.book;
	const result = await run(
		'UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?',
		[title, author, price, pages, bookId],
	);
	if (result.changes === 0) {
		response.status(404).json({ error: 'Book not found' });
		return;
	}

	response.status(200).json({ id: bookId, ...validation.book });
});

app.delete('/books/:bookId/', async (request, response) => {
	const bookId = parseBookId(request.params.bookId);
	if (bookId === null) {
		response.status(400).json({ error: 'bookId must be a positive integer' });
		return;
	}

	const result = await run('DELETE FROM book WHERE id = ?', [bookId]);
	if (result.changes === 0) {
		response.status(404).json({ error: 'Book not found' });
		return;
	}

	response.status(200).json({ message: 'Book deleted successfully' });
});

app.use((request, response) => {
	response.status(404).json({ error: 'Route not found' });
});

app.use((error, request, response, next) => {
	if (error.type === 'entity.parse.failed') {
		response.status(400).json({ error: 'Request body contains invalid JSON' });
		return;
	}

	console.error(error);
	response.status(500).json({ error: 'Internal server error' });
});

const initializeDBAndServer = async () => {
	try {
		await run(`
			CREATE TABLE IF NOT EXISTS book (
				id INTEGER PRIMARY KEY,
				title TEXT,
				author TEXT,
				price INTEGER,
				pages INTEGER
			)
		`);

		const result = await get('SELECT COUNT(*) AS count FROM book');
		if (result.count === 0) {
			const placeholders = seedBooks.map(() => '(?, ?, ?, ?)').join(', ');
			await run(
				`INSERT INTO book (title, author, price, pages) VALUES ${placeholders}`,
				seedBooks.flat(),
			);
		}

		return app.listen(port, () => {
			console.log(`Server is running at http://localhost:${port}`);
		});
	} catch (error) {
		console.error('Failed to initialize the database or start the server:', error);
		database.close(() => {
			process.exitCode = 1;
		});
		return undefined;
	}
};

if (require.main === module) {
	initializeDBAndServer();
}

module.exports = { app, initializeDBAndServer };
