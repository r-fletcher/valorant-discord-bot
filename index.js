require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const rank = require('./commands/rank');
const link = require('./commands/link');
const unlink = require('./commands/unlink');
const history = require('./commands/history');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent
    ]
});

const commands = { rank, link, unlink, history };

client.on('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply(`:ping_pong: Pong!\n\`Latency: ${client.ws.ping}ms\``);
    }

    const command = commands[interaction.commandName];
    if (command) await command(interaction);
});
