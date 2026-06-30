const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  category: 'Diversión',
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Calcula la compatibilidad entre dos usuarios')
    .addUserOption(opt =>
      opt.setName('usuario1').setDescription('Primer usuario').setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName('usuario2').setDescription('Segundo usuario').setRequired(true)
    ),

  async execute(interaction) {
    const context = {
      guild: interaction.guild,
      channel: interaction.channel,
      user: interaction.user,
      member: interaction.member,
      args: [
        interaction.options.getUser('usuario1'),
        interaction.options.getUser('usuario2')
      ],
      isSlash: true,
      reply: (content) => interaction.reply(content)
    };
    await this.run(context);
  },

  async run(context) {
    const u1 = context.isSlash ? context.args[0] : context.resolveUser(0);
    const u2 = context.isSlash ? context.args[1] : context.resolveUser(1);

    if (!u1 || !u2) return context.reply({ content: 'Debes mencionar dos usuarios.', flags: 64 });
    if (u1.id === u2.id) return context.reply({ content: 'No puedes shippearte contigo mismo.', flags: 64 });

    const seed = (BigInt(u1.id) + BigInt(u2.id)) % 101n;
    const porcentaje = Number(seed);

    const barra = Math.round(porcentaje / 10);
    const llena = '█'.repeat(barra);
    const vacia = '░'.repeat(10 - barra);

    let comentario;
    if (porcentaje < 20) comentario = 'No hay nada aqui.';
    else if (porcentaje < 40) comentario = 'Algo hay, pero muy poco.';
    else if (porcentaje < 60) comentario = 'Hay potencial.';
    else if (porcentaje < 80) comentario = 'Buena combinacion.';
    else if (porcentaje < 100) comentario = 'Casi perfectos juntos.';
    else comentario = 'Almas gemelas.';

    const shipName = u1.username.slice(0, Math.ceil(u1.username.length / 2)) +
                     u2.username.slice(Math.floor(u2.username.length / 2));

    const embed = new EmbedBuilder()
      .setTitle(`${u1.username} y ${u2.username}`)
      .setColor(0xFF6B9D)
      .setDescription(`**${shipName}**\n\n${llena}${vacia} **${porcentaje}%**\n\n${comentario}`)
      .setTimestamp();

    context.reply({ embeds: [embed] });
  }
};