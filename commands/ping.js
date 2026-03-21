module.exports = {
    name: 'ping',
    execute: async (interaction) => {
        await interaction.deferReply();

        const ping = interaction.client.ws.ping;
        if (ping === -1) return interaction.editReply(`Still connecting to discord. Please wait a few seconds.`);

        await interaction.editReply(`:ping_pong: Pong!\n\`Latency: ${interaction.client.ws.ping}ms\``);
    }
}