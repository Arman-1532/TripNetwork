const { User } = require('./models/index');

async function checkUserStatus() {
  try {
    const users = await User.findAll({
      where: { email: ['mahmudultanvir680@gmail.com', 'traveler_verify_test@example.com'] },
      attributes: ['email', 'role', 'status']
    });
    console.log('User Status Check:');
    users.forEach(u => console.log(`- ${u.email}: Role=${u.role}, Status=${u.status}`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

checkUserStatus();
