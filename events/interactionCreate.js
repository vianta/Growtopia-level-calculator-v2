const { InteractionType } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Slash command handler
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Slash command error (${interaction.commandName}):`, error);
                const errorMessage = { content: '❌ An error occurred while executing this command!', ephemeral: true };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
            return;
        }

        // Calculator interaction handler (buton ve modal)
        if (interaction.isButton() && (interaction.customId.startsWith('open_calc_') || interaction.customId.startsWith('auto_calc_'))) {
            const calculatorCommand = interaction.client.commands.get('calculator');
            if (calculatorCommand && calculatorCommand.handleInteraction) {
                return await calculatorCommand.handleInteraction(interaction);
            }
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith('calc_modal_')) {
            const calculatorCommand = interaction.client.commands.get('calculator');
            if (calculatorCommand && calculatorCommand.handleInteraction) {
                return await calculatorCommand.handleInteraction(interaction);
            }
        }

        if (interaction.isButton() && (interaction.customId.startsWith('calc_prev_') || interaction.customId.startsWith('calc_next_') || interaction.customId.startsWith('calc_history_') || interaction.customId.startsWith('calc_favorite_') || interaction.customId.startsWith('calc_favorites_') || interaction.customId.startsWith('calc_clear_history_') || interaction.customId.startsWith('calc_clear_favorites_'))) {
            const calculatorCommand = interaction.client.commands.get('calculator');
            if (calculatorCommand && calculatorCommand.handleInteraction) {
                return await calculatorCommand.handleInteraction(interaction);
            }
        }

        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('calc_strategy_')) {
            const calculatorCommand = interaction.client.commands.get('calculator');
            if (calculatorCommand && calculatorCommand.handleInteraction) {
                return await calculatorCommand.handleInteraction(interaction);
            }
        }

        // Cleanup command interaction handler
        if (interaction.isButton() && (interaction.customId.startsWith('cleanup_confirm_') || interaction.customId.startsWith('cleanup_cancel_'))) {
            const cleanupCommand = interaction.client.commands.get('cleanup');
            if (cleanupCommand && cleanupCommand.handleInteraction) {
                return await cleanupCommand.handleInteraction(interaction);
            }
        }

        // Jar Calculator interaction handler
        if ((interaction.isStringSelectMenu() && interaction.customId.startsWith('jar_main_role_select_')) ||
            (interaction.type === 5 && interaction.customId.startsWith('jar_advanced_modal_')) ||
            (interaction.isButton() && (interaction.customId.startsWith('jar_approve_') || 
                                       interaction.customId.startsWith('jar_reject_') ||
                                       interaction.customId.startsWith('jar_review_')))) {
            const jarCalcCommand = interaction.client.commands.get('jar-calc');
            if (jarCalcCommand && jarCalcCommand.handleInteraction) {
                return await jarCalcCommand.handleInteraction(interaction);
            }
        }

        // Seed Settings interaction handler
        if ((interaction.isStringSelectMenu() && interaction.customId.startsWith('settings_category_')) ||
            (interaction.isButton() && (interaction.customId.startsWith('settings_backup_') || 
                                       interaction.customId.startsWith('settings_reload_') ||
                                       interaction.customId.startsWith('settings_test_'))) ||
            (interaction.type === 5 && (interaction.customId.startsWith('multipliers_modal_') ||
                                       interaction.customId.startsWith('limits_modal_') ||
                                       interaction.customId.startsWith('food_tax_modal_')))) {
            const seedSettingsCommand = interaction.client.commands.get('seed-settings');
            if (seedSettingsCommand && seedSettingsCommand.handleInteraction) {
                return await seedSettingsCommand.handleInteraction(interaction);
            }
        }
    }
};