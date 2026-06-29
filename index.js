require('dotenv').config();
const { init } = require('./src/database/database');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function main() {
  await init();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates
    ]
  });

  client.commands = new Collection();

  const foldersPath = path.join(__dirname, 'src', 'commands');
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      }
    }
  }

  const interact = client.commands.get('interact');
  if (interact) {
    const accionesInteract = ['hug', 'kiss', 'pat', 'slap', 'poke', 'bite', 'wave', 'cry', 'blush', 'dance'];
    for (const accion of accionesInteract) {
      client.commands.set(accion, {
        data: { name: accion },
        run: async (context) => {
          await interact.runAccion({ ...context, accion });
        }
      });
    }
  }

  const eventsPath = path.join(__dirname, 'src', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }

  process.on('unhandledRejection', error => {
    console.error('Error no manejado:', error);
  });

  client.login(process.env.TOKEN);
}

main();