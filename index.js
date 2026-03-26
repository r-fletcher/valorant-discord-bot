require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const rank = require('./src/commands/rank');
const link = require('./src/commands/link');
const unlink = require('./src/commands/unlink');
const history = require('./src/commands/history');
const ping = require('./src/commands/ping');
const progress = require('./src/commands/progress');

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
