# 🧮 Calculator Bot

Selam! Ben **wendos** ve bu botu Discord sunucum için geliştirdim. Sunucumuzda level sistemi var ve sürekli "şu level'a kaç XP lazım?" diye hesap yapmaktan bıkmıştım. O yüzden bu botu yaptım ve artık herkes kolayca hesaplama yapabiliyor.

Bot sadece hesaplama yapmıyor, aynı zamanda en ucuz paket kombinasyonlarını buluyor, favorilerinizi kaydediyor ve geçmişinizi tutuyor. Sunucunuzda ekonomi sistemi varsa bu bot tam size göre!

## ✨ Neler Yapabiliyor?

### 🎯 Level Hesaplama Sistemi
Mevcut level'ınızı ve hedef level'ınızı giriyorsunuz, bot size:
- Kaç XP gerektiğini
- Hangi paketlerden kaç tane alacağınızı
- Toplam maliyeti
- En uygun 3 farklı stratejiyi gösteriyor

### 📊 Akıllı Strateji Önerileri
Bot size 3 farklı strateji sunuyor:
- **🥇 En Ucuz**: Paranızı en verimli şekilde kullanın
- **⚡ En Hızlı**: Büyük paketlerle hızlıca level atlayın
- **⚖️ Dengeli**: Fiyat ve hız arasında denge

### 🎨 Kullanıcı Dostu Arayüz
- **İlerleme Çubuğu**: Hedefinize ne kadar yakınsınız görsel olarak görebilirsiniz
- **Dropdown Menü**: Stratejiler arasında tek tıkla geçiş yapın
- **Renkli Butonlar**: Her şey düzenli ve anlaşılır
- **Kişisel Kontrol**: Sadece siz kendi hesaplamanızın butonlarına basabilirsiniz

### 🔖 Favori ve Geçmiş Sistemi
- Sık yaptığınız hesaplamaları favorilere kaydedin
- Son 5 hesaplamanızı görüntüleyin
- Favorilerinizi ve geçmişinizi istediğiniz zaman temizleyin

### 🌱 Admin Araçları
Sunucu yöneticileri için özel komutlar:
- **Seed Sistemi**: Kullanıcılara jar dağıtımı (rol bazlı çarpanlarla)
- **Jar Hesaplama**: Hızlı jar miktarı hesaplama
- **Cleanup**: Mesaj temizleme sistemi
- **Detaylı Loglar**: Tüm işlemler özel kanala loglanır

### 🔐 Güvenlik ve Yetkilendirme
- Rol bazlı yetki sistemi (Owner, Admin, Weekly Admin)
- Her kullanıcı sadece kendi butonlarına basabilir
- SQLite veritabanı ile güvenli veri saklama

## 🚀 Kurulum

Botu kurmak çok basit, adım adım anlatıyorum:

### 1️⃣ Ön Hazırlık

Önce bunların yüklü olması lazım:
- **Node.js** (v16.9.0 veya üzeri) - [İndir](https://nodejs.org/)
- **npm** (Node.js ile birlikte gelir)
- **Discord Bot** oluşturmuş olmanız gerekiyor

### 2️⃣ Discord Bot Oluşturma

1. [Discord Developer Portal](https://discord.com/developers/applications)'a gidin
2. "New Application" butonuna tıklayın
3. Botunuza bir isim verin
4. Sol menüden "Bot" sekmesine gidin
5. "Add Bot" butonuna tıklayın
6. **TOKEN**'ı kopyalayın (bunu sonra kullanacağız)
7. Aşağıdaki ayarları açın:
   - `Presence Intent`
   - `Server Members Intent`
   - `Message Content Intent`

### 3️⃣ Botu Sunucuya Ekleyin

1. Sol menüden "OAuth2" > "URL Generator" sekmesine gidin
2. **SCOPES** bölümünden şunları seçin:
   - `bot`
   - `applications.commands`
3. **BOT PERMISSIONS** bölümünden şunları seçin:
   - `Send Messages`
   - `Embed Links`
   - `Read Message History`
   - `Use Slash Commands`
   - `Manage Messages` (cleanup komutu için)
4. Alttaki URL'yi kopyalayıp tarayıcıya yapıştırın
5. Botunuzu sunucunuza ekleyin

### 4️⃣ Projeyi İndirin

```bash
git clone <repository-url>
cd calculator-bot
```

### 5️⃣ Gerekli Paketleri Yükleyin

```bash
npm install
```

Bu komut şu paketleri yükleyecek:
- `discord.js` - Discord API için
- `quick.db` - Veritabanı için
- `better-sqlite3` - SQLite için

### 6️⃣ Config Dosyasını Ayarlayın

```bash
# Windows için
copy config.example.js config.js

# Linux/Mac için
cp config.example.js config.js
```

Şimdi `config.js` dosyasını açın ve şunları doldurun:

**Zorunlu Ayarlar:**
- `token`: Discord bot tokeniniz (2. adımda kopyaladığınız)
- `clientId`: Bot Application ID (Developer Portal'dan alın)
- `guildId`: Sunucu ID'niz (Sunucuya sağ tıklayıp "Copy Server ID")
- `OWNER_ID`: Kendi kullanıcı ID'niz (Profilinize sağ tıklayıp "Copy User ID")

**Kanal ve Rol ID'leri:**
- `CALCULATOR_CHANNEL_ID`: Calculator komutunun kullanılacağı kanal
- `JAR_LOG_CHANNEL`: İşlem loglarının gideceği kanal
- `ADMIN_ROLE`: Admin rolünüzün ID'si
- `WORLD_ADMIN_ROLE`: Üst düzey admin rolü ID'si
- `WEEKLY_ADMIN_ROLE`: Haftalık admin rolü ID'si

**Not:** ID'leri görebilmek için Discord'da Developer Mode'u açmanız gerekiyor:
`Ayarlar` > `Gelişmiş` > `Geliştirici Modu` ✅

### 7️⃣ Slash Komutlarını Yükleyin

```bash
# Sadece kendi sunucunuza yüklemek için (önerilir, anında aktif olur)
node deploy-guild-commands.js

# VEYA tüm sunuculara yüklemek için (1 saate kadar sürebilir)
node deploy-commands.js
```

### 8️⃣ Botu Başlatın

```bash
# Windows için
start.bat

# Linux/Mac için
./start.sh

# veya direkt
node index.js
```

Bot çalışıyorsa konsolda şöyle bir mesaj göreceksiniz:
```
Ready! Logged in as BotunuzunAdı#1234
```

🎉 **Tebrikler!** Botunuz artık çalışıyor. Sunucunuzda `/calculator` yazarak test edebilirsiniz.

## 📝 Komutlar ve Kullanım

### 🧮 `/calculator` - Herkes Kullanabilir

Level hesaplama komutumuz. Kullanımı çok basit:

1. `/calculator` yazın
2. **Mevcut Level**: Şu anki level'ınızı girin (örn: 50)
3. **Hedef Level**: Ulaşmak istediğiniz level'ı girin (örn: 100)
4. Enter'a basın!

Bot size şöyle bir panel gösterecek:

```
🧮 Level Hesaplama Sonuçları

📊 Mevcut Durum
├─ Mevcut Level: 50
├─ Hedef Level: 100
└─ Gereken XP: 2,450,000

[████████░░░░] 65%
XP Required: 2,450,000

🥇 En Ucuz Strateji
├─ 🎁 Supreme (1M XP): 2 adet
├─ 🎁 Huge (500K XP): 0 adet
├─ 🎁 Big (250K XP): 1 adet
├─ 🎁 Small (125K XP): 1 adet
└─ 💰 Toplam: 9,800 jar
```

**Butonlar:**
- `◀️ Önceki` / `▶️ Sonraki`: Stratejiler arasında geçiş
- `🔖 Save`: Bu stratejiyi favorilere kaydet
- `📊 History`: Son hesaplamalarınızı görün
- `🔖 My Favorites`: Kaydettiğiniz stratejileri görün

**Dropdown Menü:**
Stratejiler arasında hızlıca geçiş yapmak için dropdown menüyü kullanabilirsiniz.

### 🌱 `/seed-settings` - Sadece Adminler

Seed sisteminin ayarlarını gösterir. Hangi rollerin ne kadar çarpanı olduğunu, limitleri ve cooldown sürelerini görebilirsiniz.

### 🏺 `/jar-calc` - Sadece Adminler

Hızlı jar hesaplama yapar. Seed miktarını giriyorsunuz, bot size kaç jar edeceğini söylüyor.

### 🧹 `/cleanup` - Sadece Adminler

Belirli bir kullanıcının mesajlarını temizler. Kanal düzenlemek için kullanışlı.

**Kullanım:**
```
/cleanup user:@kullanıcı amount:50
```

## ⚙️ Özelleştirme

Botu kendi sunucunuza göre özelleştirebilirsiniz. `config.js` dosyasında şunları değiştirebilirsiniz:

### 💰 XP Paket Fiyatları

Sunucunuzdaki XP paketlerinin fiyatlarını buradan ayarlayın:

```javascript
"XP_PACK_PRICES": {
    "SMALL_125K": 700,   // 125,000 XP paketi = 700 jar
    "BIG_250K": 1100,    // 250,000 XP paketi = 1,100 jar
    "HUGE_500K": 1600,   // 500,000 XP paketi = 1,600 jar
    "SUPREME_1M": 3000   // 1,000,000 XP paketi = 3,000 jar
}
```

Bu fiyatları sunucunuzdaki gerçek fiyatlara göre ayarlayın. Bot bu fiyatlara göre en uygun kombinasyonları hesaplayacak.

### 🌱 Seed Sistemi

Admin ve owner'ların seed dağıtımı için ayarlar:

```javascript
"SEED_SETTINGS": {
    "MULTIPLIERS": {
        "OWNER": 50,         // Owner 1 seed = 50 jar
        "WEEKLY_ADMIN": 42,  // Weekly Admin 1 seed = 42 jar
        "ADMIN": 40          // Admin 1 seed = 40 jar
    },
    "LIMITS": {
        "DAILY_JAR_LIMIT": 50000,    // Günde max 50,000 jar dağıtılabilir
        "WEEKLY_JAR_LIMIT": 500000,  // Haftada max 500,000 jar dağıtılabilir
        "COOLDOWN_MINUTES": 2        // Komutlar arası 2 dakika bekleme
    },
    "TAX": {
        "FOOD_TAX_PERCENTAGE": 30    // Yemek alımlarında %30 vergi
    }
}
```

### 🍪 Yemek Fiyatları

Eğer sunucunuzda yemek sistemi varsa:

```javascript
"FOOD_PRICES": {
    "GINGERBREAD_COOKIE": 100,  // Zencefilli kurabiye = 100 jar
    "COCONUT_TART": 100          // Hindistan cevizli tart = 100 jar
}
```

## 💡 İpuçları ve Püf Noktaları

### 🎯 Strateji Seçimi

**En Ucuz Strateji 🥇**
- Paranızı en verimli şekilde kullanmak istiyorsanız
- Acele etmiyorsanız ve en az jar harcamak istiyorsanız
- Genelde küçük paketleri daha fazla kullanır

**En Hızlı Strateji ⚡**
- Hızlıca level atlamak istiyorsanız
- Büyük paketleri tercih ediyorsanız
- Biraz daha pahalı ama daha az işlem

**Dengeli Strateji ⚖️**
- Fiyat ve hız arasında denge istiyorsanız
- Orta boy paketleri kullanır
- Çoğu kişi için ideal seçim

### 🔖 Favoriler Nasıl Kullanılır?

1. Bir hesaplama yaptınız ve beğendiniz
2. "🔖 Save" butonuna basın
3. Artık "🔖 My Favorites" butonundan hızlıca erişebilirsiniz
4. Örneğin: "50'den 100'e" hesaplamasını kaydettiyseniz, bir daha yapmaya gerek yok!

### 📊 Geçmiş Özelliği

- Son 5 hesaplamanız otomatik kaydedilir
- "📊 History" butonuna basarak görebilirsiniz
- Daha önce ne hesapladığınızı unuttuysanız buradan bakabilirsiniz
- İstemediğiniz zaman "🗑️ Clear History" ile temizleyebilirsiniz

### 🔐 Güvenlik

- Sadece siz kendi hesaplamanızın butonlarına basabilirsiniz
- Başkası basarsa "You need to use `/calculator` command yourself" uyarısı alır
- Bu sayede herkes kendi hesaplamasını rahatça yapabilir

## 💾 Veritabanı

Bot, SQLite veritabanı kullanıyor. Yani tüm veriler `json.sqlite` dosyasında saklanıyor:

- **Favoriler**: Hangi kullanıcı hangi hesaplamayı kaydetmiş
- **Geçmiş**: Son hesaplamalar
- **Seed Logları**: Kim ne zaman kaç seed dağıttı
- **Jar Bakiyeleri**: Kullanıcıların jar miktarları

**Not:** `json.sqlite` dosyasını silmeyin, yoksa tüm veriler gider! Yedek almayı unutmayın.

## 🔒 Güvenlik - ÇOK ÖNEMLİ!

**LÜTFEN OKUYUN:**

- ⚠️ **ASLA** `config.js` dosyanızı GitHub'a yüklemeyin!
- ⚠️ Bot tokeninizi kimseyle paylaşmayın! (Token = şifre gibi bir şey)
- ⚠️ Tokeniniz sızdıysa hemen [Developer Portal](https://discord.com/developers/applications)'dan "Regenerate" yapın
- ⚠️ `.gitignore` dosyasının `config.js`'i içerdiğinden emin olun (ben zaten ekledim)
- ✅ Sadece `config.example.js` dosyasını paylaşın
- ✅ GitHub'a yüklemeden önce `git status` ile kontrol edin

**Token sızdıysa ne olur?**
- Başkaları botunuzu kontrol edebilir
- Sunucularınıza zarar verebilirler
- Botunuz ban yiyebilir

**Güvende kalmak için:**
1. `config.js` dosyası `.gitignore`'da olmalı ✅
2. Token'ı kimseyle paylaşmayın ✅
3. Şüpheleniyorsanız token'ı yenileyin ✅

## ❓ Sorun Giderme

Sorun mu yaşıyorsunuz? Endişelenmeyin, çoğu sorun basit çözümlere sahip:

### 🔴 Bot çevrimiçi olmuyor

**Olası Sebepler:**
1. **Token yanlış**: `config.js` dosyasındaki token'ı kontrol edin
2. **Bot sunucuda değil**: Botu sunucunuza eklediniz mi?
3. **Intents kapalı**: Developer Portal'da şu intents'leri açın:
   - `Presence Intent`
   - `Server Members Intent`
   - `Message Content Intent`

**Çözüm:**
```bash
# Konsolu kontrol edin, hata mesajı var mı?
node index.js
```

Eğer `Invalid Token` hatası alıyorsanız, token'ı yeniden kopyalayın.

### 🔴 Slash komutları görünmüyor

**Olası Sebepler:**
1. Komutları deploy etmediniz
2. Bot'un `applications.commands` yetkisi yok
3. Henüz yüklenmedi (global komutlar 1 saate kadar sürebilir)

**Çözüm:**
```bash
# Önce guild komutlarını deneyin (anında aktif olur)
node deploy-guild-commands.js

# Çalışmazsa global deploy yapın
node deploy-commands.js
```

**Not:** Guild komutları (sunucu bazlı) anında aktif olur, global komutlar 1 saate kadar sürebilir. Test için guild komutlarını kullanın.

### 🔴 Butonlar çalışmıyor

**Olası Sebepler:**
1. Bot'un mesaj gönderme yetkisi yok
2. `events/interactionCreate.js` dosyası yüklenemiyor
3. Başkasının hesaplamasının butonlarına basıyorsunuz

**Çözüm:**
- Bot'a şu yetkileri verin:
  - `Send Messages`
  - `Embed Links`
  - `Use External Emojis`
- Konsolu kontrol edin, hata var mı?
- Kendi `/calculator` komutunuzu kullanın

### 🔴 "You need to use `/calculator` command yourself" hatası

Bu hata değil, özellik! Sadece kendi hesaplamanızın butonlarına basabilirsiniz. Başkasının hesaplamasına müdahale edemezsiniz.

**Çözüm:** Kendi `/calculator` komutunuzu kullanın.

### 🔴 İlerleme çubuğu bozuk görünüyor

**Olası Sebep:** Custom emoji'ler sunucunuzda yok.

**Çözüm:** `calculator.js` dosyasındaki emoji ID'lerini kendi sunucunuzdaki emoji'lere göre değiştirin:
```javascript
// Dolu emoji'ler
<:b1:YOUR_EMOJI_ID>
<:b2:YOUR_EMOJI_ID>
<:b3:YOUR_EMOJI_ID>

// Boş emoji'ler
<:e1:YOUR_EMOJI_ID>
<:e2:YOUR_EMOJI_ID>
<:e3:YOUR_EMOJI_ID>
```

### 🔴 Veritabanı hatası

**Olası Sebep:** `json.sqlite` dosyası bozulmuş veya silinmiş.

**Çözüm:**
1. Botu kapatın
2. `json.sqlite` dosyasını silin (yedek alın!)
3. Botu tekrar başlatın (otomatik yeni veritabanı oluşturur)

### 🔴 "Module not found" hatası

**Olası Sebep:** Paketler yüklenmemiş.

**Çözüm:**
```bash
# Tüm paketleri yeniden yükleyin
npm install

# Eğer hala sorun varsa
rm -rf node_modules
rm package-lock.json
npm install
```

### 💬 Hala Sorun mu Var?

Eğer sorununuz burada yoksa:
1. Konsoldaki hata mesajını okuyun (genelde ne yapmanız gerektiğini söyler)
2. `config.js` dosyanızı kontrol edin (tüm ID'ler doğru mu?)
3. Bot'un yetkilerini kontrol edin (yeterli izni var mı?)
4. Discord Developer Mode açık mı? (ID'leri görebilmek için gerekli)

**Hata mesajını Google'da aratın**, genelde çözümü bulursunuz!

## 🤝 Katkıda Bulunma

Bu projeyi geliştirmek isterseniz çekinmeyin! Her türlü katkı değerlidir:

**Nasıl katkıda bulunabilirsiniz?**

1. **Fork yapın** - Projeyi kendi hesabınıza kopyalayın
2. **Branch oluşturun** - Yeni özellik için branch açın
   ```bash
   git checkout -b feature/super-ozellik
   ```
3. **Değişiklik yapın** - Kodunuzu yazın, test edin
4. **Commit edin** - Açıklayıcı commit mesajı yazın
   ```bash
   git commit -m 'Yeni süper özellik eklendi'
   ```
5. **Push edin** - Branch'inizi GitHub'a gönderin
   ```bash
   git push origin feature/super-ozellik
   ```
6. **Pull Request açın** - Değişikliklerinizi gönderin

**Katkı Fikirleri:**
- 🐛 Bug düzeltmeleri
- ✨ Yeni özellikler
- 📝 Dokümantasyon iyileştirmeleri
- 🎨 Arayüz geliştirmeleri
- 🌍 Çeviri eklemeleri
- ⚡ Performans iyileştirmeleri

**Kod Standartları:**
- Temiz ve okunabilir kod yazın
- Yorum satırları ekleyin (özellikle karmaşık kısımlara)
- Değişikliklerinizi test edin
- Mevcut kod stiline uyun

## 📞 İletişim

Sorularınız, önerileriniz veya sorunlarınız için:

- **Discord**: wendos
- **GitHub Issues**: Bu repo'da issue açabilirsiniz
- **Pull Requests**: Katkılarınızı bekliyorum!

## 🙏 Teşekkürler

Bu botu kullandığınız için teşekkürler! Umarım sunucunuzda işinize yarar. Eğer beğendiyseniz GitHub'da ⭐ vermeyi unutmayın!

**Özel Teşekkürler:**
- Discord.js ekibine harika kütüphane için
- Botu kullanan ve geri bildirim veren herkese
- Katkıda bulunan geliştiricilere

## 📜 Değişiklik Geçmişi

### v1.0.0 (İlk Sürüm)
- ✅ Level hesaplama sistemi
- ✅ 3 farklı strateji (En Ucuz, En Hızlı, Dengeli)
- ✅ İlerleme çubuğu
- ✅ Dropdown menü ile strateji seçimi
- ✅ Favori kaydetme sistemi
- ✅ Hesaplama geçmişi (son 5)
- ✅ Kullanıcı bazlı buton kontrolü
- ✅ Seed dağıtım sistemi
- ✅ Jar hesaplama
- ✅ Cleanup komutu
- ✅ SQLite veritabanı entegrasyonu

## 🎯 Gelecek Planlar

Botun gelecek versiyonlarında eklenebilecek özellikler:

- [ ] Grafik ve istatistik sistemi
- [ ] Leaderboard (sıralama) sistemi
- [ ] Otomatik yedekleme sistemi
- [ ] Web dashboard
- [ ] Çoklu dil desteği
- [ ] Özel strateji oluşturma
- [ ] XP geçmişi takibi
- [ ] Bildirim sistemi

Öneriniz var mı? Issue açın veya Pull Request gönderin!

## 📄 Lisans

MIT License - Özgürce kullanabilir, değiştirebilir ve dağıtabilirsiniz.

**Bu ne demek?**
- ✅ Ticari kullanabilirsiniz
- ✅ Değiştirebilirsiniz
- ✅ Dağıtabilirsiniz
- ✅ Özel kullanabilirsiniz
- ⚠️ Garanti verilmez (kendi sorumluluğunuzda)
- ⚠️ Lisans ve telif hakkı bildirimini korumalısınız

---

<div align="center">

**⭐ Beğendiyseniz yıldız vermeyi unutmayın! ⭐**

Made with ❤️ by **wendos**

*"Hesap yapmaktan bıktım, bot yapsam mı?" diye başladı, buraya kadar geldi.*

</div>