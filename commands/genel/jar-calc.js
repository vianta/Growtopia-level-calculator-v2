const { ContainerBuilder, TextDisplayBuilder, StringSelectMenuBuilder, ActionRowBuilder, SlashCommandBuilder, EmbedBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jar-calc')
        .setDescription('Advanced Jar Calculator - Calculate seed rewards with food sales tracking'),
    name: 'jar-calc',
    description: 'Advanced Jar Calculator - Calculate seed rewards with food sales tracking',

    async execute(interaction) {
        // Kanal kontrolü - sadece belirli kanalda çalışır
        if (interaction.channelId !== config.CALCULATOR_CHANNEL_ID) {
            return interaction.reply({ 
                content: `❌ This command can only be used in <#${config.CALCULATOR_CHANNEL_ID}>`, 
                ephemeral: true 
            });
        }

        // Slash command handler
        if (interaction.isChatInputCommand()) {
            // Sadece owner, adminler ve haftanın admini kullanabilir
            const isOwner = config.OWNER_ID.includes(interaction.user.id);
            const isAdmin = interaction.member?.roles.cache.has(config.ADMIN_ROLE);
            const isWeeklyAdmin = interaction.member?.roles.cache.has(config.WEEKLY_ADMIN_ROLE);
            const isWorldAdmin = interaction.member?.roles.cache.has(config.WORLD_ADMIN_ROLE);

            if (!isOwner && !isAdmin && !isWeeklyAdmin && !isWorldAdmin) {
                return interaction.reply({ 
                    content: '❌ Bu komutu sadece Owner, Adminler ve Haftanın Admini kullanabilir!', 
                    ephemeral: true 
                });
            }

            return this.createJarCalculatorPanel(interaction, 'reply');
        }
    },

    // Prefix command handler (backward compatibility)
    async executeMessage(message) {
        // Kanal kontrolü - sadece belirli kanalda çalışır
        if (message.channelId !== config.CALCULATOR_CHANNEL_ID) {
            return message.reply(`❌ This command can only be used in <#${config.CALCULATOR_CHANNEL_ID}>`);
        }

        // Sadece owner, adminler ve haftanın admini kullanabilir
        const isOwner = config.OWNER_ID.includes(message.author.id);
        const isAdmin = message.member?.roles.cache.has(config.ADMIN_ROLE);
        const isWeeklyAdmin = message.member?.roles.cache.has(config.WEEKLY_ADMIN_ROLE);
        const isWorldAdmin = message.member?.roles.cache.has(config.WORLD_ADMIN_ROLE);

        if (!isOwner && !isAdmin && !isWeeklyAdmin && !isWorldAdmin) {
            return message.reply('❌ Bu komutu sadece Owner, Adminler ve Haftanın Admini kullanabilir!');
        }

        return this.createJarCalculatorPanel(message, 'reply');
    },

    async createJarCalculatorPanel(context, method = 'reply') {
        // Clean Jar Calculator Container - Components v2
        const jarContainer = new ContainerBuilder();

        // Main title and welcome message
        jarContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `# <:jars:1478071672593711296> **Advanced Jar Calculator**\n` +
                    `**Advanced seed calculator with jar contributions and food sales tracking**\n\n` +
                    `**<a:byebye:1463545740713394368> Welcome ${context.user?.displayName || context.author?.displayName}!**\n` +
                    `Calculate your seed rewards based on jar contributions and track your food sales earnings.`
                )
        );

        // System explanation
        jarContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `## <:Scroll_Bulletin:1463546439828508783> **How It Works**\n` +
                    `This calculator helps you determine seed rewards based on your role and jar contributions. Simply select your role below and enter your jar amount along with any food sales you've made.\n\n` +
                    `**<:jarseed:1478071704726278357> Seed Formula:** Your Jar Amount ÷ 200 × Role Multiplier\n` +
                    `**<:tart:1474257527574368352> Food Sales:** Track Gingerbread Cookie and Coconut Tart sales for additional WL earnings\n` +
                    `**<a:871826redrose:1472252293628952626> Auto Logging:** All calculations are automatically logged for admin review`
                )
        );

        // Food prices info
        jarContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `## <:worldlock:1458975566769160263> **Food Prices**\n` +
                    `• **<:ginger:1474256772364632166> Gingerbread Cookie:** \`${config.FOOD_PRICES.GINGERBREAD_COOKIE} WL each\`\n` +
                    `• **<:tart:1474257527574368352> Coconut Tart:** \`${config.FOOD_PRICES.COCONUT_TART} WL each\`\n\n` +
                    `**<:growCoins:1465654842184827046> Tip:** Include your food sales to get complete earnings overview!`
                )
        );

        // Main Role Select Menu - Enhanced descriptions
        const mainRoleSelect = new StringSelectMenuBuilder()
            .setCustomId(`jar_main_role_select_${context.user?.id || context.author?.id}`)
            .setPlaceholder('Select your role to start calculation...')
            .addOptions([
                {
                    label: 'Owner',
                    description: `Highest multiplier (×${config.SEED_SETTINGS.MULTIPLIERS.OWNER}) - Maximum seed rewards per jar`,
                    value: 'owner',
                    emoji: '<a:1st:1463545533678489681>'
                },
                {
                    label: 'Weekly Admin',
                    description: `Special multiplier (×${config.SEED_SETTINGS.MULTIPLIERS.WEEKLY_ADMIN}) - Enhanced weekly bonus rate`,
                    value: 'weekly_admin',
                    emoji: '<a:2nd:1463545559137910815>'
                },
                {
                    label: 'Admin',
                    description: `Standard multiplier (×${config.SEED_SETTINGS.MULTIPLIERS.ADMIN}) - Regular admin calculation rate`,
                    value: 'admin',
                    emoji: '<a:3rd:1463545507497509043>'
                }
            ]);

        jarContainer.addActionRowComponents(new ActionRowBuilder().addComponents(mainRoleSelect));

        // Statistics
        const totalCalculations = await this.getTotalCalculations(context.client);
        jarContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `## 📈 **Statistics**\n` +
                    `• **Total Calculations:** \`${totalCalculations}\`\n` +
                    `• **Active Users:** \`${context.guild?.memberCount || 'N/A'}\`\n` +
                    `• **Last Updated:** <t:${Math.floor(Date.now()/1000)}:R>\n\n` +
                    `-# 🔄 Data updates in real-time • Created By wendos`
                )
        );

        const replyOptions = { 
            components: [jarContainer],
            flags: MessageFlags.IsComponentsV2
        };

        if (method === 'reply') {
            return context.reply(replyOptions);
        } else if (method === 'update') {
            return context.update(replyOptions);
        } else if (method === 'edit') {
            return context.editReply(replyOptions);
        }
    },

    async getTotalCalculations(client) {
        try {
            const totalCalcKey = 'total_jar_calculations';
            const total = await client.seedDatabase.get(totalCalcKey);
            return Number(total) || 0;
        } catch (error) {
            return 0;
        }
    },

    async checkCooldownAndLimits(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const now = Date.now();
        
        try {
            // Cooldown kontrolü
            const cooldownKey = `jar_cooldown_${guildId}_${userId}`;
            const lastUsage = await interaction.client.seedDatabase.get(cooldownKey);
            
            if (lastUsage) {
                const timeDiff = now - lastUsage;
                const cooldownMs = config.SEED_SETTINGS.LIMITS.COOLDOWN_MINUTES * 60 * 1000;
                
                if (timeDiff < cooldownMs) {
                    const remainingMs = cooldownMs - timeDiff;
                    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
                    
                    return {
                        allowed: false,
                        message: `⏱️ **Cooldown Active**\nYou must wait **${remainingMinutes} more minutes** before using the jar calculator again.\n\n*Cooldown helps maintain bot performance and prevents spam.*`
                    };
                }
            }
            
            // Günlük limit kontrolü
            const today = new Date().toDateString();
            const dailyKey = `jar_daily_${guildId}_${userId}_${today}`;
            const dailyUsage = await interaction.client.seedDatabase.get(dailyKey) || 0;
            
            if (dailyUsage >= config.SEED_SETTINGS.LIMITS.DAILY_JAR_LIMIT) {
                return {
                    allowed: false,
                    message: `📊 **Daily Limit Reached**\nYou have reached your daily limit of **${config.SEED_SETTINGS.LIMITS.DAILY_JAR_LIMIT}** jar calculations.\n\n*Limit resets at midnight UTC.*`
                };
            }
            
            // Haftalık limit kontrolü
            const weekStart = this.getWeekStart();
            const weeklyKey = `jar_weekly_${guildId}_${userId}_${weekStart}`;
            const weeklyUsage = await interaction.client.seedDatabase.get(weeklyKey) || 0;
            
            if (weeklyUsage >= config.SEED_SETTINGS.LIMITS.WEEKLY_JAR_LIMIT) {
                return {
                    allowed: false,
                    message: `📅 **Weekly Limit Reached**\nYou have reached your weekly limit of **${config.SEED_SETTINGS.LIMITS.WEEKLY_JAR_LIMIT}** jar calculations.\n\n*Limit resets every Monday at midnight UTC.*`
                };
            }
            
            // Kullanım sayaçlarını güncelle
            await interaction.client.seedDatabase.set(cooldownKey, now);
            await interaction.client.seedDatabase.set(dailyKey, dailyUsage + 1);
            await interaction.client.seedDatabase.set(weeklyKey, weeklyUsage + 1);
            
            return { allowed: true };
            
        } catch (error) {
            console.log('Cooldown check error:', error);
            return { allowed: true }; // Hata durumunda izin ver
        }
    },

    getWeekStart() {
        const now = new Date();
        const dayOfWeek = now.getUTCDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(now);
        monday.setUTCDate(now.getUTCDate() - daysToMonday);
        monday.setUTCHours(0, 0, 0, 0);
        return monday.toISOString().split('T')[0];
    },

    async handleAdminAction(interaction) {
        // Sadece adminler ve owner kullanabilir
        const isOwner = config.OWNER_ID.includes(interaction.user.id);
        const isAdmin = interaction.member?.roles.cache.has(config.ADMIN_ROLE);
        const isWeeklyAdmin = interaction.member?.roles.cache.has(config.WEEKLY_ADMIN_ROLE);
        const isWorldAdmin = interaction.member?.roles.cache.has(config.WORLD_ADMIN_ROLE);

        if (!isOwner && !isAdmin && !isWeeklyAdmin && !isWorldAdmin) {
            return interaction.reply({ 
                content: '❌ Bu işlemi sadece adminler yapabilir!', 
                ephemeral: true 
            });
        }

        const actionType = interaction.customId.split('_')[1]; // approve, reject, review
        const targetUserId = interaction.customId.split('_')[2];
        const calculationId = interaction.customId.split('_')[3];

        let actionEmoji, actionText, actionColor;
        switch (actionType) {
            case 'approve':
                actionEmoji = '✅';
                actionText = 'Approved';
                actionColor = '#00ff00';
                break;
            case 'reject':
                actionEmoji = '❌';
                actionText = 'Rejected';
                actionColor = '#ff0000';
                break;
            case 'review':
                actionEmoji = '🔍';
                actionText = 'Under Review';
                actionColor = '#ffaa00';
                break;
        }

        // Update the original message with admin action
        const updatedContainer = new ContainerBuilder();
        
        // Get original message content and add admin action
        const originalContent = interaction.message.components[0].components[0].data.content || '';
        
        updatedContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(originalContent)
        );

        // Add admin action section
        updatedContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `## ${actionEmoji} **Admin Action**\n` +
                    `**Status:** ${actionText}\n` +
                    `**Reviewed by:** ${interaction.user.displayName}\n` +
                    `**Action taken:** <t:${Math.floor(Date.now()/1000)}:F>`
                )
        );

        // Disabled buttons to show action was taken
        const disabledButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('disabled_approve')
                    .setLabel('✅ Approved')
                    .setStyle(actionType === 'approve' ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('disabled_reject')
                    .setLabel('❌ Rejected')
                    .setStyle(actionType === 'reject' ? ButtonStyle.Danger : ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('disabled_review')
                    .setLabel('🔍 Under Review')
                    .setStyle(actionType === 'review' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(true)
            );

        updatedContainer.addActionRowComponents(disabledButtons);

        // Footer with action info
        updatedContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `-# 📊 Calculation ID: ${calculationId} • ${actionEmoji} ${actionText} by ${interaction.user.displayName}\n` +
                    `-# 🔧 Advanced Jar Calculator Log • Created By wendos`
                )
        );

        await interaction.update({ 
            components: [updatedContainer],
            flags: MessageFlags.IsComponentsV2
        });

        // Send confirmation to admin
        return interaction.followUp({ 
            content: `${actionEmoji} **Action Completed**\nCalculation has been marked as **${actionText.toLowerCase()}**.`, 
            ephemeral: true 
        });
    },

    async handleInteraction(interaction) {
        // Main select menu handler - Direct role selection
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('jar_main_role_select_')) {
            const selectedRole = interaction.values[0];
            const userId = interaction.user.id;

            // Cooldown ve limit kontrolü
            const cooldownCheck = await this.checkCooldownAndLimits(interaction);
            if (!cooldownCheck.allowed) {
                return interaction.reply({ 
                    content: cooldownCheck.message, 
                    ephemeral: true 
                });
            }

            // Determine calculation rate based on selected role and config
            let multiplier, roleName, roleEmoji;

            switch (selectedRole) {
                case 'owner':
                    multiplier = config.SEED_SETTINGS.MULTIPLIERS.OWNER;
                    roleName = 'Owner';
                    roleEmoji = '<a:1st:1463545533678489681>';
                    break;
                case 'weekly_admin':
                    multiplier = config.SEED_SETTINGS.MULTIPLIERS.WEEKLY_ADMIN;
                    roleName = 'Weekly Admin';
                    roleEmoji = '<a:2nd:1463545559137910815>';
                    break;
                case 'admin':
                    multiplier = config.SEED_SETTINGS.MULTIPLIERS.ADMIN;
                    roleName = 'Admin';
                    roleEmoji = '<a:3rd:1463545507497509043>';
                    break;
                default:
                    return interaction.reply({ content: '❌ Invalid role selection!', ephemeral: true });
            }

            // Advanced Modal - Jar + Food input
            const advancedModal = new ModalBuilder()
                .setCustomId(`jar_advanced_modal_${userId}_${selectedRole}_${multiplier}`)
                .setTitle(`Jar Calculator - ${roleName}`);

            advancedModal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('jar_amount')
                        .setLabel('Jar Amount')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder('Example: 1000')
                        .setMinLength(1)
                        .setMaxLength(10)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('gingerbread_sales')
                        .setLabel('Gingerbread Cookie Sales (quantity)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                        .setPlaceholder('Example: 5 (optional)')
                        .setMaxLength(5)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('coconut_sales')
                        .setLabel('Coconut Tart Sales (quantity)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                        .setPlaceholder('Example: 3 (optional)')
                        .setMaxLength(5)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('notes')
                        .setLabel('Notes (optional)')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(false)
                        .setPlaceholder('Additional information, special circumstances, etc.')
                        .setMaxLength(200)
                )
            );

            return interaction.showModal(advancedModal);
        }

        // Admin action buttons for log entries
        if (interaction.isButton() && (interaction.customId.startsWith('jar_approve_') || 
                                       interaction.customId.startsWith('jar_reject_') ||
                                       interaction.customId.startsWith('jar_review_'))) {
            return this.handleAdminAction(interaction);
        }

        // Advanced Modal Submit Handler
        if (interaction.type === 5 && interaction.customId.startsWith('jar_advanced_modal_')) {
            const [, , , userId, selectedRole, multiplier] = interaction.customId.split('_');
            const jarAmount = parseInt(interaction.fields.getTextInputValue('jar_amount'));
            const gingerbreadSales = parseInt(interaction.fields.getTextInputValue('gingerbread_sales') || '0');
            const coconutSales = parseInt(interaction.fields.getTextInputValue('coconut_sales') || '0');
            const notes = interaction.fields.getTextInputValue('notes') || '';

            // Validation
            if (isNaN(jarAmount) || jarAmount <= 0) {
                return interaction.reply({ content: '❌ Please enter a valid jar amount!', ephemeral: true });
            }

            // Calculations with tax
            const seedAmount = Math.floor((jarAmount / 200) * parseInt(multiplier));
            const gingerbreadEarnings = gingerbreadSales * config.FOOD_PRICES.GINGERBREAD_COOKIE;
            const coconutEarnings = coconutSales * config.FOOD_PRICES.COCONUT_TART;
            const totalFoodEarnings = gingerbreadEarnings + coconutEarnings;
            
            // Tax calculation
            const taxAmount = Math.floor(totalFoodEarnings * config.SEED_SETTINGS.TAX.FOOD_TAX_PERCENTAGE / 100);
            const netFoodEarnings = totalFoodEarnings - taxAmount;

            // Get role information
            let roleName, roleEmoji;
            switch (selectedRole) {
                case 'owner': roleName = 'Owner'; roleEmoji = '👑'; break;
                case 'weekly_admin': roleName = 'Weekly Admin'; roleEmoji = '⭐'; break;
                case 'admin': roleName = 'Admin'; roleEmoji = '🛡️'; break;
            }

            // Advanced Result Container
            const resultContainer = new ContainerBuilder();

            resultContainer.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `# ✅ **Calculation Complete**\n\n` +
                        `**👤 User:** ${interaction.user.displayName}\n` +
                        `**${roleEmoji} Role:** ${roleName}\n` +
                        `**🕒 Date:** <t:${Math.floor(Date.now()/1000)}:F>`
                    )
            );

            resultContainer.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `## 🏺 **Jar Calculation**\n` +
                        `**Jar Contributed:** \`${jarAmount.toLocaleString()}\`\n` +
                        `**Seed Reward:** \`${seedAmount.toLocaleString()}\`\n` +
                        `**Formula:** ${jarAmount.toLocaleString()} ÷ 200 × ${multiplier} = ${seedAmount.toLocaleString()}`
                    )
            );

            if (gingerbreadSales > 0 || coconutSales > 0) {
                resultContainer.addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `## <:gingerbread:1477303161319460997> **Food Sales**\n` +
                            `**<:gingerbread:1477303161319460997> Gingerbread Cookie:** ${gingerbreadSales} units × ${config.FOOD_PRICES.GINGERBREAD_COOKIE} WL = \`${gingerbreadEarnings} WL\`\n` +
                            `**<:coconut:1477303161319460997> Coconut Tart:** ${coconutSales} units × ${config.FOOD_PRICES.COCONUT_TART} WL = \`${coconutEarnings} WL\`\n` +
                            `**Gross Food Earnings:** \`${totalFoodEarnings} WL\`\n` +
                            `**Tax (${config.SEED_SETTINGS.TAX.FOOD_TAX_PERCENTAGE}%):** \`-${taxAmount} WL\`\n` +
                            `**Net Food Earnings:** \`${netFoodEarnings} WL\``
                        )
                );
            }

            if (notes) {
                resultContainer.addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`## 📝 **Notes**\n${notes}`)
                );
            }

            // Increment total calculation counter
            try {
                const totalCalcKey = 'total_jar_calculations';
                let currentTotal = await interaction.client.seedDatabase.get(totalCalcKey);
                currentTotal = Number(currentTotal) || 0;
                const newTotal = currentTotal + 1;
                await interaction.client.seedDatabase.set(totalCalcKey, newTotal);

                resultContainer.addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`-# 📊 This is calculation #${newTotal} • Created By wendos`)
                );
            } catch (error) {
                console.log('Database error:', error);
            }

            // Send advanced embed to log channel with Components v2
            try {
                const logChannel = interaction.guild.channels.cache.get(config.JAR_LOG_CHANNEL);
                if (logChannel) {
                    // Create enhanced log container with Components v2
                    const logContainer = new ContainerBuilder();

                    // Main calculation info
                    logContainer.addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
                                `# <:jar:1477303161319460997> **Advanced Jar Calculator - New Calculation**\n\n` +
                                `**<:growCoins:1465654842184827046> Calculation Summary**\n` +
                                `**User:** ${interaction.user.displayName} (${interaction.user.tag})\n` +
                                `**${roleEmoji} Role:** ${roleName}\n` +
                                `**<:jar:1477303161319460997> Jar Contributed:** \`${jarAmount.toLocaleString()}\`\n` +
                                `**<:xp:1477303161319460997> Seed Reward:** \`${seedAmount.toLocaleString()}\`\n` +
                                `**📊 Formula:** ${jarAmount.toLocaleString()} ÷ 200 × ${multiplier} = ${seedAmount.toLocaleString()}`
                            )
                    );

                    // Food sales section (if any)
                    if (gingerbreadSales > 0 || coconutSales > 0) {
                        logContainer.addTextDisplayComponents(
                            new TextDisplayBuilder()
                                .setContent(
                                    `## <:gingerbread:1477303161319460997> **Food Sales Details**\n` +
                                    `**<:gingerbread:1477303161319460997> Gingerbread Cookie:** ${gingerbreadSales} units × ${config.FOOD_PRICES.GINGERBREAD_COOKIE} WL = \`${gingerbreadEarnings} WL\`\n` +
                                    `**<:coconut:1477303161319460997> Coconut Tart:** ${coconutSales} units × ${config.FOOD_PRICES.COCONUT_TART} WL = \`${coconutEarnings} WL\`\n\n` +
                                    `**<:shinybgl:1465654905032282256> Financial Summary:**\n` +
                                    `• Gross Food Earnings: \`${totalFoodEarnings} WL\`\n` +
                                    `• Tax Applied (${config.SEED_SETTINGS.TAX.FOOD_TAX_PERCENTAGE}%): \`-${taxAmount} WL\`\n` +
                                    `• **Net Food Earnings: \`${netFoodEarnings} WL\`**`
                                )
                        );
                    }

                    // Notes section (if any)
                    if (notes) {
                        logContainer.addTextDisplayComponents(
                            new TextDisplayBuilder()
                                .setContent(`## 📝 **Additional Notes**\n${notes}`)
                        );
                    }

                    // Admin action buttons
                    const adminButtons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`jar_approve_${interaction.user.id}_${Date.now()}`)
                                .setLabel('✅ Approve')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('✅'),
                            new ButtonBuilder()
                                .setCustomId(`jar_reject_${interaction.user.id}_${Date.now()}`)
                                .setLabel('❌ Reject')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('❌'),
                            new ButtonBuilder()
                                .setCustomId(`jar_review_${interaction.user.id}_${Date.now()}`)
                                .setLabel('🔍 Review')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🔍')
                        );

                    logContainer.addActionRowComponents(adminButtons);

                    // Footer info
                    logContainer.addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
                                `-# 📊 Calculation ID: ${Date.now()} • <t:${Math.floor(Date.now()/1000)}:F>\n` +
                                `-# 🔧 Advanced Jar Calculator Log • Created By wendos`
                            )
                    );

                    await logChannel.send({ 
                        components: [logContainer],
                        flags: MessageFlags.IsComponentsV2
                    });
                }
            } catch (error) {
                console.log('Log channel error:', error.message);
            }

            // Send result as ephemeral
            await interaction.reply({ 
                components: [resultContainer],
                flags: MessageFlags.IsComponentsV2,
                ephemeral: true
            });

            // Reset the original select menu after modal submission
            setTimeout(async () => {
                try {
                    // Find the original message and reset the select menu
                    const originalMessage = await interaction.channel.messages.fetch({ limit: 50 });
                    const jarCalcMessage = originalMessage.find(msg => 
                        msg.author.id === interaction.client.user.id && 
                        msg.components.length > 0 &&
                        msg.components[0].components.some(comp => comp.customId?.includes('jar_main_role_select'))
                    );
                    
                    if (jarCalcMessage) {
                        // Create fresh panel to reset select menu
                        const freshContainer = new ContainerBuilder();
                        
                        // Recreate the panel content
                        freshContainer.addTextDisplayComponents(
                            new TextDisplayBuilder()
                                .setContent(
                                    `# <:jars:1478071672593711296> **Advanced Jar Calculator**\n` +
                                    `**Advanced seed calculator with jar contributions and food sales tracking**\n\n` +
                                    `**<a:byebye:1463545740713394368> Welcome!**\n` +
                                    `Calculate your seed rewards based on jar contributions and track your food sales earnings.`
                                )
                        );

                        freshContainer.addTextDisplayComponents(
                            new TextDisplayBuilder()
                                .setContent(
                                    `## <:Scroll_Bulletin:1463546439828508783> **How It Works**\n` +
                                    `This calculator helps you determine seed rewards based on your role and jar contributions. Simply select your role below and enter your jar amount along with any food sales you've made.\n\n` +
                                    `**<:jarseed:1478071704726278357> Seed Formula:** Your Jar Amount ÷ 200 × Role Multiplier\n` +
                                    `**<:tart:1474257527574368352> Food Sales:** Track Gingerbread Cookie and Coconut Tart sales for additional WL earnings\n` +
                                    `**<a:871826redrose:1472252293628952626> Auto Logging:** All calculations are automatically logged for admin review`
                                )
                        );

                        freshContainer.addTextDisplayComponents(
                            new TextDisplayBuilder()
                                .setContent(
                                    `## <:worldlock:1458975566769160263> **Food Prices**\n` +
                                    `• **<:ginger:1474256772364632166> Gingerbread Cookie:** \`${config.FOOD_PRICES.GINGERBREAD_COOKIE} WL each\`\n` +
                                    `• **<:tart:1474257527574368352> Coconut Tart:** \`${config.FOOD_PRICES.COCONUT_TART} WL each\`\n\n` +
                                    `**<:growCoins:1465654842184827046> Tip:** Include your food sales to get complete earnings overview!`
                                )
                        );

                        // Fresh select menu
                        const freshRoleSelect = new StringSelectMenuBuilder()
                            .setCustomId(`jar_main_role_select_${Date.now()}`)
                            .setPlaceholder('Select your role to start calculation...')
                            .addOptions([
                                {
                                    label: 'Owner',
                                    description: 'Highest multiplier (×50) - Maximum seed rewards per jar',
                                    value: 'owner',
                                    emoji: '<a:1st:1463545533678489681>'
                                },
                                {
                                    label: 'Weekly Admin',
                                    description: 'Special multiplier (×42) - Enhanced weekly bonus rate',
                                    value: 'weekly_admin',
                                    emoji: '<a:2nd:1463545559137910815>'
                                },
                                {
                                    label: 'Admin',
                                    description: 'Standard multiplier (×40) - Regular admin calculation rate',
                                    value: 'admin',
                                    emoji: '<a:3rd:1463545507497509043>'
                                }
                            ]);

                        freshContainer.addActionRowComponents(new ActionRowBuilder().addComponents(freshRoleSelect));

                        const totalCalculations = await this.getTotalCalculations(interaction.client);
                        freshContainer.addTextDisplayComponents(
                            new TextDisplayBuilder()
                                .setContent(
                                    `## 📈 **Statistics**\n` +
                                    `• **Total Calculations:** \`${totalCalculations}\`\n` +
                                    `• **Active Users:** \`${interaction.guild?.memberCount || 'N/A'}\`\n` +
                                    `• **Last Updated:** <t:${Math.floor(Date.now()/1000)}:R>\n\n` +
                                    `-# 🔄 Data updates in real-time • Created By wendos`
                                )
                        );

                        await jarCalcMessage.edit({ 
                            components: [freshContainer],
                            flags: MessageFlags.IsComponentsV2
                        });
                    }
                } catch (error) {
                    console.log('Reset select menu error:', error.message);
                }
            }, 1000);

            return;
        }
    }
};