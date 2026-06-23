const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('iq')
    .setDescription('Calcula el IQ de un usuario')
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a calcular')
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
    const seed = Number(BigInt(usuario.id) % 201n);

    let comentario;
    if (seed < 50) comentario = 'Necesita ayuda urgente.';
    else if (seed < 80) comentario = 'Por debajo del promedio.';
    else if (seed < 100) comentario = 'Promedio normal.';
    else if (seed < 130) comentario = 'Por encima del promedio.';
    else if (seed < 160) comentario = 'Muy inteligente.';
    else comentario = 'Genio absoluto.';

    const embed = new EmbedBuilder()
      .setTitle(`IQ de ${usuario.username}`)
      .setDescription(`**${seed} IQ**\n${comentario}`)
      .setColor(0x5865F2)
      .setTimestamp();

    context.reply({ embeds: [embed] });
  }
};