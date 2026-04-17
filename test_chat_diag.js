const { ChatMessage, Package, sequelize } = require('./models/index');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Check if table exists
    const [results] = await sequelize.query("SHOW TABLES LIKE 'chat_message'");
    if (results.length === 0) {
      console.error('Table chat_message does NOT exist!');
      return;
    }
    console.log('Table chat_message exists.');

    // Try a simple find
    const count = await ChatMessage.count();
    console.log('Total messages:', count);

    // Try finding by package_id
    const pkg = await Package.findOne();
    if (pkg) {
      console.log('Testing history for package:', pkg.package_id);
      const rows = await ChatMessage.findAll({
        where: { package_id: pkg.package_id },
        order: [['created_at', 'DESC']],
        limit: 10
      });
      console.log('Found rows:', rows.length);
    } else {
      console.log('No packages found to test with.');
    }

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await sequelize.close();
  }
}

test();
