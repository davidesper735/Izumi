const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const sniped = new Map(); // channelId -> { content, author, timestamp }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Muestra el ultimo mensaje eliminado en el canal'),

  // Guarda el mensaje eliminado — se llama desde el evento messageDelete
  cache(message) {
    if (message.author?.bot) return;
    if (!message.content) return;
    sniped.set(message.channel.id, {
      content: message.content,
      author: message.author,
      timestamp: Date.now()
    });
  },

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
    const data = sniped.get(context.channel.id);

    if (!data) {
      return context.reply({ content: 'No hay ningun mensaje eliminado reciente en este canal.', flags: 64 });
    }

    const embed = new EmbedBuilder()
      .setTitle('Ultimo mensaje eliminado')
      .setDescription(data.content)
      .setColor(0x5865F2)
      .setAuthor({ name: data.author.username, iconURL: data.author.displayAvatarURL({ dynamic: true }) })
      .setFooter({ text: `Eliminado` })
      .setTimestamp(data.timestamp);

    context.reply({ embeds: [embed] });
  }
};