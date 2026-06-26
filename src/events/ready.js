const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`Bot conectado como ${client.user.tag}`);

    const db = require('../database/database');
    const ahora = Date.now();
    const pendientes = db.prepare('SELECT * FROM reminders WHERE done = 0').all();

    for (const reminder of pendientes) {
      const restante = reminder.remind_at - ahora;

      if (restante <= 0) {
        db.prepare('UPDATE reminders SET done = 1 WHERE id = ?').run(reminder.id);
        continue;
      }

      setTimeout(async () => {
        try {
          const channel = await client.channels.fetch(reminder.channel_id);
          if (!channel) return;

          const embed = new EmbedBuilder()
            .setTitle('Recordatorio')
            .setDescription(`<@${reminder.user_id}>, te pediste que te recordara:\n\n**${reminder.message}**`)
            .setColor(0xFEE75C)
            .setTimestamp();

          await channel.send({ embeds: [embed] });
          db.prepare('UPDATE reminders SET done = 1 WHERE id = ?').run(reminder.id);
        } catch (err) {
          console.error('Error enviando recordatorio pendiente:', err);
        }
      }, restante);
    }
  }
};