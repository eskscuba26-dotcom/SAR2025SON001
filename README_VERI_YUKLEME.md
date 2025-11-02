# SAR AMBALAJ ÜRETİM YÖNETİM SİSTEMİ

## ⚠️ ÖNEMLİ: VERİ YÜKLEME

### Orijinal Verileri Yüklemek İçin:

```bash
cd /app/backend
python3 ORIGINAL_USER_DATA.py
```

VEYA tüm verileri yüklemek için:

```bash
bash /app/backend/load_all_original_data.sh
```

## 📊 Veri Dosyaları

### KULLANICININ ORİJİNAL VERİLERİ:
- **Dosya:** `/app/backend/ORIGINAL_USER_DATA.py`
- **İçerik:** 26 Günlük Tüketim Kaydı
- **Kaynak:** Kullanıcı ekran görüntüleri (2025-10-29)
- **UYARI:** Bu dosyayı DEĞİŞTİRMEYİN!

### Diğer Veri Dosyaları:
- `load_data.py` - Üretim, Kesilmiş Ürün, Sevkiyat (Excel'den)
- `load_additional_data.py` - Hammadde, Döviz Kurları, Kullanıcılar
- `load_consumption_cost.py` - Eski günlük tüketim (KULLANMAYIN)
- `load_correct_consumption.py` - Eski veriler (KULLANMAYIN)

## 🚀 Başlangıç

### 1. Servisleri Başlat:
```bash
sudo supervisorctl restart all
```

### 2. Verileri Yükle:
```bash
bash /app/backend/load_all_original_data.sh
```

### 3. Uygulamayı Aç:
https://doc-expander.preview.emergentagent.com

**Giriş Bilgileri:**
- Kullanıcı Adı: **Mehmet**
- Şifre: **141413DOa.**

## 📈 Yüklenen Veriler

### Excel'den (SAR-2025-Veriler.xlsx):
- ✅ 49 Üretim Kaydı
- ✅ 4 Kesilmiş Ürün
- ✅ 24 Sevkiyat

### Kullanıcının Orijinal Verileri:
- ✅ 26 Günlük Tüketim Kaydı
  - **Petkim:** 16,103.94 kg
  - **Estol:** 483.12 kg
  - **Talk:** 241.56 kg
  - **GAZ:** 3,359.00 kg
  - **FİRE:** 609.56 kg

### Sistem Verileri:
- ✅ 9 Hammadde Giriş Kaydı
- ✅ Döviz Kurları (USD: 42.0, EUR: 48.0)
- ✅ 1 Kullanıcı (admin)

## 🔧 Geliştirme

### Backend:
```bash
cd /app/backend
# Değişiklikler otomatik reload
```

### Frontend:
```bash
cd /app/frontend
# Değişiklikler otomatik reload
```

### Servisleri Yeniden Başlat:
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl restart all
```

## ⚠️ UYARILAR

1. **ORIGINAL_USER_DATA.py dosyasını DEĞİŞTİRMEYİN!**
2. Günlük tüketim verileri bu dosyadan gelir
3. Yeni veri eklemek için GUI kullanın
4. Excel dosyasını değiştirirseniz `load_data.py` çalıştırın

## 📞 Destek

Sorun yaşarsanız:
1. Servisleri kontrol edin: `sudo supervisorctl status`
2. Logları kontrol edin: `tail -f /var/log/supervisor/backend.err.log`
3. Verileri yeniden yükleyin: `bash load_all_original_data.sh`
