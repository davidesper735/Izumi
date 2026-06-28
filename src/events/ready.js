const { EmbedBuilder, ActivityType } = require('discord.js');
const { pool } = require('../database/database');


module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`Bot conectado como ${client.user.tag}`);

    client.user.setPresence({
  activities: [{ name: '/interact | @izumi.com', type: ActivityType.Listening }],
  status: 'online'
});

    const { rows: pendientes } = await pool.query('SELECT * FROM reminders WHERE done = 0');
    const ahora = Date.now();

    for (const reminder of pendientes) {
      const restante = Number(reminder.remind_at) - ahora;

      if (restante <= 0) {
        await pool.query('UPDATE reminders SET done = 1 WHERE id = $1', [reminder.id]);
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
          await pool.query('UPDATE reminders SET done = 1 WHERE id = $1', [reminder.id]);
        } catch (err) {
          console.error('Error enviando recordatorio pendiente:', err);
        }
      }, restante);
    }
  }
};