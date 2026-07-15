module.exports = {
  name: 'messageCreate',
  async execute(message) {
    const CANAL_ID = '1515954135407657103';
    const SERVIDOR_ID = '668321871984459786';
    const BOT_EXENTO = '678344927997853742';

    if (message.guildId !== SERVIDOR_ID) return;
    if (message.channelId !== CANAL_ID) return;
    if (message.author.id === BOT_EXENTO) return;

    try {
      await message.delete();
    } catch (error) {
      console.error('No pude eliminar el mensaje:', error);
    }
  }
};