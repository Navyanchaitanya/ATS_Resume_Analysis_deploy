const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Fixing database schema...');

// Add all missing columns
const columnsToAdd = [
  'createdAt DATETIME',
  'updatedAt DATETIME',
  'is_verified BOOLEAN DEFAULT 0',
  'verification_token TEXT',
  'reset_token TEXT',
  'reset_token_expiry DATETIME',
  'security_question TEXT',
  'security_answer TEXT'
];

columnsToAdd.forEach(column => {
  const columnName = column.split(' ')[0];
  db.run(`ALTER TABLE users ADD COLUMN ${column}`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error(`Error adding ${columnName} to users:`, err.message);
    } else {
      console.log(`✅ Added ${columnName} to users table`);
    }
  });
});

// Add timestamp columns to resume_analyses table
db.run(`ALTER TABLE resume_analyses ADD COLUMN createdAt DATETIME`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding createdAt to resume_analyses:', err.message);
  } else {
    console.log('✅ Added createdAt to resume_analyses table');
  }
});

db.run(`ALTER TABLE resume_analyses ADD COLUMN updatedAt DATETIME`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding updatedAt to resume_analyses:', err.message);
  } else {
    console.log('✅ Added updatedAt to resume_analyses table');
  }
});

// Close database after 3 seconds
setTimeout(() => {
  db.close();
  console.log('✅ Database fix completed!');
  console.log('🚀 Restart your server now.');
}, 3000);