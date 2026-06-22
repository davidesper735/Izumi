const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('usercard')
    .setDescription('Muestra la tarjeta de un usuario')
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a consultar')
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const roles = member?.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .map(r => `${r}`)
      .join(', ') || 'Sin roles';

    const embed = new EmbedBuilder()
      .setTitle(`🪪 ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setColor(member?.displayHexColor || 0x2B2D31)
      .addFields(
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '📅 Cuenta creada', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '📥 Se unió', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Desconocido', inline: true },
        { name: '🎭 Roles', value: roles }
      )
      .setFooter({ text: `Bot de ${interaction.guild.name}` });

    await interaction.reply({ embeds: [embed] });
  }
};