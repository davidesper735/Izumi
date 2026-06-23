const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rates')
    .setDescription('Le da un porcentaje aleatorio a cualquier cosa')
    .addStringOption(opt =>
      opt.setName('cosa').setDescription('Que quieres calificar').setRequired(true)
    ),

  async execute(interaction) {
    const context = {
      guild: interaction.guild,
      channel: interaction.channel,
      user: interaction.user,
      member: interaction.member,
      args: [interaction.options.getString('cosa')],
      isSlash: true,
      reply: (content) => interaction.reply(content)
    };
    await this.run(context);
  },

  async run(context) {
    const cosa = context.args[0];
    const porcentaje = Math.floor(Math.random() * 101);

    const barra = Math.round(porcentaje / 10);
    const llena = '█'.repeat(barra);
    const vacia = '░'.repeat(10 - barra);

    const embed = new EmbedBuilder()
      .setTitle(`Calificacion de "${cosa}"`)
      .setDescription(`${llena}${vacia} **${porcentaje}%**`)
      .setColor(0x5865F2)
      .setFooter({ text: `Pedido por ${context.user.username}` })
      .setTimestamp();

    context.reply({ embeds: [embed] });
  }
};