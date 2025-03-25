# SQLite Setup Guide for Trainoor

This guide explains how to integrate SQLite into your Trainoor React application for storing user data and quiz information.

## Table of Contents
- [Installation](#installation)
- [Backend Setup](#backend-setup)
- [Database Operations](#database-operations)
- [Connecting to React Frontend](#connecting-to-react-frontend)
- [Example Implementation](#example-implementation)
- [Best Practices](#best-practices)

## Installation

First, create a Node.js backend to serve as the API layer between your React frontend and SQLite database.

```bash
# Create a backend directory in your project
mkdir backend
cd backend

# Initialize a package.json file
npm init -y

# Install required dependencies
npm install express cors better-sqlite3 body-parser
```

## Backend Setup

Create a basic Express server with SQLite integration:

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for frontend requests
app.use(bodyParser.json()); // Parse JSON request bodies

// Database setup
const dbPath = path.join(__dirname, 'database', 'trainoor.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize database tables
function initializeDatabase() {
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      answer_text TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS user_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quiz_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      answer_id INTEGER NOT NULL,
      is_correct BOOLEAN NOT NULL,
      response_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
      FOREIGN KEY (question_id) REFERENCES questions(id),
      FOREIGN KEY (answer_id) REFERENCES answers(id)
    );
  `);
  
  console.log('Database initialized successfully');
}

// Initialize database on server startup
initializeDatabase();

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// When the app is terminated, close the database connection
process.on('SIGINT', () => {
  db.close();
  console.log('Database connection closed');
  process.exit(0);
});
```

Make sure to create the database directory:

```bash
mkdir -p backend/database
```

## Database Operations

Here's how to implement basic CRUD (Create, Read, Update, Delete) operations:

### Create Routes for User Operations

```javascript
// backend/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../database'); // Assume we'll create this module

// CREATE - Register a new user
router.post('/', (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // In a real app, you would hash the password here
    // const passwordHash = hashPassword(password);
    
    const stmt = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
    const result = stmt.run(username, email, password);
    
    res.status(201).json({ 
      id: result.lastInsertRowid,
      message: 'User created successfully' 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ - Get a user by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?');
    const user = stmt.get(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// READ - Get all users
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, username, email, created_at FROM users');
    const users = stmt.all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE - Update a user
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;
    
    const stmt = db.prepare('UPDATE users SET username = ?, email = ? WHERE id = ?');
    const result = stmt.run(username, email, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found or no changes made' });
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Delete a user
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    
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

### Database Connection Module

```javascript
// backend/database.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'trainoor.db');
const db = new Database(dbPath, { verbose: console.log });

module.exports = db;
```

### Integrating Routes with the Server

Update your `server.js` to include the routes:

```javascript
// backend/server.js
// ... existing code ...

// Import routes
const usersRoutes = require('./routes/users');

// Use routes
app.use('/api/users', usersRoutes);

// ... rest of the code ...
```

## Connecting to React Frontend

To connect your React frontend to the SQLite backend:

```javascript
// src/services/api.js
const API_URL = 'http://localhost:3001/api';

// User related API calls
export const userService = {
  // Get all users
  async getUsers() {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },
  
  // Get a single user
  async getUser(id) {
    const response = await fetch(`${API_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },
  
  // Create a new user
  async createUser(userData) {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    return response.json();
  },
  
  // Update a user
  async updateUser(id, userData) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    return response.json();
  },
  
  // Delete a user
  async deleteUser(id) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    return response.json();
  },
};

// You can similarly create services for quizzes, questions, etc.
```

## Example Implementation

Here's a simple example of using the API service in a React component:

```jsx
// src/components/UsersList.jsx
import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';

function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await userService.getUsers();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.username} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UsersList;
```

## Best Practices

1. **Security Considerations**:
   - Always sanitize input to prevent SQL injection (better-sqlite3 uses parameter binding which helps with this)
   - Hash passwords before storing them (use bcrypt or similar)
   - Consider using a JWT or session-based authentication system

2. **Database Optimization**:
   - Create indexes for frequently queried columns
   - Use appropriate data types for columns
   - Implement proper foreign key constraints

3. **Error Handling**:
   - Implement consistent error handling throughout your application
   - Return appropriate HTTP status codes for different error scenarios
   - Log errors for debugging purposes

4. **Performance**:
   - Use prepared statements for repeated queries
   - Consider implementing a connection pooling mechanism for high-traffic scenarios
   - Optimize queries that retrieve large datasets (use pagination)

5. **Development Workflow**:
   - Create a separate development database
   - Consider using a migration system for database schema changes
   - Back up your database regularly

## Running Your Application

1. Start the backend server:
```bash
cd backend
node server.js
```

2. In a separate terminal, start your React application:
```bash
npm start
```

Your React application should now be able to communicate with the SQLite database through the Express API.

Happy coding! 