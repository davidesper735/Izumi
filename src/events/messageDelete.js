const db = require('../database/database');

module.exports = {
  name: 'messageDelete',

  async execute(message) {
    if (!message.guild) return;
    if (message.author?.bot) return;
    if (!message.content?.trim()) return;

    db.prepare(`
      INSERT INTO snipes (
        guild_id,
        channel_id,
        author_id,
        content,
        deleted_at
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      message.guild.id,
      message.channel.id,
      message.author.id,
      message.content,
      Date.now()
    );
  }
};