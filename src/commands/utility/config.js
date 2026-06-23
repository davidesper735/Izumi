const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', '..', '..', 'data', 'config.json');

function loadConfig() {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, '{}');
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

function saveConfig(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
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
    const config = loadConfig();
    const guildId = interaction.guild.id;

    if (!config[guildId]) config[guildId] = {};

    if (sub === 'logs') {
      const canal = interaction.options.getChannel('canal');

      if (!canal.isTextBased()) {
        return interaction.reply({ content: 'El canal debe ser de texto.', flags: MessageFlags.Ephemeral });
      }

      config[guildId].logsChannel = canal.id;
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setTitle('Configuracion actualizada')
        .setColor(0x57F287)
        .addFields({ name: 'Logs de moderacion', value: `${canal}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'logs-off') {
      delete config[guildId].logsChannel;
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setTitle('Configuracion actualizada')
        .setColor(0xED4245)
        .setDescription('Los logs de moderacion han sido desactivados.')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'prefix') {
      const prefix = interaction.options.getString('prefix');
      config[guildId].prefix = prefix;
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setTitle('Configuracion actualizada')
        .setColor(0x57F287)
        .addFields({ name: 'Nuevo prefix', value: `\`${prefix}\`` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'prefix-reset') {
      delete config[guildId].prefix;
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setTitle('Configuracion actualizada')
        .setColor(0x57F287)
        .setDescription('El prefix ha sido reseteado a `#`')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};