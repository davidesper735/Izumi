const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pp')
    .setDescription('Mide el pp de un usuario')
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a medir')
    ),

  async execute(interaction) {
    const context = {
      guild: interaction.guild,
      channel: interaction.channel,
      user: interaction.user,
      member: interaction.member,
      args: [interaction.options.getUser('usuario') || interaction.user],
      isSlash: true,
      reply: (content) => interaction.reply(content)
    };
    await this.run(context);
  },

  async run(context) {
    const usuario = context.args[0] || context.user;
    const seed = Number(BigInt(usuario.id) % 21n);
    const barra = '8' + '='.repeat(seed) + 'D';

    const embed = new EmbedBuilder()
      .setTitle(`PP de ${usuario.username}`)
      .setDescription(barra)
      .setColor(0x5865F2)
      .setTimestamp();

    context.reply({ embeds: [embed] });
  }
};