const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const db = require('../../database/database');

module.exports = {
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
    const data = db.prepare(`
      SELECT *
      FROM snipes
      WHERE channel_id = ?
      ORDER BY deleted_at DESC
      LIMIT 1
    `).get(context.channel.id);

    if (!data) {
      return context.reply({
        content: 'No hay ningun mensaje eliminado reciente en este canal.',
        flags: 64
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('Ultimo mensaje eliminado')
      .setDescription(data.content)
      .setColor(0x5865F2)
      .setFooter({ text: 'Eliminado' })
      .setTimestamp(data.deleted_at);

    context.reply({
      embeds: [embed]
    });
  }
};