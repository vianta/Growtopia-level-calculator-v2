// ============================================
// DISCORD BOT CONFIGURATION FILE
// ============================================
// This is an example configuration file.
// Copy this file to 'config.js' and fill in your actual values.

module.exports = {
    // ============================================
    // BOT AUTHENTICATION
    // ============================================
    
    // Your Discord bot token from https://discord.com/developers/applications
    // KEEP THIS SECRET! Never share or commit this to GitHub
    "token": "YOUR_BOT_TOKEN_HERE",
    
    // Bot command prefix (currently not used, but kept for future use)
    "prefix": ".",
    
    // Your bot's client ID (Application ID from Discord Developer Portal)
    "clientId": "YOUR_CLIENT_ID_HERE",
    
    // ============================================
    // SERVER CONFIGURATION
    // ============================================
    
    // Your Discord server (guild) ID where the bot will operate
    "guildId": "YOUR_GUILD_ID_HERE",
    
    // Channel ID where calculator command results will be sent
    "CALCULATOR_CHANNEL_ID": "YOUR_CALCULATOR_CHANNEL_ID",
    
    // ============================================
    // ROLE CONFIGURATION
    // ============================================
    
    // World Admin role ID (highest admin level)
    "WORLD_ADMIN_ROLE": "YOUR_WORLD_ADMIN_ROLE_ID",
    
    // Bot owner user IDs (array of user IDs with full bot permissions)
    "OWNER_ID": [
        "YOUR_USER_ID_HERE"
    ],
    
    // Regular admin role ID
    "ADMIN_ROLE": "YOUR_ADMIN_ROLE_ID",
    
    // Weekly admin role ID (temporary admin privileges)
    "WEEKLY_ADMIN_ROLE": "YOUR_WEEKLY_ADMIN_ROLE_ID",
    
    // ============================================
    // LOGGING CONFIGURATION
    // ============================================
    
    // Channel ID where jar/seed transaction logs will be sent
    "JAR_LOG_CHANNEL": "YOUR_JAR_LOG_CHANNEL_ID",
    
    // ============================================
    // ECONOMY SYSTEM - FOOD PRICES
    // ============================================
    
    // Prices for food items in the economy system (in jars)
    "FOOD_PRICES": {
        "GINGERBREAD_COOKIE": 100,  // GINGERBREAD_COOKIE fiyatı
        "COCONUT_TART": 100          // COCONUT_TART tart fiyatı
    },
    
    // ============================================
    // SEED SYSTEM SETTINGS
    // ============================================
    
    "SEED_SETTINGS": {
        // Seed multipliers for different role levels
        "MULTIPLIERS": {
            "OWNER": 50,         // Bot owner seed multiplier
            "WEEKLY_ADMIN": 42,  // Weekly admin seed multiplier
            "ADMIN": 40          // Regular admin seed multiplier
        },
        
        // Jar/seed limits and cooldowns
        "LIMITS": {
            "DAILY_JAR_LIMIT": 50000,      // Maximum jars that can be distributed per day
            "WEEKLY_JAR_LIMIT": 500000,    // Maximum jars that can be distributed per week
            "COOLDOWN_MINUTES": 2          // Cooldown between seed commands (in minutes)
        },
        
        // Tax settings
        "TAX": {
            "FOOD_TAX_PERCENTAGE": 30  // Tax percentage applied to food purchases
        }
    },
    
    // ============================================
    // XP PACK PRICES
    // ============================================
    
    // Prices for XP packs in the calculator system (in jars)
    "XP_PACK_PRICES": {
        "SMALL_125K": 700,   // 125,000 XP pack price
        "BIG_250K": 1100,    // 250,000 XP pack price
        "HUGE_500K": 1600,   // 500,000 XP pack price
        "SUPREME_1M": 3000   // 1,000,000 XP pack price
    }
};
