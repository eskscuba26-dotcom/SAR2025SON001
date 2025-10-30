# 📦 SAR AMBALAJ - KURULUM REHBERİ (Başka Bilgisayar İçin)

## 🎯 BU PAKET İÇERİĞİ

✅ **Backend** - FastAPI + Python  
✅ **Frontend** - React + Tailwind  
✅ **Veritabanı Yedekleri** - Tüm veriler  
✅ **PWA Desteği** - Telefona kurulabilir  
✅ **Mobil Uyumlu** - Tüm cihazlarda çalışır  

**Veriler:**
- 49 Üretim Kaydı
- 26 Günlük Tüketim
- 24 Sevkiyat
- 9 Hammadde Giriş
- 5 Kesilmiş Ürün
- 2 Kullanıcı
- 1 Döviz Kuru

---

## 🚀 KURULUM ADIMLARI

### 1️⃣ ÖN GEREKSINIMLER

Bilgisayarınızda şunlar kurulu olmalı:

#### **Python 3.9+**
**Kontrol:** `python --version` veya `python3 --version`

**Kurulum:**
- Windows: https://www.python.org/downloads/
- Mac: `brew install python3`
- Linux: `sudo apt-get install python3`

#### **Node.js 16+**
**Kontrol:** `node --version`

**Kurulum:**
- Tüm platformlar: https://nodejs.org/

#### **MongoDB**
**Kontrol:** `mongod --version`

**Kurulum:**
- Windows: https://www.mongodb.com/try/download/community
- Mac: `brew tap mongodb/brew && brew install mongodb-community`
- Linux: `sudo apt-get install mongodb`

#### **Git** (opsiyonel)
**Kontrol:** `git --version`

**Kurulum:**
- Tüm platformlar: https://git-scm.com/

---

### 2️⃣ DOSYALARI ÇIKARMA

**Windows:**
1. WinRAR veya 7-Zip ile `SAR-Ambalaj-COMPLETE.tar.gz` dosyasını açın
2. İçeriği istediğiniz klasöre çıkarın

**Mac/Linux:**
```bash
cd ~/Desktop
tar -xzf SAR-Ambalaj-COMPLETE.tar.gz
cd SAR-Ambalaj-COMPLETE
```

---

### 3️⃣ MONGODB BAŞLATMA

#### **Windows:**
```cmd
mongod
```
(Yeni bir command prompt penceresi açık kalmalı)

#### **Mac:**
```bash
brew services start mongodb-community
```

#### **Linux:**
```bash
sudo systemctl start mongod
```

**Kontrol:**
```bash
mongo
# MongoDB shell açılmalı
# Çıkmak için: exit
```

---

### 4️⃣ BACKEND KURULUM

```bash
cd backend

# Virtual environment oluştur (opsiyonel ama önerilen)
python -m venv venv

# Virtual environment'ı aktifleştir
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Gerekli paketleri kur
pip install -r requirements.txt
```

**Kurulum kontrol:**
```bash
pip list
# FastAPI, motor, pymongo, uvicorn vs. görmelisiniz
```

---

### 5️⃣ FRONTEND KURULUM

Yeni terminal/command prompt açın:

```bash
cd frontend

# Paketleri kur
npm install
# VEYA
yarn install
```

**Not:** İlk kurulum 2-5 dakika sürebilir.

---

### 6️⃣ VERITABANI VERİLERİNİ YÜKLEME

Backend klasöründe:

```bash
cd backend

# Tüm verileri yükle
bash load_all_original_data.sh

# VEYA Windows için:
python load_data.py
python load_additional_data.py
python ORIGINAL_USER_DATA.py
```

**Başarılı mesaj:**
```
✅ 49 üretim kaydı yüklendi!
✅ 24 sevkiyat kaydı yüklendi!
✅ 26 günlük tüketim kaydı yüklendi!
...
```

---

### 7️⃣ UYGULAMAYI ÇALIŞTIRMA

#### **Backend Başlatma:**

Terminal 1 (Backend):
```bash
cd backend
python server.py
# VEYA
uvicorn server:app --reload --port 8001
```

**Başarılı mesaj:**
```
INFO: Uvicorn running on http://0.0.0.0:8001
INFO: Application startup complete
```

#### **Frontend Başlatma:**

Terminal 2 (Frontend):
```bash
cd frontend
npm start
# VEYA
yarn start
```

**Başarılı mesaj:**
```
Compiled successfully!
Local: http://localhost:3000
```

---

### 8️⃣ UYGUMAYI AÇMA

Tarayıcınızda:
```
http://localhost:3000
```

**Giriş Bilgileri:**
- Kullanıcı Adı: **Mehmet**
- Şifre: **141413DOa.**

---

## 🎉 BAŞARILI! UYGULAMA ÇALIŞIYOR!

### Yapabilecekleriniz:

✅ Üretim kayıtları ekle/düzenle/sil  
✅ Hammadde girişi yap  
✅ Sevkiyat kayıtları  
✅ Günlük tüketim takibi  
✅ Kesilmiş ürün (ebatlama) - Otomatik hesaplama  
✅ Stok görünümü  
✅ Maliyet analizi  
✅ Excel'e aktarma  
✅ Kullanıcı yönetimi  

---

## 📱 TELEFONDA KULLANMA

### Aynı Ağdaysa:

1. Bilgisayarın IP adresini öğrenin:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` veya `ip addr`
   
2. Telefonda tarayıcıyı açın:
   ```
   http://[BILGISAYAR-IP]:3000
   ```
   Örnek: `http://192.168.1.100:3000`

### PWA Kurulum:

1. Tarayıcıda aç
2. **Ana ekrana ekle** seçeneği
3. Uygulama gibi kullan!

---

## ⚙️ YAPILANDIRMA

### Backend (.env dosyası)

`backend/.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
```

### Frontend (.env dosyası)

`frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

**Farklı port kullanmak isterseniz:**

Backend:
```bash
uvicorn server:app --reload --port 5000
```

Frontend .env'i güncelleyin:
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

---

## 🔧 SORUN GİDERME

### Backend başlamıyor:

```bash
# Port kullanımda mı?
# Windows:
netstat -ano | findstr :8001
# Mac/Linux:
lsof -i :8001

# Başka port kullan:
uvicorn server:app --reload --port 8002
```

### MongoDB bağlanmıyor:

```bash
# MongoDB çalışıyor mu?
# Windows:
tasklist | findstr mongod
# Mac/Linux:
ps aux | grep mongod

# Yeniden başlat:
# Mac:
brew services restart mongodb-community
# Linux:
sudo systemctl restart mongod
```

### Frontend açılmıyor:

```bash
# node_modules temizle, tekrar kur:
cd frontend
rm -rf node_modules
npm install
npm start
```

### Veriler görünmüyor:

```bash
cd backend
# Verileri tekrar yükle:
bash load_all_original_data.sh
```

---

## 📚 EK KAYNAKLAR

- **PWA Kurulum:** Bakınız `PWA_KURULUM.md`
- **Test Sonuçları:** Bakınız `test_result.md`
- **Ana README:** Bakınız `README.md`

---

## 🆘 DESTEK

Sorun yaşarsanız:

1. Logları kontrol edin
2. Port çakışması olabilir
3. MongoDB çalışıyor mu kontrol edin
4. Virtual environment aktif mi kontrol edin

---

## 🎊 İYİ KULANIMLAR!

**SAR Ambalaj Üretim Yönetim Sistemi**  
📱 Telefon | 💻 Bilgisayar | 📊 Tam Özellikli | 🚀 Hızlı
