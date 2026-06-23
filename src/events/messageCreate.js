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

function resolveUser(arg, guild) {
  if (!arg) return null;
  // Mencion <@123> o <@!123>
  const mentionMatch = arg.match(/^<@!?(\d+)>$/);
  if (mentionMatch) return guild.client.users.cache.get(mentionMatch[1]) || null;
  // ID directo
  if (/^\d+$/.test(arg)) return guild.client.users.cache.get(arg) || null;
  // Username
  return guild.members.cache.find(m =>
    m.user.username.toLowerCase() === arg.toLowerCase()
  )?.user || null;
}

function resolveMember(arg, guild) {
  if (!arg) return null;
  const mentionMatch = arg.match(/^<@!?(\d+)>$/);
  if (mentionMatch) return guild.members.cache.get(mentionMatch[1]) || null;
  if (/^\d+$/.test(arg)) return guild.members.cache.get(arg) || null;
  return guild.members.cache.find(m =>
    m.user.username.toLowerCase() === arg.toLowerCase()
  ) || null;
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
      // Resuelve usuarios y members desde args
      resolveUser: (index) => resolveUser(args[index], message.guild),
      resolveMember: (index) => resolveMember(args[index], message.guild),
      reply: (content) => {
        if (typeof content === 'string') return message.reply(content);
        // Ignorar flags en prefix (no aplican a mensajes normales)
        const { flags, ...rest } = typeof content === 'object' ? content : {};
        return message.reply(rest);
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