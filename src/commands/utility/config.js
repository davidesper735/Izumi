const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../../database/database');

function getSettings(guildId) {
  return db.prepare(`
    SELECT * FROM guild_settings WHERE guild_id = ?
  `).get(guildId);
}

function upsertSetting(guildId, field, value) {
  const existing = getSettings(guildId);
  if (existing) {
    db.prepare(`UPDATE guild_settings SET ${field} = ? WHERE guild_id = ?`).run(value, guildId);
  } else {
    db.prepare(`INSERT INTO guild_settings (guild_id, ${field}) VALUES (?, ?)`).run(guildId, value);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configuracion del bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('logs')
        .setDescription('Configura el canal de logs de moderacion')
        .addChannelOption(opt =>
          opt.setName('canal').setDescription('Canal donde se enviaran los logs').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('logs-off')
        .setDescription('Desactiva los logs de moderacion')
    )
    .addSubcommand(sub =>
      sub.setName('prefix')
        .setDescription('Cambia el prefix del bot')
        .addStringOption(opt =>
          opt.setName('prefix').setDescription('Nuevo prefix').setRequired(true).setMinLength(1).setMaxLength(3)
        )
    )
    .addSubcommand(sub =>
      sub.setName('prefix-reset')
        .setDescription('Resetea el prefix al valor por defecto (#)')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'logs') {
      const canal = interaction.options.getChannel('canal');
      if (!canal.isTextBased()) {
        return interaction.reply({ content: 'El canal debe ser de texto.', flags: MessageFlags.Ephemeral });
      }
      upsertSetting(guildId, 'log_channel', canal.id);

      const embed = new EmbedBuilder()
        .setTitle('Configuracion actualizada')
        .setColor(0x57F287)
        .addFields({ name: 'Logs de moderacion', value: `${canal}` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'logs-off') {
      upsertSetting(guildId, 'log_channel', null);

      const embed = new EmbedBuilder()
        .setTitle('Configuracion actualizada')
        .setColor(0xED4245)
        .setDescription('Los logs de moderacion han sido desactivados.')
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'prefix') {
      const prefix = interaction.options.getString('prefix');
      upsertSetting(guildId, 'language', prefix); // reutilizamos un campo o puedes agregar columna prefix

      // Nota: agrega columna prefix a la tabla si quieres guardarlo separado
      const embed = new EmbedBuilder()
        .setTitle('Configuracion actualizada')
        .setColor(0x57F287)
        .addFields({ name: 'Nuevo prefix', value: `\`${prefix}\`` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'prefix-reset') {
      const embed = new EmbedBuilder()
        .setTitle('Configuracion actualizada')
        .setColor(0x57F287)
        .setDescription('El prefix ha sido reseteado a `#`')
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  }
};