const fs = require('fs');
const path = require('path');

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
  console.log('📁 Created backups directory:', backupsDir);
}

function backupDatabase() {
  try {
    const source = path.join(__dirname, 'data', 'database.db');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const destination = path.join(backupsDir, `database-backup-${timestamp}.db`);
    
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, destination);
      console.log(`✅ Database backed up to: ${path.basename(destination)}`);
      
      // Clean up old backups (keep last 5)
      const files = fs.readdirSync(backupsDir)
        .filter(file => file.startsWith('database-backup-') && file.endsWith('.db'))
        .sort()
        .reverse();
      
      if (files.length > 5) {
        files.slice(5).forEach(file => {
          fs.unlinkSync(path.join(backupsDir, file));
          console.log(`🗑️  Deleted old backup: ${file}`);
        });
      }
      
      return true;
    } else {
      console.log('⚠️  No database file found to backup');
      return false;
    }
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return false;
  }
}

// Run backup if called directly
if (require.main === module) {
  backupDatabase();
}

module.exports = backupDatabase;