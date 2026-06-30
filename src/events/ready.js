const { EmbedBuilder, ActivityType } = require('discord.js');
const { pool } = require('../database/database');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`Bot conectado como ${client.user.tag}`);

    // ── Presencia ──────────────────────────────────────────────────
    client.user.setPresence({
      activities: [{ name: '/interact | @izumi.com', type: ActivityType.Playing }],
      status: 'online'
    });

    setInterval(() => {
      client.user.setPresence({
        activities: [{ name: '/interact | @izumi.com', type: ActivityType.Playing }],
        status: 'online'
      });
    }, 30 * 60 * 1000);

    // ── Recordatorios pendientes ───────────────────────────────────
    try {
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
    } catch (err) {
      console.error('Error cargando recordatorios:', err);
    }

    // ── Aviso de expiración de API key de Riot ────────────────────
    try {
      if (!process.env.RIOT_KEY_GENERATED_AT || !process.env.DEV_CHANNEL_ID || !process.env.DEV_USER_ID) {
        console.warn('[RIOT] Faltan variables de entorno para el aviso de API key (RIOT_KEY_GENERATED_AT, DEV_CHANNEL_ID, DEV_USER_ID)');
        return;
      }

      const generated = new Date(process.env.RIOT_KEY_GENERATED_AT);

      if (isNaN(generated.getTime())) {
        console.warn('[RIOT] RIOT_KEY_GENERATED_AT tiene un formato inválido. Usa ISO 8601, ej: 2026-06-29T16:00:00');
        return;
      }

      const expiresAt = new Date(generated.getTime() + 24 * 60 * 60 * 1000);
      const msUntilWarning = expiresAt.getTime() - Date.now() - 60 * 60 * 1000;

      const sendWarning = async (msg) => {
        const channel = await client.channels.fetch(process.env.DEV_CHANNEL_ID);
        if (!channel) return;
        await channel.send(msg);
      };

      if (msUntilWarning > 0) {
        console.log(`[RIOT] API key válida. Aviso en ${Math.round(msUntilWarning / 1000 / 60)} minutos.`);
        setTimeout(() => {
          sendWarning(`⚠️ <@${process.env.DEV_USER_ID}> La API key de Riot expira en ~1 hora. Renuévala en https://developer.riotgames.com`);
        }, msUntilWarning);
      } else {
        console.warn('[RIOT] La API key puede haber expirado ya.');
        sendWarning(`⚠️ <@${process.env.DEV_USER_ID}> La API key de Riot puede haber expirado. Verifícala en https://developer.riotgames.com`);
      }
    } catch (err) {
      console.error('[RIOT] Error configurando aviso de API key:', err);
    }
  }
};