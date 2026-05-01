const { ContainerBuilder, TextDisplayBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, InteractionType, ButtonBuilder, ButtonStyle, MessageFlags, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder } = require('discord.js');

// Premium System
const config = require('../../config.js');
const WORLD_ADMIN_ROLE = config.WORLD_ADMIN_ROLE;
const OWNER_ID = config.OWNER_ID[0];
const DAILY_LIMIT = 3; // Günlük limit



// Helper Functions
function calculateXPNeeded(startLevel, targetLevel, currentXP = 0) {
    let totalXp = 0;
    for (let l = startLevel; l < targetLevel; l++) {
        totalXp += 50 * (Math.pow(l, 2) + 2);
    }
    return Math.max(0, totalXp - currentXP);
}

function calculatePackDistribution(xpNeeded) {
    let tempXP = xpNeeded;
    let pack1M = 0, pack500k = 0, pack250k = 0, pack125k = 0;

    if (tempXP > 0) {
        pack1M = Math.floor(tempXP / 1000000);
        tempXP %= 1000000;
        pack500k = Math.floor(tempXP / 500000);
        tempXP %= 500000;
        pack250k = Math.floor(tempXP / 250000);
        tempXP %= 250000;
        pack125k = Math.ceil(tempXP / 125000);
    }

    return { pack1M, pack500k, pack250k, pack125k };
}

function calculateAllStrategies(xpNeeded) {
    const strategies = [];
    
    // Strategy 1: Sadece 1M paketler (Supreme)
    const s1_pack1M = Math.ceil(xpNeeded / 1000000);
    const s1_totalXP = s1_pack1M * 1000000;
    const s1_excess = s1_totalXP - xpNeeded;
    const s1_cost = calculateCost(s1_pack1M, 0, 0, 0);
    strategies.push({
        name: `${s1_pack1M}x Supreme Pack`,
        packs: { pack1M: s1_pack1M, pack500k: 0, pack250k: 0, pack125k: 0 },
        totalXP: s1_totalXP,
        excess: s1_excess,
        cost: s1_cost
    });
    
    // Strategy 2: Optimal mix (en ucuz)
    const { pack1M, pack500k, pack250k, pack125k } = calculatePackDistribution(xpNeeded);
    const s2_totalXP = (pack1M * 1000000) + (pack500k * 500000) + (pack250k * 250000) + (pack125k * 125000);
    const s2_excess = s2_totalXP - xpNeeded;
    const s2_cost = calculateCost(pack1M, pack500k, pack250k, pack125k);
    
    let packNames = [];
    if (pack1M > 0) packNames.push(`${pack1M}x Supreme`);
    if (pack500k > 0) packNames.push(`${pack500k}x Huge`);
    if (pack250k > 0) packNames.push(`${pack250k}x Big`);
    if (pack125k > 0) packNames.push(`${pack125k}x Small`);
    
    strategies.push({
        name: packNames.join(' + ') || '0 Packs',
        packs: { pack1M, pack500k, pack250k, pack125k },
        totalXP: s2_totalXP,
        excess: s2_excess,
        cost: s2_cost
    });
    
    // Strategy 3: Sadece 500k paketler (Huge)
    const s3_pack500k = Math.ceil(xpNeeded / 500000);
    const s3_totalXP = s3_pack500k * 500000;
    const s3_excess = s3_totalXP - xpNeeded;
    const s3_cost = calculateCost(0, s3_pack500k, 0, 0);
    strategies.push({
        name: `${s3_pack500k}x Huge Pack`,
        packs: { pack1M: 0, pack500k: s3_pack500k, pack250k: 0, pack125k: 0 },
        totalXP: s3_totalXP,
        excess: s3_excess,
        cost: s3_cost
    });
    
    // Strategy 4: Sadece 125k paketler (Small)
    const s4_pack125k = Math.ceil(xpNeeded / 125000);
    const s4_totalXP = s4_pack125k * 125000;
    const s4_excess = s4_totalXP - xpNeeded;
    const s4_cost = calculateCost(0, 0, 0, s4_pack125k);
    strategies.push({
        name: `${s4_pack125k}x Small Pack`,
        packs: { pack1M: 0, pack500k: 0, pack250k: 0, pack125k: s4_pack125k },
        totalXP: s4_totalXP,
        excess: s4_excess,
        cost: s4_cost
    });
    
    return strategies;
}

function calculateCost(pack1M, pack500k, pack250k, pack125k) {
    const prices = config.XP_PACK_PRICES;
    const totalWls = (pack1M * prices.SUPREME_1M) + (pack500k * prices.HUGE_500K) + (pack250k * prices.BIG_250K) + (pack125k * prices.SMALL_125K);
    const bgl = Math.floor(totalWls / 10000);
    const dl = Math.floor((totalWls % 10000) / 100);
    const wl = totalWls % 100;
    return { totalWls, bgl, dl, wl };
}

// Premium Check
async function checkPremiumAccess(context) {
    const userId = context.user.id;
    const guildId = context.guildId || context.guild?.id;
    const db = context.client.seedDatabase;

    // Owner ve World Admin sınırsız erişim
    if (userId === OWNER_ID) return { allowed: true, unlimited: true };
    if (context.member && context.member.roles.cache.has(WORLD_ADMIN_ROLE)) return { allowed: true, unlimited: true };

    // Premium kullanıcılar sınırsız erişim
    const premiumKey = `premium_user_${guildId}_${userId}`;
    if (db.get(premiumKey)) return { allowed: true, unlimited: true };

    // Normal üyeler günlük limit
    const today = new Date().toDateString();
    const key = `calc_usage_${guildId}_${userId}_${today}`;
    const usage = db.get(key) || 0;

    if (usage >= DAILY_LIMIT) {
        return { allowed: false, unlimited: false, usage, limit: DAILY_LIMIT };
    }

    // Kullanım sayısını artır
    db.set(key, usage + 1);

    return { allowed: true, unlimited: false, usage: usage + 1, limit: DAILY_LIMIT };
}

// Favori stratejileri kaydetme
async function saveFavoriteStrategy(db, userId, guildId, strategy) {
    const key = `favorite_strategy_${guildId}_${userId}`;
    await db.set(key, {
        name: strategy.name,
        packs: strategy.packs,
        cost: strategy.cost,
        savedAt: Date.now()
    });
}

async function getFavoriteStrategy(db, userId, guildId) {
    const key = `favorite_strategy_${guildId}_${userId}`;
    return await db.get(key);
}

// Geçmiş hesaplamaları kaydetme
async function saveCalculationHistory(db, userId, guildId, calculation) {
    const key = `calc_history_${guildId}_${userId}`;
    let history = await db.get(key) || [];
    
    // Son 5 hesaplamayı tut
    history.unshift({
        ...calculation,
        timestamp: Date.now()
    });
    
    if (history.length > 5) {
        history = history.slice(0, 5);
    }
    
    await db.set(key, history);
}

async function getCalculationHistory(db, userId, guildId) {
    const key = `calc_history_${guildId}_${userId}`;
    return await db.get(key) || [];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calculator')
        .setDescription('XP Calculator - Calculate level progression costs and requirements'),
    name: 'calculator',
    description: 'Direct XP Calculator - Opens calculation form immediately',
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
            // Premium Check
            const premiumCheck = await checkPremiumAccess({ 
                user: interaction.user, 
                guild: interaction.guild, 
                member: interaction.member,
                client: interaction.client,
                guildId: interaction.guildId
            });

            if (!premiumCheck.allowed) {
                const limitEmbed = new EmbedBuilder()
                    .setTitle('❌ Daily Limit Reached')
                    .setColor('#ff0000')
                    .setDescription(`> You have reached your daily limit of **${premiumCheck.limit}** calculations.`)
                    .addFields(
                        { 
                            name: '💎 Get Premium Access', 
                            value: '> Contact **World Admins** or **Owners** to get unlimited access!\n> Premium users get unlimited calculations and priority support.', 
                            inline: false 
                        },
                        { 
                            name: '⏰ Reset Time', 
                            value: `> Your limit resets at **00:00 UTC**\n> Next reset: <t:${Math.floor((new Date().setUTCHours(24,0,0,0))/1000)}:R>\n> Used today: **${premiumCheck.usage}/${premiumCheck.limit}**`, 
                            inline: false 
                        }
                    )
                    .setFooter({ text: 'SeriLevel Service • Created By wendos' })
                    .setTimestamp();

                return interaction.reply({ embeds: [limitEmbed], ephemeral: true });
            }

            // Direkt modal aç
            const modal = new ModalBuilder()
                .setCustomId(`calc_modal_${interaction.user.id}_${Date.now()}`)
                .setTitle('🧮 Level Calculator');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('currentLvl')
                        .setLabel('Current Level')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder('Current Level (Min: 1)')
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('targetLvl')
                        .setLabel('Target Level')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder('Target Level (Max: 125)')
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('currentXP')
                        .setLabel('Current XP (Optional)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                        .setPlaceholder('0')
                )
            );

            return interaction.showModal(modal);
        }
    },

    // Prefix command handler (backward compatibility)
    async executeMessage(message) {
        // Kanal kontrolü - sadece belirli kanalda çalışır
        if (message.channelId !== config.CALCULATOR_CHANNEL_ID) {
            return message.reply(`❌ This command can only be used in <#${config.CALCULATOR_CHANNEL_ID}>`);
        }

        // Premium Check
        const premiumCheck = await checkPremiumAccess({ 
            user: message.author, 
            guild: message.guild, 
            member: message.member,
            client: message.client 
        });

        if (!premiumCheck.allowed) {
            const limitEmbed = new EmbedBuilder()
                .setTitle('❌ Daily Limit Reached')
                .setColor('#ff0000')
                .setDescription(`> You have reached your daily limit of **${premiumCheck.limit}** calculations.`)
                .addFields(
                    { 
                        name: '💎 Get Premium Access', 
                        value: '> Contact **World Admins** or **Owners** to get unlimited access!\n> Premium users get unlimited calculations and priority support.', 
                        inline: false 
                    },
                    { 
                        name: '⏰ Reset Time', 
                        value: `> Your limit resets at **00:00 UTC**\n> Next reset: <t:${Math.floor((new Date().setUTCHours(24,0,0,0))/1000)}:R>\n> Used today: **${premiumCheck.usage}/${premiumCheck.limit}**`, 
                        inline: false 
                    }
                )
                .setFooter({ text: 'SeriLevel Service • Created By wendos' })
                .setTimestamp();

            return message.reply({ embeds: [limitEmbed] });
        }

        // Calculator embed - görüntüdeki gibi temiz tasarım
        const calculatorEmbed = new EmbedBuilder()
            .setTitle('🧮 Level Calculator')
            .setDescription('**Calculate XP requirements and costs for level progression**')
            .addFields(
                { 
                    name: '📦 XP Pack Prices', 
                    value: `**Small Pack:** \`125,000 XP\` → \`${config.XP_PACK_PRICES.SMALL_125K} WL\`\n**Big Pack:** \`250,000 XP\` → \`${config.XP_PACK_PRICES.BIG_250K} WL\`\n**Huge Pack:** \`500,000 XP\` → \`${config.XP_PACK_PRICES.HUGE_500K} WL\`\n**Supreme Pack:** \`1,000,000 XP\` → \`${config.XP_PACK_PRICES.SUPREME_1M} WL\``, 
                    inline: false 
                },
                {
                    name: '⚡ Your Status',
                    value: premiumCheck.unlimited ? 
                        '✅ **Premium Access** - Unlimited calculations' : 
                        `📊 **Usage Today:** ${premiumCheck.usage || 1}/${premiumCheck.limit}\n💎 **Upgrade:** Contact admins for unlimited access`,
                    inline: false
                }
            )
            .setFooter({ 
                text: `Calculator ready • Click button to start • Created By wendos` 
            })
            .setTimestamp()
            .setColor('#5865F2');

        // Calculator başlatma butonu + History butonu
        const startButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`open_calc_${message.author.id}`)
                    .setLabel('🚀 Open Calculator')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`calc_history_${message.author.id}`)
                    .setLabel('📊 History')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Normal bot mesajı gönder
        return message.reply({ 
            embeds: [calculatorEmbed], 
            components: [startButtons] 
        });
    },

    async handleInteraction(interaction) {
        // Calculator button handler - User kontrolü
        if (interaction.isButton() && interaction.customId.startsWith('open_calc_')) {
            const userId = interaction.customId.split('_')[2];
            if (interaction.user.id !== userId) {
                return interaction.reply({ 
                    content: '❌ **Access Denied!**\nYou need to use `/calculator` command yourself to access this feature.', 
                    ephemeral: true 
                });
            }
            const modal = new ModalBuilder()
                .setCustomId(`calc_modal_${interaction.user.id}_${Date.now()}`)
                .setTitle('🧮 Level Calculator');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('currentLvl')
                        .setLabel('Current Level')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder('Current Level (Min: 1)')
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('targetLvl')
                        .setLabel('Target Level')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder('Target Level (Max: 125)')
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('currentXP')
                        .setLabel('Current XP (Optional)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                        .setPlaceholder('0')
                )
            );

            return interaction.showModal(modal).catch(() => {});
        }

        // Calculate Modal Submit Handler
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith('calc_modal_')) {
            const curLvl = parseInt(interaction.fields.getTextInputValue('currentLvl'));
            const tarLvl = parseInt(interaction.fields.getTextInputValue('targetLvl'));
            const curXP = parseInt(interaction.fields.getTextInputValue('currentXP') || '0');

            // Validation
            if (isNaN(curLvl) || curLvl < 1 || curLvl > 125) {
                return interaction.reply({ content: '❌ Current Level must be between 1-125!', ephemeral: true });
            }

            if (isNaN(tarLvl) || tarLvl < 1 || tarLvl > 125) {
                return interaction.reply({ content: '❌ Target Level must be between 1-125!', ephemeral: true });
            }

            if (tarLvl <= curLvl) {
                return interaction.reply({ content: '❌ Target Level must be higher than Current Level!', ephemeral: true });
            }

            if (isNaN(curXP) || curXP < 0) {
                return interaction.reply({ content: '❌ Current XP cannot be negative!', ephemeral: true });
            }

            // Calculations
            const totalXpNeeded = calculateXPNeeded(curLvl, tarLvl, curXP);
            const strategies = calculateAllStrategies(totalXpNeeded);
            const levelDiff = tarLvl - curLvl;
            const estimatedMinutes = Math.ceil((totalXpNeeded / 1000000) * 30);

            // Geçmişe kaydet
            await saveCalculationHistory(interaction.client.seedDatabase, interaction.user.id, interaction.guildId, {
                curLvl, tarLvl, levelDiff, totalXpNeeded, estimatedMinutes
            });

            // Total calculator sayacını artır
            const totalCalcKey = 'total_calculator_usage';
            let currentTotal;
            try {
                currentTotal = await interaction.client.seedDatabase.get(totalCalcKey);
                currentTotal = Number(currentTotal) || 0;
            } catch (error) {
                console.log('Database get error:', error);
                currentTotal = 0;
            }
            const newTotal = currentTotal + 1;
            await interaction.client.seedDatabase.set(totalCalcKey, newTotal);

            // İlk stratejiyi göster - Components v2 ile çubuksuz!
            const strategy = strategies[0];
            const resContainer = createStrategyContainer(strategy, 0, strategies.length, curLvl, tarLvl, levelDiff, totalXpNeeded, estimatedMinutes, interaction.guild, newTotal);

            // Stratejileri database'e kaydet
            const calcId = `calc_${interaction.user.id}_${Date.now()}`;
            await interaction.client.seedDatabase.set(calcId, {
                curLvl,
                tarLvl,
                levelDiff,
                totalXpNeeded,
                strategies,
                estimatedMinutes,
                currentPage: 0
            });

            // Select Menu for strategy selection (ÖNCE)
            resContainer.addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`calc_strategy_${calcId}`)
                            .setPlaceholder('Select Strategy')
                            .addOptions(
                                strategies.map((strat, index) => ({
                                    label: `Strategy ${index + 1}: ${strat.name}`,
                                    description: `${strat.cost.totalWls.toLocaleString()} WL`,
                                    value: index.toString(),
                                    default: index === 0
                                }))
                            )
                    )
            );

            // Navigation butonları (SONRA)
            resContainer.addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`calc_prev_${calcId}`)
                            .setLabel('◀ Prev')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(`calc_page_${calcId}`)
                            .setLabel('1/4')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(`calc_next_${calcId}`)
                            .setLabel('Next ▶')
                            .setStyle(strategies.length <= 1 ? ButtonStyle.Danger : ButtonStyle.Success)
                            .setDisabled(strategies.length <= 1),
                        new ButtonBuilder()
                            .setCustomId(`calc_favorite_${calcId}`)
                            .setLabel('🔖 Save')
                            .setStyle(ButtonStyle.Secondary)
                    )
            );

            await interaction.reply({ 
                components: [resContainer], 
                flags: MessageFlags.IsComponentsV2,
                ephemeral: false 
            }).catch(() => {});
            
            return;
        }

        // Navigation Buttons - User kontrolü
        if (interaction.isButton() && (interaction.customId.startsWith('calc_prev_') || interaction.customId.startsWith('calc_next_'))) {
            const calcId = interaction.customId.split('_').slice(2).join('_');
            const calcData = await interaction.client.seedDatabase.get(calcId);

            if (!calcData) {
                return interaction.reply({ content: '❌ Calculation data not found!', ephemeral: true });
            }

            // User ID kontrolü - calcId'den user ID'yi çıkar
            const calcUserId = calcId.split('_')[1];
            if (interaction.user.id !== calcUserId) {
                return interaction.reply({ 
                    content: '❌ **Access Denied!**\nYou can only interact with your own calculations. Use `/calculator` command yourself.', 
                    ephemeral: true 
                });
            }

            const direction = interaction.customId.startsWith('calc_prev_') ? -1 : 1;
            calcData.currentPage = Math.max(0, Math.min(calcData.strategies.length - 1, calcData.currentPage + direction));
            await interaction.client.seedDatabase.set(calcId, calcData);

            const strategy = calcData.strategies[calcData.currentPage];
            
            // Total calculator sayacını al
            const totalCalcKey = 'total_calculator_usage';
            let currentTotal;
            try {
                currentTotal = await interaction.client.seedDatabase.get(totalCalcKey);
                currentTotal = Number(currentTotal) || 0;
            } catch (error) {
                console.log('Database get error:', error);
                currentTotal = 0;
            }
            
            const resContainer = createStrategyContainer(
                strategy, 
                calcData.currentPage, 
                calcData.strategies.length, 
                calcData.curLvl, 
                calcData.tarLvl, 
                calcData.levelDiff, 
                calcData.totalXpNeeded, 
                calcData.estimatedMinutes,
                interaction.guild,
                currentTotal
            );

            // Select Menu for strategy selection (ÖNCE)
            resContainer.addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`calc_strategy_${calcId}`)
                            .setPlaceholder('Select Strategy')
                            .addOptions(
                                calcData.strategies.map((strat, index) => ({
                                    label: `Strategy ${index + 1}: ${strat.name}`,
                                    description: `${strat.cost.totalWls.toLocaleString()} WL`,
                                    value: index.toString(),
                                    default: index === calcData.currentPage
                                }))
                            )
                    )
            );

            // Navigation butonları (SONRA)
            resContainer.addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`calc_prev_${calcId}`)
                            .setLabel('◀ Prev')
                            .setStyle(calcData.currentPage === 0 ? ButtonStyle.Danger : ButtonStyle.Success)
                            .setDisabled(calcData.currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId(`calc_page_${calcId}`)
                            .setLabel(`${calcData.currentPage + 1}/${calcData.strategies.length}`)
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(`calc_next_${calcId}`)
                            .setLabel('Next ▶')
                            .setStyle(calcData.currentPage === calcData.strategies.length - 1 ? ButtonStyle.Danger : ButtonStyle.Success)
                            .setDisabled(calcData.currentPage === calcData.strategies.length - 1)
                    )
            );

            await interaction.update({ 
                components: [resContainer],
                flags: MessageFlags.IsComponentsV2 
            }).catch(() => {});
            
            return;
        }

        // Select Menu Navigation - User kontrolü
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('calc_strategy_')) {
            const calcId = interaction.customId.split('_').slice(2).join('_');
            const calcData = await interaction.client.seedDatabase.get(calcId);

            if (!calcData) {
                return interaction.reply({ content: '❌ Calculation data not found!', ephemeral: true });
            }

            // User ID kontrolü - calcId'den user ID'yi çıkar
            const calcUserId = calcId.split('_')[1];
            if (interaction.user.id !== calcUserId) {
                return interaction.reply({ 
                    content: '❌ **Access Denied!**\nYou can only interact with your own calculations. Use `/calculator` command yourself.', 
                    ephemeral: true 
                });
            }

            const selectedPage = parseInt(interaction.values[0]);
            calcData.currentPage = selectedPage;
            await interaction.client.seedDatabase.set(calcId, calcData);

            const strategy = calcData.strategies[calcData.currentPage];
            
            const resContainer = createStrategyContainer(
                strategy, 
                calcData.currentPage, 
                calcData.strategies.length, 
                calcData.curLvl, 
                calcData.tarLvl, 
                calcData.levelDiff, 
                calcData.totalXpNeeded, 
                calcData.estimatedMinutes,
                interaction.guild,
                0
            );

            // Select Menu for strategy selection (ÖNCE)
            resContainer.addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`calc_strategy_${calcId}`)
                            .setPlaceholder('Select Strategy')
                            .addOptions(
                                calcData.strategies.map((strat, index) => ({
                                    label: `Strategy ${index + 1}: ${strat.name}`,
                                    description: `${strat.cost.totalWls.toLocaleString()} WL`,
                                    value: index.toString(),
                                    default: index === calcData.currentPage
                                }))
                            )
                    )
            );

            // Navigation butonları (SONRA)
            resContainer.addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`calc_prev_${calcId}`)
                            .setLabel('◀ Prev')
                            .setStyle(calcData.currentPage === 0 ? ButtonStyle.Danger : ButtonStyle.Success)
                            .setDisabled(calcData.currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId(`calc_page_${calcId}`)
                            .setLabel(`${calcData.currentPage + 1}/${calcData.strategies.length}`)
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId(`calc_next_${calcId}`)
                            .setLabel('Next ▶')
                            .setStyle(calcData.currentPage === calcData.strategies.length - 1 ? ButtonStyle.Danger : ButtonStyle.Success)
                            .setDisabled(calcData.currentPage === calcData.strategies.length - 1)
                    )
            );

            await interaction.update({ 
                components: [resContainer],
                flags: MessageFlags.IsComponentsV2 
            }).catch(() => {});
            
            return;
        }

        // History butonu - User kontrolü
        if (interaction.isButton() && interaction.customId.startsWith('calc_history_')) {
            const userId = interaction.customId.split('_')[2];
            if (interaction.user.id !== userId) {
                return interaction.reply({ 
                    content: '❌ **Access Denied!**\nYou need to use `/calculator` command yourself to access this feature.', 
                    ephemeral: true 
                });
            }

            const history = await getCalculationHistory(interaction.client.seedDatabase, interaction.user.id, interaction.guildId);
            
            if (history.length === 0) {
                return interaction.reply({ 
                    content: '📊 **No calculation history found!**\nMake some calculations first to see your history.', 
                    ephemeral: true 
                });
            }

            const historyEmbed = new EmbedBuilder()
                .setTitle('📊 Your Calculation History')
                .setColor('#5865F2')
                .setDescription('**Last 5 calculations:**')
                .setFooter({ text: 'Calculator • History' })
                .setTimestamp();

            history.forEach((calc, index) => {
                const date = new Date(calc.timestamp).toLocaleDateString('tr-TR');
                historyEmbed.addFields({
                    name: `${index + 1}. ${calc.curLvl} → ${calc.tarLvl} (${calc.levelDiff} levels)`,
                    value: `**XP:** ${calc.totalXpNeeded.toLocaleString()}\n**Date:** ${date}`,
                    inline: true
                });
            });

            const historyButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`calc_favorites_${interaction.user.id}`)
                        .setLabel('🔖 My Favorites')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`calc_clear_history_${interaction.user.id}`)
                        .setLabel('🗑️ Clear History')
                        .setStyle(ButtonStyle.Danger)
                );

            return interaction.reply({ 
                embeds: [historyEmbed], 
                components: [historyButtons],
                ephemeral: true 
            });
        }

        // Favori kaydetme butonu - User kontrolü
        if (interaction.isButton() && interaction.customId.startsWith('calc_favorite_')) {
            const calcId = interaction.customId.split('_').slice(2).join('_');
            const calcData = await interaction.client.seedDatabase.get(calcId);

            if (!calcData) {
                return interaction.reply({ content: '❌ Calculation data not found!', ephemeral: true });
            }

            // User ID kontrolü - calcId'den user ID'yi çıkar
            const calcUserId = calcId.split('_')[1];
            if (interaction.user.id !== calcUserId) {
                return interaction.reply({ 
                    content: '❌ **Access Denied!**\nYou can only save your own calculations. Use `/calculator` command yourself.', 
                    ephemeral: true 
                });
            }

            const strategy = calcData.strategies[calcData.currentPage];
            await saveFavoriteStrategy(interaction.client.seedDatabase, interaction.user.id, interaction.guildId, strategy);

            // Favori kaydedildikten sonra butonlar
            const favoriteEmbed = new EmbedBuilder()
                .setTitle('🔖 Favorite Saved!')
                .setColor('#00ff88')
                .setDescription(`Strategy "${strategy.name}" has been saved to your favorites.`)
                .addFields({
                    name: '💰 Cost',
                    value: `${strategy.cost.totalWls.toLocaleString()} WL`,
                    inline: true
                })
                .setFooter({ text: 'Calculator • Favorite Saved' })
                .setTimestamp();

            const favoriteButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`calc_history_${interaction.user.id}`)
                        .setLabel('📊 View History')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`calc_favorites_${interaction.user.id}`)
                        .setLabel('🔖 My Favorites')
                        .setStyle(ButtonStyle.Success)
                );

            return interaction.reply({ 
                embeds: [favoriteEmbed],
                components: [favoriteButtons],
                ephemeral: true 
            });
        }

        // Favorilerim butonu - User kontrolü
        if (interaction.isButton() && interaction.customId.startsWith('calc_favorites_')) {
            const userId = interaction.customId.split('_')[2];
            if (interaction.user.id !== userId) {
                return interaction.reply({ 
                    content: '❌ **Access Denied!**\nYou need to use `/calculator` command yourself to access this feature.', 
                    ephemeral: true 
                });
            }

            const favorite = await getFavoriteStrategy(interaction.client.seedDatabase, interaction.user.id, interaction.guildId);
            
            if (!favorite) {
                return interaction.reply({ 
                    content: '🔖 **No favorites found!**\nSave some strategies first to see your favorites.', 
                    ephemeral: true 
                });
            }

            const favoriteEmbed = new EmbedBuilder()
                .setTitle('🔖 Your Favorite Strategy')
                .setColor('#00ff88')
                .setDescription(`**${favorite.name}**`)
                .addFields(
                    {
                        name: '� Cost',
                        value: `${favorite.cost.totalWls.toLocaleString()} WL`,
                        inline: true
                    },
                    {
                        name: '📅 Saved',
                        value: new Date(favorite.savedAt).toLocaleDateString('tr-TR'),
                        inline: true
                    }
                )
                .setFooter({ text: 'Calculator • Your Favorites' })
                .setTimestamp();

            const favoriteButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`calc_history_${interaction.user.id}`)
                        .setLabel('📊 View History')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`calc_clear_favorites_${interaction.user.id}`)
                        .setLabel('🗑️ Clear Favorites')
                        .setStyle(ButtonStyle.Danger)
                );

            return interaction.reply({ 
                embeds: [favoriteEmbed], 
                components: [favoriteButtons],
                ephemeral: true 
            });
        }

        // History temizleme butonu
        if (interaction.isButton() && interaction.customId.startsWith('calc_clear_history_')) {
            const userId = interaction.customId.split('_')[3];
            if (interaction.user.id !== userId) {
                return interaction.reply({ 
                    content: '❌ **Access Denied!**\nYou need to use `/calculator` command yourself to access this feature.', 
                    ephemeral: true 
                });
            }

            const key = `calc_history_${interaction.guildId}_${interaction.user.id}`;
            await interaction.client.seedDatabase.delete(key);

            return interaction.reply({ 
                content: '🗑️ **History Cleared!**\nYour calculation history has been deleted.', 
                ephemeral: true 
            });
        }

        // Favorites temizleme butonu
        if (interaction.isButton() && interaction.customId.startsWith('calc_clear_favorites_')) {
            const userId = interaction.customId.split('_')[3];
            if (interaction.user.id !== userId) {
                return interaction.reply({ 
                    content: '❌ **Access Denied!**\nYou need to use `/calculator` command yourself to access this feature.', 
                    ephemeral: true 
                });
            }

            const key = `favorite_strategy_${interaction.guildId}_${interaction.user.id}`;
            await interaction.client.seedDatabase.delete(key);

            return interaction.reply({ 
                content: '🗑️ **Favorites Cleared!**\nYour favorite strategies have been deleted.', 
                ephemeral: true 
            });
        }
    }
};

function createStrategyContainer(strategy, page, totalPages, curLvl, tarLvl, levelDiff, totalXpNeeded, estimatedMinutes, guild, totalCalculations = 0) {
    // Ensure totalCalculations is a number, not a Promise
    const safeTotal = typeof totalCalculations === 'object' ? 0 : Number(totalCalculations) || 0;
    
    const { bgl, dl, wl } = strategy.cost;

    // Yemek hesaplaması: Her 30 dakika = 1 yemek, 100 WL
    const foodCount = Math.ceil(estimatedMinutes / 30);
    const foodCost = foodCount * 100;
    const foodBgl = Math.floor(foodCost / 10000);
    const foodDl = Math.floor((foodCost % 10000) / 100);
    const foodWl = foodCost % 100;

    // Toplam maliyet (XP paketleri + yemek)
    const totalCostWls = strategy.cost.totalWls + foodCost;
    const totalBgl = Math.floor(totalCostWls / 10000);
    const totalDl = Math.floor((totalCostWls % 10000) / 100);
    const totalWl = totalCostWls % 100;

    // Progress bar calculation - 3 segments kısa bar + yüzde
    const progressPercentage = Math.min(100, (levelDiff / 124) * 100); // Max level is 125
    const progressSegments = Math.min(3, Math.max(0, Math.ceil(levelDiff / 40))); // Her 40 level için 1 segment
    
    // BAR EMOJİLERİ - User's custom emojis
    const DOLU_EMOJI_1 = '<:b1:1466939516966146130>';
    const DOLU_EMOJI_2 = '<:b2:1466939513472553030>';
    const DOLU_EMOJI_3 = '<:b3:1466939506048635183>';
    const BOS_EMOJI_1 = '<:e3:1466939515204538418>';
    const BOS_EMOJI_2 = '<:e2:1466939518920687729>';
    const BOS_EMOJI_3 = '<:e1:1466939521324290304>';
    
    // Progress bar construction - 3 segments kısa bar
    let progressBar = '';
    for (let i = 0; i < 4; i++) {
        if (i < progressSegments) {
            // Dolu barlar
            if (i === 0) progressBar += DOLU_EMOJI_1;
            else if (i === 1) progressBar += DOLU_EMOJI_2;
            else if (i === 2) progressBar += DOLU_EMOJI_2;
            else if (i === 3) progressBar += DOLU_EMOJI_3;
        } else {
            // Boş barlar
            if (i === 0) progressBar += BOS_EMOJI_1;
            else if (i === 1) progressBar += BOS_EMOJI_2;
            else if (i === 2) progressBar += BOS_EMOJI_2;
            else if (i === 3) progressBar += BOS_EMOJI_3;
        }
    }

    const container = new ContainerBuilder();

    // Tüm içeriği tek bir text display'de birleştir - minimum boşluk + progress bar eklendi
    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                `# **Level Calculator <:xp:1477303161319460997>**\n` +
                `**Level Progress:** \n\`${curLvl}\` ➜ \`${tarLvl}\`\n-# Gap: \`${levelDiff}\` Levels\n` +
                `${progressBar} **${progressPercentage.toFixed(1)}%**\n\n` +
                `**XP Required:** <a:871826redrose:1472252293628952626> \`\`\`ansi\n\u001b[0;31m${totalXpNeeded.toLocaleString()} XP\u001b[0m\n\`\`\`\n` +
                `** # Pack Recommendations <:589016whitesakuraflower:1472252284808462436>**\n` +
                `**Option ${page + 1} of ${totalPages}: ${strategy.name}**\nTime: ${estimatedMinutes} min\nExcess: +${strategy.excess.toLocaleString()} XP\n\n` +
                `<a:398576flowers:1466378374359548082> **Price:** ${totalBgl > 0 ? `${totalBgl} <a:shinybgl:1465654905032282256> ` : ''}${totalDl > 0 ? `${totalDl} <a:shinydl:1465654940872478804> ` : ''}${totalWl > 0 ? `${totalWl} <:worldlock:1458975566769160263>` : '0 <:worldlock:1458975566769160263>'}\n` +
                `-# Total calculator results sent: ${safeTotal} • ${new Date().getDate().toString().padStart(2, '0')}.${(new Date().getMonth() + 1).toString().padStart(2, '0')}.${new Date().getFullYear()} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
            )
    );

    return container;
}
