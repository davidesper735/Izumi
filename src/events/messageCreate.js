const { pool } = require('../database/database');

const DEFAULT_PREFIX = '#';

async function getPrefix(guildId) {
  const result = await pool.query('SELECT prefix FROM guild_settings WHERE guild_id = $1', [guildId]);
  return result.rows[0]?.prefix || DEFAULT_PREFIX;
}

function resolveUser(arg, guild) {
  if (!arg) return null;
  const mentionMatch = arg.match(/^<@!?(\d+)>$/);
  if (mentionMatch) return guild.client.users.cache.get(mentionMatch[1]) || null;
  if (/^\d+$/.test(arg)) return guild.client.users.cache.get(arg) || null;
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

    const prefix = await getPrefix(message.guild.id);
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
      resolveUser: (index) => resolveUser(args[index], message.guild),
      resolveMember: (index) => resolveMember(args[index], message.guild),
      reply: (content) => {
        if (typeof content === 'string') return message.reply(content);
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