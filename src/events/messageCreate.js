const fs = require('fs');
const path = require('path');

const DEFAULT_PREFIX = '#';
const configPath = path.join(__dirname, '..', '..', 'data', 'config.json');

function getPrefix(guildId) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config?.[guildId]?.prefix || DEFAULT_PREFIX;
  } catch {
    return DEFAULT_PREFIX;
  }
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const prefix = getPrefix(message.guild.id);
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = message.client.commands.get(commandName);
    if (!command?.run) return;

    const context = {
      guild: message.guild,
      channel: message.channel,
      user: message.author,
      member: message.member,
      args,
      isSlash: false,
      reply: (content) => {
        if (typeof content === 'string') return message.reply(content);
        if (content.embeds) return message.reply({ embeds: content.embeds });
        return message.reply(content);
      }
    };

    try {
      await command.run(context);
    } catch (err) {
      console.error(err);
      await message.reply('Hubo un error ejecutando este comando.');
    }
  }
};