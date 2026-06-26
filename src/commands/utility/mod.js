const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');


// Reemplaza las funciones al inicio de mod.js
const db = require('../../database/database');

function getLogsChannel(guild) {
  const settings = db.prepare('SELECT log_channel FROM guild_settings WHERE guild_id = ?').get(guild.id);
  const channelId = settings?.log_channel;
  if (!channelId) return null;
  return guild.channels.cache.get(channelId) || null;
}

async function sendLog(guild, embed) {
  const canal = getLogsChannel(guild);
  if (canal) await canal.send({ embeds: [embed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Comandos de moderacion')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub =>
      sub.setName('ban')
        .setDescription('Banea a un usuario')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuario a banear').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('razon').setDescription('Razon del ban')
        )
    )
    .addSubcommand(sub =>
      sub.setName('kick')
        .setDescription('Expulsa a un usuario')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('razon').setDescription('Razon de la expulsion')
        )
    )
    .addSubcommand(sub =>
      sub.setName('timeout')
        .setDescription('Silencia a un usuario temporalmente')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuario a silenciar').setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('minutos').setDescription('Duracion en minutos').setRequired(true).setMinValue(1).setMaxValue(40320)
        )
        .addStringOption(opt =>
          opt.setName('razon').setDescription('Razon del timeout')
        )
    )
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Elimina mensajes en masa')
        .addIntegerOption(opt =>
          opt.setName('cantidad').setDescription('Cantidad de mensajes a eliminar (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
        )
    )
    .addSubcommand(sub =>
      sub.setName('unban')
        .setDescription('Desbanea a un usuario')
        .addStringOption(opt =>
          opt.setName('id').setDescription('ID del usuario a desbanear').setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const razon = interaction.options.getString('razon') || 'Sin razon especificada';
    const moderador = interaction.user;

    if (sub === 'ban') {
      const usuario = interaction.options.getUser('usuario');
      const member = interaction.guild.members.cache.get(usuario.id);

      if (!member) {
        return interaction.reply({ content: 'No se encontro al usuario en el servidor.', flags: MessageFlags.Ephemeral });
      }

      if (!member.bannable) {
        return interaction.reply({ content: 'No puedo banear a este usuario.', flags: MessageFlags.Ephemeral });
      }

      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({ content: 'No puedes banear a alguien con un rol igual o superior al tuyo.', flags: MessageFlags.Ephemeral });
      }

      await member.ban({ reason: razon });

      const embed = new EmbedBuilder()
        .setTitle('Usuario baneado')
        .setColor(0xED4245)
        .addFields(
          { name: 'Usuario', value: `${usuario.username} (${usuario.id})`, inline: true },
          { name: 'Moderador', value: moderador.username, inline: true },
          { name: 'Razon', value: razon },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const logEmbed = new EmbedBuilder()
        .setTitle('Ban')
        .setColor(0xED4245)
        .addFields(
          { name: 'Usuario', value: `${usuario.username} (${usuario.id})`, inline: true },
          { name: 'Moderador', value: `${moderador.username} (${moderador.id})`, inline: true },
          { name: 'Razon', value: razon },
        )
        .setTimestamp();

      await sendLog(interaction.guild, logEmbed);
    }

    if (sub === 'kick') {
      const usuario = interaction.options.getUser('usuario');
      const member = interaction.guild.members.cache.get(usuario.id);

      if (!member) {
        return interaction.reply({ content: 'No se encontro al usuario en el servidor.', flags: MessageFlags.Ephemeral });
      }

      if (!member.kickable) {
        return interaction.reply({ content: 'No puedo expulsar a este usuario.', flags: MessageFlags.Ephemeral });
      }

      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({ content: 'No puedes expulsar a alguien con un rol igual o superior al tuyo.', flags: MessageFlags.Ephemeral });
      }

      await member.kick(razon);

      const embed = new EmbedBuilder()
        .setTitle('Usuario expulsado')
        .setColor(0xFEE75C)
        .addFields(
          { name: 'Usuario', value: `${usuario.username} (${usuario.id})`, inline: true },
          { name: 'Moderador', value: moderador.username, inline: true },
          { name: 'Razon', value: razon },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const logEmbed = new EmbedBuilder()
        .setTitle('Kick')
        .setColor(0xFEE75C)
        .addFields(
          { name: 'Usuario', value: `${usuario.username} (${usuario.id})`, inline: true },
          { name: 'Moderador', value: `${moderador.username} (${moderador.id})`, inline: true },
          { name: 'Razon', value: razon },
        )
        .setTimestamp();

      await sendLog(interaction.guild, logEmbed);
    }

    if (sub === 'timeout') {
      const usuario = interaction.options.getUser('usuario');
      const member = interaction.guild.members.cache.get(usuario.id);
      const minutos = interaction.options.getInteger('minutos');

      if (!member) {
        return interaction.reply({ content: 'No se encontro al usuario en el servidor.', flags: MessageFlags.Ephemeral });
      }

      if (!member.moderatable) {
        return interaction.reply({ content: 'No puedo silenciar a este usuario.', flags: MessageFlags.Ephemeral });
      }

      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({ content: 'No puedes silenciar a alguien con un rol igual o superior al tuyo.', flags: MessageFlags.Ephemeral });
      }

      await member.timeout(minutos * 60 * 1000, razon);

      const embed = new EmbedBuilder()
        .setTitle('Usuario silenciado')
        .setColor(0xFEE75C)
        .addFields(
          { name: 'Usuario', value: `${usuario.username} (${usuario.id})`, inline: true },
          { name: 'Moderador', value: moderador.username, inline: true },
          { name: 'Duracion', value: `${minutos} minuto${minutos !== 1 ? 's' : ''}`, inline: true },
          { name: 'Razon', value: razon },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const logEmbed = new EmbedBuilder()
        .setTitle('Timeout')
        .setColor(0xFEE75C)
        .addFields(
          { name: 'Usuario', value: `${usuario.username} (${usuario.id})`, inline: true },
          { name: 'Moderador', value: `${moderador.username} (${moderador.id})`, inline: true },
          { name: 'Duracion', value: `${minutos} minuto${minutos !== 1 ? 's' : ''}`, inline: true },
          { name: 'Razon', value: razon },
        )
        .setTimestamp();

      await sendLog(interaction.guild, logEmbed);
    }

    if (sub === 'clear') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: 'No tienes permiso para eliminar mensajes.', flags: MessageFlags.Ephemeral });
      }

      const cantidad = interaction.options.getInteger('cantidad');

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const mensajes = await interaction.channel.bulkDelete(cantidad, true);

      await interaction.editReply({ content: `Se eliminaron ${mensajes.size} mensaje${mensajes.size !== 1 ? 's' : ''} correctamente.` });

      const logEmbed = new EmbedBuilder()
        .setTitle('Clear')
        .setColor(0x5865F2)
        .addFields(
          { name: 'Canal', value: `${interaction.channel}`, inline: true },
          { name: 'Moderador', value: `${moderador.username} (${moderador.id})`, inline: true },
          { name: 'Mensajes eliminados', value: `${mensajes.size}`, inline: true },
        )
        .setTimestamp();

      await sendLog(interaction.guild, logEmbed);
    }

    if (sub === 'unban') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({ content: 'No tienes permiso para desbanear usuarios.', flags: MessageFlags.Ephemeral });
      }

      const id = interaction.options.getString('id');

      try {
        const ban = await interaction.guild.bans.fetch(id);
        await interaction.guild.members.unban(id);

        const embed = new EmbedBuilder()
          .setTitle('Usuario desbaneado')
          .setColor(0x57F287)
          .addFields(
            { name: 'Usuario', value: `${ban.user.username} (${id})`, inline: true },
            { name: 'Moderador', value: moderador.username, inline: true },
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        const logEmbed = new EmbedBuilder()
          .setTitle('Unban')
          .setColor(0x57F287)
          .addFields(
            { name: 'Usuario', value: `${ban.user.username} (${id})`, inline: true },
            { name: 'Moderador', value: `${moderador.username} (${moderador.id})`, inline: true },
          )
          .setTimestamp();

        await sendLog(interaction.guild, logEmbed);
      } catch {
        await interaction.reply({ content: 'No se encontro ningun ban con esa ID.', flags: MessageFlags.Ephemeral });
      }
    }
  }
};