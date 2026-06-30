const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../../database/database');

module.exports = {
  category: 'Utilidad',
  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Muestra el ultimo mensaje eliminado en el canal'),

  async execute(interaction) {
    const context = {
      guild: interaction.guild,
      channel: interaction.channel,
      user: interaction.user,
      member: interaction.member,
      args: [],
      isSlash: true,
      reply: (content) => interaction.reply(content)
    };
    await this.run(context);
  },

  async run(context) {
    const result = await pool.query(
      'SELECT * FROM snipes WHERE channel_id = $1 ORDER BY deleted_at DESC LIMIT 1',
      [context.channel.id]
    );

    const row = result.rows[0];

    if (!row) {
      return context.reply({ content: 'No hay ningun mensaje eliminado reciente en este canal.', flags: 64 });
    }

    const autor = await context.channel.client.users.fetch(row.author_id).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle('Ultimo mensaje eliminado')
      .setDescription(row.content)
      .setColor(0x5865F2)
      .setAuthor(autor ? { name: autor.username, iconURL: autor.displayAvatarURL({ dynamic: true }) } : { name: 'Usuario desconocido' })
      .setTimestamp(Number(row.deleted_at));

    context.reply({ embeds: [embed] });
  }
};