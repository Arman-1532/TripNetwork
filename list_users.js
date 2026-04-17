const { User } = require('./models/index');

async function listTravelers() {
  try {
    const users = await User.findAll({
      where: { role: 'TRAVELER' },
      attributes: ['email', 'name', 'role'],
      limit: 5
    });
    console.log('Valid Traveler Accounts:');
    users.forEach(u => console.log(`- ${u.email} (${u.name})`));
  } catch (err) {
    console.error('Error fetching users:', err.message);
  } finally {
    process.exit();
  }
}

listTravelers();
