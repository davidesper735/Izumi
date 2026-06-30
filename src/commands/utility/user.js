const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  category: 'Información',
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Información de un usuario')
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('Muestra información general de un usuario')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuario a consultar')
        )
    )
    .addSubcommand(sub =>
      sub.setName('avatar')
        .setDescription('Muestra el avatar de un usuario')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuario a consultar')
        )
    )
    .addSubcommand(sub =>
      sub.setName('banner')
        .setDescription('Muestra el banner de un usuario')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuario a consultar')
        )
    )
    .addSubcommand(sub =>
      sub.setName('roles')
        .setDescription('Muestra los roles de un usuario')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuario a consultar')
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('usuario') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    if (sub === 'info') {
      const embed = new EmbedBuilder()
        .setTitle(`🪪 ${user.username}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setColor(member?.displayHexColor || 0x5865F2)
        .addFields(
          { name: '🆔 ID', value: user.id, inline: true },
          { name: '🤖 Bot', value: user.bot ? 'Sí' : 'No', inline: true },
          { name: '📅 Cuenta creada', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '📥 Se unió', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Desconocido', inline: true },
          { name: '🎨 Color de rol', value: member?.displayHexColor || 'Sin color', inline: true },
          { name: '💬 Apodo', value: member?.nickname || 'Sin apodo', inline: true },
        )
        .setFooter({ text: `Solicitado por ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'avatar') {
      const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });

      const embed = new EmbedBuilder()
        .setTitle(`🖼️ Avatar de ${user.username}`)
        .setImage(avatarURL)
        .setColor(member?.displayHexColor || 0x5865F2)
        .addFields(
          { name: '🔗 Enlaces', value: `[PNG](${user.displayAvatarURL({ size: 1024, format: 'png' })}) • [JPG](${user.displayAvatarURL({ size: 1024, format: 'jpg' })}) • [WEBP](${user.displayAvatarURL({ size: 1024, format: 'webp' })})` }
        );

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'banner') {
      await interaction.deferReply();

      const fetched = await user.fetch();
      const bannerURL = fetched.bannerURL({ dynamic: true, size: 1024 });

      if (!bannerURL) {
        return interaction.editReply({ content: '❌ Este usuario no tiene banner.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🖼️ Banner de ${user.username}`)
        .setImage(bannerURL)
        .setColor(member?.displayHexColor || 0x5865F2);

      await interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'roles') {
      const roles = member?.roles.cache
        .filter(r => r.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => `${r}`)
        .join(', ') || 'Sin roles';

      const embed = new EmbedBuilder()
        .setTitle(`🎭 Roles de ${user.username}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(roles)
        .setColor(member?.displayHexColor || 0x5865F2)
        .setFooter({ text: `Total: ${(member?.roles.cache.size ?? 1) - 1} roles` });

      await interaction.reply({ embeds: [embed] });
    }
  }
};