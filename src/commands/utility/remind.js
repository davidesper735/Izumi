const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../../database/database');

function parseTiempo(str) {
  const regex = /^(\d+)(s|m|h|d)$/;
  const match = str.match(regex);
  if (!match) return null;

  const valor = parseInt(match[1]);
  const unidad = match[2];

  const multiplicadores = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return valor * multiplicadores[unidad];
}

function formatTiempo(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (d > 0) return `${d} dia${d !== 1 ? 's' : ''}`;
  if (h > 0) return `${h} hora${h !== 1 ? 's' : ''}`;
  if (m > 0) return `${m} minuto${m !== 1 ? 's' : ''}`;
  return `${s} segundo${s !== 1 ? 's' : ''}`;
}

module.exports = {
  category: 'Utilidad',
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Te recuerda algo despues de un tiempo')
    .addStringOption(opt =>
      opt.setName('tiempo')
        .setDescription('Tiempo: 10s, 5m, 2h, 1d')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('mensaje')
        .setDescription('Que quieres recordar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const context = {
      guild: interaction.guild,
      channel: interaction.channel,
      user: interaction.user,
      member: interaction.member,
      args: [
        interaction.options.getString('tiempo'),
        interaction.options.getString('mensaje')
      ],
      isSlash: true,
      reply: (content) => interaction.reply(content)
    };
    await this.run(context);
  },

  async run(context) {
    const tiempoStr = context.args[0];
    const mensaje = context.isSlash ? context.args[1] : context.args.slice(1).join(' ');

    if (!tiempoStr || !mensaje) {
      return context.reply({ content: 'Uso: `#remind <tiempo> <mensaje>` — ejemplo: `#remind 10m comprar leche`', flags: 64 });
    }

    const ms = parseTiempo(tiempoStr);
    if (!ms) {
      return context.reply({ content: 'Formato de tiempo invalido. Usa: `10s`, `5m`, `2h`, `1d`', flags: 64 });
    }

    const MAX = 30 * 24 * 60 * 60 * 1000;
    if (ms > MAX) {
      return context.reply({ content: 'El maximo es 30 dias.', flags: 64 });
    }

    const remindAt = Date.now() + ms;

    await pool.query(
      'INSERT INTO reminders (user_id, channel_id, guild_id, message, remind_at) VALUES ($1, $2, $3, $4, $5)',
      [context.user.id, context.channel.id, context.guild.id, mensaje, remindAt]
    );

    const embed = new EmbedBuilder()
      .setTitle('Recordatorio establecido')
      .setColor(0x5865F2)
      .addFields(
        { name: 'Mensaje', value: mensaje },
        { name: 'Te recordare en', value: formatTiempo(ms) },
        { name: 'Hora exacta', value: `<t:${Math.floor(remindAt / 1000)}:F>` }
      )
      .setTimestamp();

    context.reply({ embeds: [embed] });

    setTimeout(async () => {
      try {
        const result = await pool.query(
          'SELECT done FROM reminders WHERE user_id = $1 AND remind_at = $2',
          [context.user.id, remindAt]
        );
        if (result.rows[0]?.done) return;

        const embedRecordatorio = new EmbedBuilder()
          .setTitle('Recordatorio')
          .setDescription(`<@${context.user.id}>, te pediste que te recordara:\n\n**${mensaje}**`)
          .setColor(0xFEE75C)
          .setTimestamp();

        await context.channel.send({ embeds: [embedRecordatorio] });

        await pool.query(
          'UPDATE reminders SET done = 1 WHERE user_id = $1 AND remind_at = $2',
          [context.user.id, remindAt]
        );
      } catch (err) {
        console.error('Error enviando recordatorio:', err);
      }
    }, ms);
  }
};