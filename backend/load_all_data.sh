#!/bin/bash
# TÜM VERİLERİ YÜKLE - Tam Sistem Restore

echo "======================================"
echo "SAR AMBALAJ - TÜM VERİLER YÜKLENİYOR"
echo "======================================"

cd /app/backend

# 1. Excel verilerini yükle
echo ""
echo "1️⃣ Excel verileri yükleniyor..."
python3 load_data.py

# 2. Ek verileri yükle (hammadde, döviz, kullanıcı)
echo ""
echo "2️⃣ Hammadde ve sistem verileri yükleniyor..."
python3 load_additional_data.py

# 3. ORİJİNAL günlük tüketim verilerini yükle
echo ""
echo "3️⃣ Günlük tüketim verileri (26 kayıt) yükleniyor..."
python3 ORIGINAL_USER_DATA.py

echo ""
echo "======================================"
echo "✅ TÜM VERİLER BAŞARIYLA YÜKLENDİ!"
echo "======================================"
echo ""
echo "🌐 Uygulama: https://github-file-opener.preview.emergentagent.com"
echo "👤 Kullanıcı: Mehmet"
echo "🔐 Şifre: 141413DOa."
echo ""
