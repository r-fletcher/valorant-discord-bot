require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const rank = require('./commands/rank');
const link = require('./commands/link');
const unlink = require('./commands/unlink');
const history = require('./commands/history');
const ping = require('./commands/ping');
const progress = require('./commands/progress');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent
    ]
});

const commands = { rank, link, unlink, history, ping, progress };

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}\nGetting latency... `);
    
    const interval = setInterval(() => {
        const ping = client.ws.ping;
        if (ping !== -1) {
            console.log(`WS ping: ${ping}ms`);
            clearInterval(interval);
        }
    }, 1000);
});

client.login(process.env.DISCORD_TOKEN);

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands[interaction.commandName];
    console.log(`Received command '${command.name}'`);
    if (command) await command.execute(interaction);
});
