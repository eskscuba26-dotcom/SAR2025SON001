#!/usr/bin/env python3
"""
Veritabanını database_backup.json dosyasından geri yükler
"""
import json
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB bağlantısı
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
db_name = os.environ.get('DB_NAME', 'test_database')

client = MongoClient(mongo_url)
db = client[db_name]

print("🔄 Veritabanı geri yükleniyor...\n")

# JSON dosyasını oku
with open('database_backup.json', 'r', encoding='utf-8') as f:
    export_data = json.load(f)

# Her koleksiyonu temizle ve yükle
for coll_name, data in export_data.items():
    print(f"📦 {coll_name}: {len(data)} kayıt yükleniyor...")
    
    # Koleksiyonu temizle
    db[coll_name].delete_many({})
    
    # Verileri yükle
    if data:
        db[coll_name].insert_many(data)
    
    print(f"   ✅ {len(data)} kayıt yüklendi")

print("\n🎉 Veritabanı başarıyla geri yüklendi!")
print(f"\nToplam: {sum(len(v) for v in export_data.values())} kayıt")

# Özet
print("\n📊 Yüklenen Veriler:")
for coll_name, data in export_data.items():
    if len(data) > 0:
        print(f"   - {coll_name}: {len(data)} kayıt")

client.close()
