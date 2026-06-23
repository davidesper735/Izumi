module.exports = {
  name: 'messageDelete',
  async execute(message) {
    const snipe = message.client.commands.get('snipe');
    if (snipe?.cache) snipe.cache(message);
  }
};