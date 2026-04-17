const { User } = require('./models/index');
// Use bcryptjs (pure JS) to avoid native binary load errors on macOS
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    const email = 'traveler_verify_test@example.com';
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const [updated] = await User.update(
      { password_hash: hashedPassword, status: 'ACTIVE' },
      { where: { email } }
    );
    
    if (updated) {
      console.log(`Password reset successfully for ${email}`);
    } else {
      console.log(`User ${email} not found`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

resetPassword();
