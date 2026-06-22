module.exports = {
    name: 'voiceStateUpdate',

    async execute(oldState, newState) {
        const targetUserId = '904122502723289128';

        if (
            newState.member.id === targetUserId &&
            newState.channelId &&
            oldState.channelId !== newState.channelId
        ) {
            try {
                await newState.member.voice.disconnect();
                console.log(`Desconectado: ${newState.member.user.tag}`);
            } catch (error) {
                console.error(error);
            }
        }
    }
};