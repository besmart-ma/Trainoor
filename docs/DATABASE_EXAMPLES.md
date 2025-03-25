# SQLite Database Examples for Trainoor

This document provides additional examples and patterns for working with SQLite in your Trainoor project.

## Table of Contents

- [Common Query Patterns](#common-query-patterns)
- [Transaction Examples](#transaction-examples)
- [Quiz Operations](#quiz-operations)
- [Performance Tips](#performance-tips)
- [Debugging and Testing](#debugging-and-testing)

## Common Query Patterns

### User Management

```javascript
// Find user by email (for login)
const findUserByEmail = db.prepare(`
  SELECT id, username, email, password_hash 
  FROM users 
  WHERE email = ?
`);

// Usage
const user = findUserByEmail.get('user@example.com');
```

### Quiz Management

```javascript
// Get a quiz with all its questions and answers
const getFullQuiz = db.prepare(`
  SELECT 
    q.id as quiz_id, 
    q.title as quiz_title, 
    q.description as quiz_description,
    qn.id as question_id, 
    qn.question_text,
    qn.question_type,
    a.id as answer_id,
    a.answer_text,
    a.is_correct
  FROM quizzes q
  JOIN questions qn ON q.id = qn.quiz_id
  JOIN answers a ON qn.id = a.question_id
  WHERE q.id = ?
  ORDER BY qn.id, a.id
`);

// Usage (this returns all rows, you'll need to structure the data in your application)
const quizData = getFullQuiz.all(1); // Get quiz with ID 1
```

### User Progress

```javascript
// Get quiz completion statistics for a user
const getUserQuizStats = db.prepare(`
  SELECT 
    q.id as quiz_id,
    q.title as quiz_title,
    COUNT(DISTINCT qn.id) as total_questions,
    COUNT(DISTINCT ur.question_id) as attempted_questions,
    SUM(CASE WHEN ur.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
  FROM quizzes q
  JOIN questions qn ON q.id = qn.quiz_id
  LEFT JOIN user_responses ur ON q.id = ur.quiz_id AND qn.id = ur.question_id AND ur.user_id = ?
  GROUP BY q.id
  ORDER BY q.id
`);

// Usage
const userStats = getUserQuizStats.all(userId);
```

## Transaction Examples

Transactions ensure data integrity when performing multiple related operations:

```javascript
// Creating a new quiz with questions and answers
function createFullQuiz(quizData, authorId) {
  // Start a transaction
  const transaction = db.transaction((quizObject) => {
    // Insert the quiz
    const insertQuiz = db.prepare(`
      INSERT INTO quizzes (title, description, created_by)
      VALUES (?, ?, ?)
    `);
    
    const quizResult = insertQuiz.run(
      quizObject.title, 
      quizObject.description, 
      quizObject.authorId
    );
    
    const quizId = quizResult.lastInsertRowid;
    
    // Insert questions
    const insertQuestion = db.prepare(`
      INSERT INTO questions (quiz_id, question_text, question_type)
      VALUES (?, ?, ?)
    `);
    
    // Insert answers
    const insertAnswer = db.prepare(`
      INSERT INTO answers (question_id, answer_text, is_correct)
      VALUES (?, ?, ?)
    `);
    
    // For each question in the quiz
    quizObject.questions.forEach(question => {
      const questionResult = insertQuestion.run(
        quizId,
        question.text,
        question.type
      );
      
      const questionId = questionResult.lastInsertRowid;
      
      // For each answer to this question
      question.answers.forEach(answer => {
        insertAnswer.run(
          questionId,
          answer.text,
          answer.isCorrect ? 1 : 0
        );
      });
    });
    
    return quizId;
  });
  
  // Execute the transaction
  return transaction({
    title: quizData.title,
    description: quizData.description,
    authorId: authorId,
    questions: quizData.questions
  });
}

// Usage example:
const newQuizId = createFullQuiz({
  title: 'JavaScript Basics',
  description: 'Test your knowledge of JavaScript fundamentals',
  questions: [
    {
      text: 'What is JavaScript?',
      type: 'multiple_choice',
      answers: [
        { text: 'A programming language', isCorrect: true },
        { text: 'A type of coffee', isCorrect: false },
        { text: 'A text editor', isCorrect: false }
      ]
    },
    // More questions...
  ]
}, 1); // Author ID = 1
```

## Quiz Operations

### Recording User Responses

```javascript
// Record a user's answer to a question
const recordUserResponse = db.prepare(`
  INSERT INTO user_responses (user_id, quiz_id, question_id, answer_id, is_correct)
  VALUES (?, ?, ?, ?, ?)
`);

// Usage:
function saveUserAnswer(userId, quizId, questionId, answerId) {
  // First, check if the answer is correct
  const checkCorrectAnswer = db.prepare(`
    SELECT is_correct FROM answers WHERE id = ?
  `);
  
  const answer = checkCorrectAnswer.get(answerId);
  const isCorrect = answer ? answer.is_correct : 0;
  
  // Save the response
  return recordUserResponse.run(
    userId,
    quizId,
    questionId,
    answerId,
    isCorrect
  );
}
```

### Calculating Quiz Results

```javascript
// Get results for a specific quiz attempt
const getQuizResults = db.prepare(`
  SELECT 
    COUNT(*) as total_questions,
    SUM(CASE WHEN ur.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
    (SUM(CASE WHEN ur.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as percentage
  FROM user_responses ur
  WHERE ur.user_id = ? AND ur.quiz_id = ?
  GROUP BY ur.user_id, ur.quiz_id
`);

// Usage
function getUserQuizScore(userId, quizId) {
  return getQuizResults.get(userId, quizId);
}
```

## Performance Tips

### Using Indexes

Create indexes for frequently queried columns to improve performance:

```javascript
// Adding indexes to frequently queried columns
db.exec(`
  -- Index for user lookups by email
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  
  -- Index for getting questions by quiz
  CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
  
  -- Index for getting answers by question
  CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
  
  -- Composite index for user responses
  CREATE INDEX IF NOT EXISTS idx_user_responses_user_quiz ON user_responses(user_id, quiz_id);
`);
```

### Query Optimization

```javascript
// Instead of joining multiple tables for complex data, use multiple simpler queries:
function getStructuredQuiz(quizId) {
  // Get quiz details
  const quizStmt = db.prepare('SELECT * FROM quizzes WHERE id = ?');
  const quiz = quizStmt.get(quizId);
  
  if (!quiz) return null;
  
  // Get all questions for this quiz
  const questionsStmt = db.prepare('SELECT * FROM questions WHERE quiz_id = ?');
  const questions = questionsStmt.all(quizId);
  
  // For each question, get its answers
  const answersStmt = db.prepare('SELECT * FROM answers WHERE question_id = ?');
  
  // Build the complete quiz object
  const result = {
    ...quiz,
    questions: questions.map(question => ({
      ...question,
      answers: answersStmt.all(question.id)
    }))
  };
  
  return result;
}
```

## Debugging and Testing

### Logging SQL Statements

For debugging, you can log all SQL statements:

```javascript
// Enable SQL statement logging
const db = new Database(dbPath, { 
  verbose: console.log // This logs all SQL statements
});
```

### Creating Test Data

```javascript
// backend/scripts/seed-database.js
const db = require('../database');

function seedDatabase() {
  // Clear existing data
  db.exec(`
    DELETE FROM user_responses;
    DELETE FROM answers;
    DELETE FROM questions;
    DELETE FROM quizzes;
    DELETE FROM users;
  `);
  
  // Insert test users
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash)
    VALUES (?, ?, ?)
  `);
  
  const users = [
    { username: 'testuser1', email: 'test1@example.com', password: 'password123' },
    { username: 'testuser2', email: 'test2@example.com', password: 'password123' }
  ];
  
  users.forEach(user => {
    insertUser.run(user.username, user.email, user.password);
  });
  
  // Insert test quizzes, questions, and answers
  // ... more seeding code ...
  
  console.log('Database seeded successfully');
}

// Run the seeding
seedDatabase();
```

To run the seeding script:

```bash
node backend/scripts/seed-database.js
```

### Backup and Restore

```javascript
// Backup the database
function backupDatabase() {
  const fs = require('fs');
  const path = require('path');
  const dbPath = path.join(__dirname, 'database', 'trainoor.db');
  const backupPath = path.join(__dirname, 'database', `trainoor_backup_${Date.now()}.db`);
  
  fs.copyFileSync(dbPath, backupPath);
  console.log(`Database backed up to ${backupPath}`);
}

// You could run this on a schedule or before major operations
```

## Additional Resources

- [Better-SQLite3 Documentation](https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [SQL Tutorial](https://www.w3schools.com/sql/) 