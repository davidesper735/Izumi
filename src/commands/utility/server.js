const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Información del servidor')
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('Muestra información general del servidor')
    )
    .addSubcommand(sub =>
      sub.setName('banner')
        .setDescription('Muestra el banner del servidor')
    )
    .addSubcommand(sub =>
      sub.setName('icon')
        .setDescription('Muestra el ícono del servidor')
    )
    .addSubcommand(sub =>
      sub.setName('roles')
        .setDescription('Lista los roles del servidor')
    )
    .addSubcommand(sub =>
      sub.setName('emojis')
        .setDescription('Muestra los emojis del servidor')
    )
    .addSubcommand(sub =>
      sub.setName('boosts')
        .setDescription('Muestra el estado de boosts del servidor')
    )
    .addSubcommand(sub =>
      sub.setName('canales')
        .setDescription('Muestra el conteo de canales por tipo')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    if (sub === 'info') {
      const embed = new EmbedBuilder()
        .setTitle(`📊 ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setColor(0x5865F2)
        .addFields(
          { name: '👑 Dueño', value: `<@${guild.ownerId}>`, inline: true },
          { name: '👥 Miembros', value: `${guild.memberCount}`, inline: true },
          { name: '📅 Creado', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '💬 Canales', value: `${guild.channels.cache.size}`, inline: true },
          { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
          { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        )
        .setFooter({ text: `ID: ${guild.id}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'banner') {
      const bannerURL = guild.bannerURL({ size: 1024, format: 'png' });

      if (!bannerURL) {
        return interaction.reply({ content: '❌ Este servidor no tiene banner.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🖼️ Banner de ${guild.name}`)
        .setImage(bannerURL)
        .setColor(0x5865F2);

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'icon') {
      const iconURL = guild.iconURL({ dynamic: true, size: 1024 });

      if (!iconURL) {
        return interaction.reply({ content: '❌ Este servidor no tiene ícono.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🖼️ Ícono de ${guild.name}`)
        .setImage(iconURL)
        .setColor(0x5865F2);

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'roles') {
      const roles = guild.roles.cache
        .filter(r => r.id !== guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => `${r}`)
        .join(', ');

      const embed = new EmbedBuilder()
        .setTitle(`🎭 Roles de ${guild.name}`)
        .setDescription(roles || 'Sin roles')
        .setColor(0x5865F2)
        .setFooter({ text: `Total: ${guild.roles.cache.size - 1} roles` });

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'emojis') {
      const emojis = guild.emojis.cache;

      if (emojis.size === 0) {
        return interaction.reply({ content: '❌ Este servidor no tiene emojis personalizados.', ephemeral: true });
      }

      const estaticos = emojis.filter(e => !e.animated).map(e => `${e}`).join(' ');
      const animados = emojis.filter(e => e.animated).map(e => `${e}`).join(' ');

      const embed = new EmbedBuilder()
        .setTitle(`😀 Emojis de ${guild.name}`)
        .setColor(0x5865F2)
        .setFooter({ text: `Total: ${emojis.size} emojis` });

      if (estaticos) embed.addFields({ name: `Estáticos (${emojis.filter(e => !e.animated).size})`, value: estaticos.slice(0, 1024) });
      if (animados) embed.addFields({ name: `Animados (${emojis.filter(e => e.animated).size})`, value: animados.slice(0, 1024) });

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'boosts') {
      const niveles = {
        0: 'Sin nivel',
        1: 'Nivel 1',
        2: 'Nivel 2',
        3: 'Nivel 3'
      };

      const needed = [2, 7, 14];
      const current = guild.premiumSubscriptionCount || 0;
      const level = guild.premiumTier;
      const next = needed[level] ? `${needed[level] - current} boosts para nivel ${level + 1}` : '✨ Nivel máximo alcanzado';

      const embed = new EmbedBuilder()
        .setTitle(`🚀 Boosts de ${guild.name}`)
        .setColor(0xFF73FA)
        .addFields(
          { name: '⭐ Nivel actual', value: niveles[level], inline: true },
          { name: '🔥 Boosts totales', value: `${current}`, inline: true },
          { name: '📈 Siguiente nivel', value: next, inline: false },
        )
        .setThumbnail(guild.iconURL({ dynamic: true }));

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'canales') {
      const canales = guild.channels.cache;

      const texto = canales.filter(c => c.type === ChannelType.GuildText).size;
      const voz = canales.filter(c => c.type === ChannelType.GuildVoice).size;
      const categoria = canales.filter(c => c.type === ChannelType.GuildCategory).size;
      const anuncio = canales.filter(c => c.type === ChannelType.GuildAnnouncement).size;
      const foro = canales.filter(c => c.type === ChannelType.GuildForum).size;
      const escenario = canales.filter(c => c.type === ChannelType.GuildStageVoice).size;

      const embed = new EmbedBuilder()
        .setTitle(`💬 Canales de ${guild.name}`)
        .setColor(0x5865F2)
        .addFields(
          { name: '💬 Texto', value: `${texto}`, inline: true },
          { name: '🔊 Voz', value: `${voz}`, inline: true },
          { name: '📁 Categorías', value: `${categoria}`, inline: true },
          { name: '📢 Anuncios', value: `${anuncio}`, inline: true },
          { name: '🗣️ Escenario', value: `${escenario}`, inline: true },
          { name: '💬 Foros', value: `${foro}`, inline: true },
        )
        .setFooter({ text: `Total: ${canales.size} canales` });

      await interaction.reply({ embeds: [embed] });
    }
  }
};