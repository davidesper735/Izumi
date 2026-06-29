const { pool } = require('../database/database');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (message.author?.bot) return;
    if (!message.content) return;
    if (!message.guild) return;

    await pool.query(
      'INSERT INTO snipes (guild_id, channel_id, author_id, content, deleted_at) VALUES ($1, $2, $3, $4, $5)',
      [message.guild.id, message.channel.id, message.author.id, message.content, Date.now()]
    );
  }
};