# SAR AMBALAJ ÜRETİM YÖNETİM SİSTEMİ

## 🎯 HIZLI BAŞLANGIÇ

### Sistemi Başlatmak İçin:

```bash
# 1. Backend ve Frontend'i başlat
sudo supervisorctl restart all

# 2. Tüm verileri yükle
cd /app/backend
bash load_all_data.sh
```

## 📊 SİSTEM BİLGİLERİ

### Giriş Bilgileri:
- **Kullanıcı Adı:** Mehmet
- **Şifre:** 141413DOa.
- **Rol:** Admin (Tam Yetki)

### Uygulama URL:
https://dosya-opener-1.preview.emergentagent.com

## 📁 VERİ YAPISI

### Yüklü Veriler:

**1. Excel'den Gelen Veriler (SAR-2025-Veriler.xlsx):**
- ✅ 49 Üretim Kaydı
- ✅ 4 Kesilmiş Ürün
- ✅ 24 Sevkiyat

**2. Kullanıcının Orijinal Verileri:**
- ✅ 26 Günlük Tüketim Kaydı
  - Petkim: 16,103.94 kg
  - Estol: 483.12 kg
  - Talk: 241.56 kg
  - GAZ: 3,359.00 kg
  - Fire: 609.56 kg

**3. Sistem Verileri:**
- ✅ 9 Hammadde Giriş Kaydı
- ✅ Döviz Kurları (USD: 42.0, EUR: 48.0)

## 📂 ÖNEMLİ DOSYALAR

**Veri Yükleme:**
```
/app/backend/load_all_data.sh          # HER ŞEYİ YÜKLE
/app/backend/ORIGINAL_USER_DATA.py     # Günlük tüketim
/app/backend/load_data.py              # Excel verileri
/app/backend/load_additional_data.py   # Hammadde, kullanıcı
```

## 🚀 ÖZELLİKLER

### Tüm Sayfalarda:
- ✅ Excel'e Aktar
- ✅ Düzenleme (Admin)
- ✅ Silme (Admin)
- ✅ Filtreleme

### Manuel Maliyet:
- Hammadde fiyatları otomatik
- Ebatlama (kesim) hesabı
- Kar/masraf yüzdeleri

## 🔧 BAKIM

```bash
# Servisleri yeniden başlat
sudo supervisorctl restart all

# Verileri yeniden yükle
cd /app/backend && bash load_all_data.sh
```

---
**TÜM VERİLER, AYARLAR, RENKLER KAYDEDILDI!**
