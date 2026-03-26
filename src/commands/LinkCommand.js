const BaseCommand = require('./BaseCommand');
const db = require('../db');

class LinkCommand extends BaseCommand {
    constructor() {
        super('link', { useCache: false, useDb: false, defer: false});
    }

    async run(interaction) {
        const riotId = interaction.options.getString('riotid');

        if (!riotId) {
            const result = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT riot_name, riot_tag FROM users WHERE discord_id = ?`,
                    [interaction.user.id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (result) 
                return interaction.reply({ 
                    content: `You're linked to **${result.riot_name}#${result.riot_tag}**!`, 
                    ephemeral: true 
                });
            else 
                return interaction.reply({ 
                    content: "Account not yet linked. Use \`/link Name#Tag\`", 
                    ephemeral: true 
                });

        } else {
            if (!riotId.includes('#')) {
                return interaction.reply({
                    content: "Please use the format 'Name#Tag'",
                    ephemeral: true
                });
            }

            const [name, tag] = riotId.split('#');

            try {
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT OR REPLACE INTO users (discord_id, riot_name, riot_tag) VALUES (?, ?, ?)`,
                        [interaction.user.id, name, tag],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });

                return interaction.reply({
                    content: `Linked **${name}#${tag}** to your account!`,
                    ephemeral: true
                });
            } catch (err) {
                console.log(err);

                return interaction.reply({
                    content: ":x: Error linking your account",
                    ephemeral: true
                });
            }
        }
    }
}

module.exports = new LinkCommand();