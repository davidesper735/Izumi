require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const foldersPath = path.join(__dirname, 'src', 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command) commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    // Borra los comandos globales que ya existían
    console.log('🗑️  Borrando comandos globales...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
    console.log('✅ Comandos globales borrados.');

    // Registra los comandos solo en tu servidor de prueba
    console.log(`📡 Registrando ${commands.length} comandos en el servidor de prueba...`);
    await rest.put(
  Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
  { body: commands }
);
    console.log('✅ Comandos registrados en el servidor de prueba.');
  } catch (error) {
    console.error(error);
  }
})();