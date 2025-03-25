# SQLite Quick Start Guide for Trainoor

This is a condensed guide to get you up and running with SQLite in your Trainoor project as quickly as possible.

## 1. Setup

```bash
# Create backend directory
mkdir -p backend/database

# Initialize backend package.json
cd backend
npm init -y

# Install dependencies
npm install express cors better-sqlite3 body-parser
```

## 2. Minimal Backend Structure

Create these files:

- `backend/database.js`
- `backend/server.js`
- `backend/routes/users.js`

## 3. Minimal Implementation

### Database Connection

```javascript
// backend/database.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'trainoor.db');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
```

### Express Server

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Import routes
const usersRoutes = require('./routes/users');

// Use routes
app.use('/api/users', usersRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Basic Routes

```javascript
// backend/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all users
router.get('/', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, email, created_at FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user
router.post('/', (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, password);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user
router.put('/:id', (req, res) => {
  try {
    const { username, email } = req.body;
    const result = db.prepare('UPDATE users SET username = ?, email = ? WHERE id = ?').run(username, email, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

## 4. Frontend Integration

```javascript
// src/services/api.js
const API_URL = 'http://localhost:3001/api';

export const userService = {
  // Get all users
  getUsers: async () => {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },
  
  // Get user by ID
  getUser: async (id) => {
    const response = await fetch(`${API_URL}/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },
  
  // Create new user
  createUser: async (userData) => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },
  
  // Update user
  updateUser: async (id, userData) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },
  
  // Delete user
  deleteUser: async (id) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  },
};
```

## 5. Run Your Application

In separate terminals:

```bash
# Terminal 1 - Start backend
cd backend
node server.js

# Terminal 2 - Start frontend (in project root)
npm start
```

## 6. Common Database Operations

### Create Data

```javascript
// Insert a new quiz
const insertQuiz = db.prepare(`
  INSERT INTO quizzes (title, description, created_by) 
  VALUES (?, ?, ?)
`);

const quizId = insertQuiz.run('JavaScript Basics', 'Learn JS fundamentals', 1).lastInsertRowid;
```

### Read Data

```javascript
// Get quiz by ID
const getQuiz = db.prepare('SELECT * FROM quizzes WHERE id = ?');
const quiz = getQuiz.get(quizId);

// Get all quizzes with author info
const getAllQuizzes = db.prepare(`
  SELECT q.*, u.username as author_name
  FROM quizzes q
  JOIN users u ON q.created_by = u.id
  ORDER BY q.created_at DESC
`);
const quizzes = getAllQuizzes.all();
```

### Update Data

```javascript
// Update quiz title
const updateQuiz = db.prepare('UPDATE quizzes SET title = ? WHERE id = ?');
updateQuiz.run('Updated JavaScript Basics', quizId);
```

### Delete Data

```javascript
// Delete quiz and related data
db.transaction(() => {
  // Delete in correct order due to foreign key constraints
  db.prepare('DELETE FROM user_responses WHERE quiz_id = ?').run(quizId);
  
  // Get all questions for this quiz
  const questions = db.prepare('SELECT id FROM questions WHERE quiz_id = ?').all(quizId);
  
  // Delete answers for each question
  questions.forEach(q => {
    db.prepare('DELETE FROM answers WHERE question_id = ?').run(q.id);
  });
  
  // Delete questions
  db.prepare('DELETE FROM questions WHERE quiz_id = ?').run(quizId);
  
  // Finally delete the quiz
  db.prepare('DELETE FROM quizzes WHERE id = ?').run(quizId);
})();
```

## 7. Tips and Best Practices

- **Security**: Always use parameterized queries to prevent SQL injection
- **Transactions**: Use transactions when making multiple related changes
- **Prepared Statements**: Reuse prepared statements for better performance
- **Error Handling**: Implement consistent error handling in all routes
- **Backup**: Regularly backup your SQLite database file

For a more comprehensive guide, see the detailed documentation in the SQLITE_GUIDE.md and DATABASE_EXAMPLES.md files. 