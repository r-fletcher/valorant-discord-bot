require('dotenv').config();
const { REST, Routes } = require('discord.js');

const CLIENT_ID = '1484156770858569811';

const commands = [
    {
        name: 'ping',
        description: 'replies with pong',
    }, 
    {
        name: 'rank',
        description: 'Get Valorant rank',
        options: [
            {
                name: 'riotid',
                description: 'Player\'s RiotID (name#tag)',
                type: 3, // string
                required: false
            }
        ]
    },
    {
        name: 'link',
        description: 'Link Valorant account to you',
        options: [
            {
                name: 'riotid',
                description: 'Your RiotID (name#tag)',
                type: 3, // string
                required: true
            }
        ]
    },
    {
        name: 'unlink',
        description: 'Removes Valorant account link from you',
    },
    {
        name: 'history',
        description: 'Shows match history',
        options: [
            {
                name: 'riotid',
                description: 'Player\'s RiotID (name#tag)',
                type: 3,
                required: false
            }
        ]
    }
];

const rest = new REST({version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registering commands...');

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID), 
            {body: commands }
        );

        console.log('Commands registered!');
    } catch(err) {
        console.log(err);
    }
})();