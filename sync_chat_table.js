const { ChatMessage, sequelize } = require('./models/index');

async function syncChatTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // Sync only the ChatMessage model
    await ChatMessage.sync({ alter: true });
    console.log('✅ Table "chat_message" has been created/updated successfully.');

  } catch (err) {
    console.error('❌ Error syncing chat_message table:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

syncChatTable();
