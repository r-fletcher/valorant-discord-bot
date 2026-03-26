const BaseCommand = require('./BaseCommand');
const db = require('../db');

class UnlinkCommand extends BaseCommand {
    constructor() {
        super('unlink', { useCache: false, useDb: false, defer: false});
    }

    async run(interaction) {
        try {
            const result = await new Promise((resolve, reject) => {
                db.run(
                    `DELETE FROM users WHERE discord_id = ?`,
                    [interaction.user.id],
                    (err) => {
                        if (err) reject(err);
                        else resolve({deletedCount: this.changes});
                    }
                );
            });

            if (result.deletedCount !== 0) return interaction.reply({ content: "Link successfully removed!", ephemeral: true });
            else interaction.reply({ content: "Account not yet linked", ephemeral: true });
            
        } catch (err) {
            console.log(err);

            return interaction.reply({
                content: ":x: Error removing account link",
                ephemeral: true
            });
        }
    }
}

module.exports = new UnlinkCommand();