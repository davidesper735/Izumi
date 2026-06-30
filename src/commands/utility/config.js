const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { pool } = require('../../database/database');

async function getSettings(guildId) {
  const result = await pool.query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId]);
  return result.rows[0] || null;
}

async function upsertSetting(guildId, field, value) {
  const existing = await getSettings(guildId);
  if (existing) {
    await pool.query(`UPDATE guild_settings SET ${field} = $1 WHERE guild_id = $2`, [value, guildId]);
  } else {
    await pool.query(`INSERT INTO guild_settings (guild_id, ${field}) VALUES ($1, $2)`, [guildId, value]);
  }
}

module.exports = {
  category: 'Configuración',
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
      await upsertSetting(guildId, 'log_channel', canal.id);

      const embed = new EmbedBuilder()
        .setTitle('Configuracion actualizada')
        .setColor(0x57F287)
        .addFields({ name: 'Logs de moderacion', value: `${canal}` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'logs-off') {
      await upsertSetting(guildId, 'log_channel', null);

      const embed = new EmbedBuilder()
        .setTitle('Configuracion actualizada')
        .setColor(0xED4245)
        .setDescription('Los logs de moderacion han sido desactivados.')
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'prefix') {
      const prefix = interaction.options.getString('prefix');
      await upsertSetting(guildId, 'prefix', prefix);

      const embed = new EmbedBuilder()
        .setTitle('Configuracion actualizada')
        .setColor(0x57F287)
        .addFields({ name: 'Nuevo prefix', value: `\`${prefix}\`` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'prefix-reset') {
      await upsertSetting(guildId, 'prefix', '#');

      const embed = new EmbedBuilder()
        .setTitle('Configuracion actualizada')
        .setColor(0x57F287)
        .setDescription('El prefix ha sido reseteado a `#`')
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  }
};