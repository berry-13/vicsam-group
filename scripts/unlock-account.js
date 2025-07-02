const { db } = require('../database/database');

async function unlockAccount() {
  try {
    const email = process.argv[2] || 'admin@vicsam.com';
    
    console.log(`Unlocking account: ${email}`);
    
    await db.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = ?',
      [email]
    );
    
    console.log('✅ Account unlocked successfully');
    
    const user = await db.query(
      'SELECT email, failed_login_attempts, locked_until FROM users WHERE email = ?', 
      [email]
    );
    
    if (user.rows.length > 0) {
      console.log('Current status:', user.rows[0]);
    } else {
      console.log('❌ User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error unlocking account:', error.message);
    process.exit(1);
  }
}

unlockAccount();
