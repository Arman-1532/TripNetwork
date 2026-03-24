const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

// Chat messages scoped to a TRAVEL package offered by an agency.
// One room per package_id.
const ChatMessage = sequelize.define('ChatMessage', {
  message_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  package_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sender_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'chat_message',
  timestamps: false
});

module.exports = ChatMessage;

