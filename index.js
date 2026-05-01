const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');
const { QuickDB } = require('quick.db');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences // Presence verilerini almak için gerekli
    ]
});

client.commands = new Collection();
client.calculatorDatabase = new QuickDB(); // Calculator için database
client.seedDatabase = new QuickDB(); // Seed database (calculator için)

// Komut Yükleyici
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
    const commandFolders = fs.readdirSync(foldersPath);
    
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        if (fs.statSync(commandsPath).isDirectory()) {
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                
                // Slash command (has data property) or legacy command (has name property)
                if (('data' in command && 'execute' in command) || ('name' in command && 'execute' in command)) {
                    const commandName = command.data?.name || command.name;
                    client.commands.set(commandName, command);
                    console.log(`✅ Command loaded: ${commandName}`);
                } else {
                    console.log(`⚠️ The command at ${filePath} is missing required properties.`);
                }
            }
        }
    }
}

// Event Yükleyici
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`✅ Event loaded: ${event.name}`);
    }
}

// Komut Handler
client.on('messageCreate', async message => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        // Eğer komutun executeMessage fonksiyonu varsa onu kullan (backward compatibility)
        if (command.executeMessage) {
            await command.executeMessage(message, args);
        } else if (command.execute) {
            await command.execute(message, args);
        }
    } catch (error) {
        console.error(`Command error (${commandName}):`, error);
        message.reply('❌ An error occurred while executing this command!');
    }
});

// Bot Ready Event
client.once('clientReady', async () => {
    console.log(`✅ ${client.user.tag} is active!`);
    console.log(`🧮 Calculator Bot ready! Prefix: ${config.prefix}`);
    
    // Bot durumunu ayarla - DND status ile online üye sayısı
    const updateStatus = async () => {
        try {
            const guild = client.guilds.cache.get(config.guildId);
            if (guild) {
                // Tüm üyeleri fetch et (presence bilgileri için)
                await guild.members.fetch();
                
                // Online üye sayısını hesapla (online, idle, dnd)
                const onlineMembers = guild.members.cache.filter(member => {
                    if (member.user.bot) return false; // Bot'ları sayma
                    const status = member.presence?.status;
                    return status === 'online' || status === 'idle' || status === 'dnd';
                }).size;
                
                // Toplam üye sayısı (bot olmayan)
                const totalMembers = guild.members.cache.filter(member => !member.user.bot).size;
                
                // Status'u güncelle
                client.user.setPresence({
                    activities: [{
                        name: `${onlineMembers}/${totalMembers} members online`,
                        type: 3 // WATCHING
                    }],
                    status: 'dnd' // Do Not Disturb
                });
                
                console.log(`🔴 Status updated: DND - Watching ${onlineMembers}/${totalMembers} members online`);
            } else {
                // Guild bulunamazsa varsayılan status
                client.user.setPresence({
                    activities: [{
                        name: 'Created By wendos',
                        type: 1, // STREAMING
                        url: 'https://twitch.tv/wendos'
                    }],
                    status: 'dnd'
                });
                console.log('🔴 Status set: DND - Streaming "Created By wendos"');
            }
        } catch (error) {
            console.log('Status update error:', error.message);
            // Hata durumunda varsayılan status
            client.user.setPresence({
                activities: [{
                    name: 'Created By wendos',
                    type: 1,
                    url: 'https://twitch.tv/wendos'
                }],
                status: 'dnd'
            });
        }
    };
    
    // İlk status güncellemesi
    await updateStatus();
    
    // Her 5 dakikada bir status'u güncelle
    setInterval(updateStatus, 5 * 60 * 1000); // 5 dakika
});

// Error Handler
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Bot'u başlat
client.login(config.token);