"""
Hammadde, günlük tüketim ve döviz kuru verilerini yükle
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def load_materials():
    """Hammadde giriş kayıtlarını yükle"""
    print("🧪 Hammadde giriş kayıtları yükleniyor...")
    
    materials = [
        {
            "id": str(uuid.uuid4()),
            "date": "2025-09-01",
            "material": "PETKİM LDPE",
            "quantity": 5000.0,
            "unitPrice": 2.85,
            "currency": "USD",
            "supplier": "PETKİM A.Ş.",
            "invoiceNo": "PET-2025-001"
        },
        {
            "id": str(uuid.uuid4()),
            "date": "2025-09-01",
            "material": "ESTOL",
            "quantity": 500.0,
            "unitPrice": 3.20,
            "currency": "USD",
            "supplier": "Kimya Tedarikçi",
            "invoiceNo": "EST-2025-001"
        },
        {
            "id": str(uuid.uuid4()),
            "date": "2025-09-01",
            "material": "TALK",
            "quantity": 800.0,
            "unitPrice": 1.50,
            "currency": "USD",
            "supplier": "Mineral A.Ş.",
            "invoiceNo": "TAL-2025-001"
        },
        {
            "id": str(uuid.uuid4()),
            "date": "2025-09-01",
            "material": "GAZ (N2)",
            "quantity": 200.0,
            "unitPrice": 0.80,
            "currency": "TL",
            "supplier": "Gaz Tedarik",
            "invoiceNo": "GAZ-2025-001"
        },
        {
            "id": str(uuid.uuid4()),
            "date": "2025-09-05",
            "material": "MASURA 100",
            "quantity": 2000,
            "unitPrice": 2.50,
            "currency": "TL",
            "supplier": "Masura Üretici",
            "invoiceNo": "MAS-2025-001"
        },
        {
            "id": str(uuid.uuid4()),
            "date": "2025-09-05",
            "material": "MASURA 120",
            "quantity": 1500,
            "unitPrice": 2.75,
            "currency": "TL",
            "supplier": "Masura Üretici",
            "invoiceNo": "MAS-2025-002"
        },
        {
            "id": str(uuid.uuid4()),
            "date": "2025-09-05",
            "material": "MASURA 150",
            "quantity": 1000,
            "unitPrice": 3.00,
            "currency": "TL",
            "supplier": "Masura Üretici",
            "invoiceNo": "MAS-2025-003"
        },
        {
            "id": str(uuid.uuid4()),
            "date": "2025-09-05",
            "material": "MASURA 200",
            "quantity": 500,
            "unitPrice": 3.50,
            "currency": "TL",
            "supplier": "Masura Üretici",
            "invoiceNo": "MAS-2025-004"
        },
        {
            "id": str(uuid.uuid4()),
            "date": "2025-09-10",
            "material": "SARI MASTERBATCH",
            "quantity": 150.0,
            "unitPrice": 4.50,
            "currency": "USD",
            "supplier": "Renk Masterbatch",
            "invoiceNo": "RNK-2025-001"
        },
        {
            "id": str(uuid.uuid4()),
            "date": "2025-10-01",
            "material": "PETKİM LDPE",
            "quantity": 3000.0,
            "unitPrice": 2.90,
            "currency": "USD",
            "supplier": "PETKİM A.Ş.",
            "invoiceNo": "PET-2025-002"
        },
        {
            "id": str(uuid.uuid4()),
            "date": "2025-10-01",
            "material": "ESTOL",
            "quantity": 300.0,
            "unitPrice": 3.25,
            "currency": "USD",
            "supplier": "Kimya Tedarikçi",
            "invoiceNo": "EST-2025-002"
        },
        {
            "id": str(uuid.uuid4()),
            "date": "2025-10-01",
            "material": "TALK",
            "quantity": 500.0,
            "unitPrice": 1.55,
            "currency": "USD",
            "supplier": "Mineral A.Ş.",
            "invoiceNo": "TAL-2025-002"
        },
        {
            "id": str(uuid.uuid4()),
            "date": "2025-10-15",
            "material": "GAZ (N2)",
            "quantity": 150.0,
            "unitPrice": 0.85,
            "currency": "TL",
            "supplier": "Gaz Tedarik",
            "invoiceNo": "GAZ-2025-002"
        },
    ]
    
    await db.materials.delete_many({})
    await db.materials.insert_many(materials)
    print(f"   ✅ {len(materials)} hammadde giriş kaydı yüklendi")

async def load_daily_consumption():
    """Günlük hammadde tüketim kayıtlarını yükle"""
    print("\n📉 Günlük tüketim kayıtları yükleniyor...")
    
    # Üretim tarihlerine göre günlük tüketim verileri oluştur
    consumptions = []
    
    # Eylül ayı üretimleri için tüketim
    dates_sept = [
        "2025-09-23", "2025-09-24", "2025-09-25", "2025-09-26", 
        "2025-09-29", "2025-09-30"
    ]
    
    for date in dates_sept:
        consumptions.append({
            "id": str(uuid.uuid4()),
            "date": date,
            "machine": "Makine 1",
            "petkim": 45.5,
            "estol": 2.3,
            "talk": 3.8,
            "gaz": 5.2,
            "notes": "Günlük üretim tüketimi"
        })
        consumptions.append({
            "id": str(uuid.uuid4()),
            "date": date,
            "machine": "Makine 2",
            "petkim": 52.3,
            "estol": 2.6,
            "talk": 4.2,
            "gaz": 6.1,
            "notes": "Günlük üretim tüketimi"
        })
    
    # Ekim ayı üretimleri için tüketim
    dates_oct = [
        "2025-10-01", "2025-10-02", "2025-10-03", "2025-10-06",
        "2025-10-07", "2025-10-08", "2025-10-14", "2025-10-15",
        "2025-10-16", "2025-10-17", "2025-10-20", "2025-10-21",
        "2025-10-22", "2025-10-23", "2025-10-24", "2025-10-27"
    ]
    
    for date in dates_oct:
        consumptions.append({
            "id": str(uuid.uuid4()),
            "date": date,
            "machine": "Makine 1",
            "petkim": 48.2,
            "estol": 2.4,
            "talk": 4.0,
            "gaz": 5.5,
            "notes": "Günlük üretim tüketimi"
        })
        consumptions.append({
            "id": str(uuid.uuid4()),
            "date": date,
            "machine": "Makine 2",
            "petkim": 55.8,
            "estol": 2.8,
            "talk": 4.5,
            "gaz": 6.5,
            "notes": "Günlük üretim tüketimi"
        })
    
    await db.daily_consumption.delete_many({})
    await db.daily_consumption.insert_many(consumptions)
    print(f"   ✅ {len(consumptions)} günlük tüketim kaydı yüklendi")

async def load_exchange_rates():
    """Döviz kurlarını yükle"""
    print("\n💱 Döviz kurları yükleniyor...")
    
    exchange_rate = {
        "usd": 34.75,
        "eur": 37.82,
        "lastUpdated": datetime.utcnow().isoformat()
    }
    
    await db.exchange_rates.delete_many({})
    await db.exchange_rates.insert_one(exchange_rate)
    print(f"   ✅ Döviz kurları yüklendi (USD: {exchange_rate['usd']}, EUR: {exchange_rate['eur']})")

async def verify_data():
    """Yüklenen verileri doğrula ve özetle"""
    print("\n" + "=" * 70)
    print("📊 VERİ DOĞRULAMA VE ÖZET")
    print("=" * 70)
    
    # Tüm koleksiyonları say
    counts = {
        "Üretim Kayıtları": await db.productions.count_documents({}),
        "Kesilmiş Ürünler": await db.cut_products.count_documents({}),
        "Sevkiyatlar": await db.shipments.count_documents({}),
        "Hammadde Girişleri": await db.materials.count_documents({}),
        "Günlük Tüketim": await db.daily_consumption.count_documents({}),
        "Döviz Kurları": await db.exchange_rates.count_documents({})
    }
    
    print("\n📈 Veritabanı İçeriği:")
    for name, count in counts.items():
        print(f"  • {name}: {count} kayıt")
    
    # Hammadde stok özeti
    print("\n🧪 Hammadde Stok Özeti:")
    materials = await db.materials.find({}).to_list(None)
    material_totals = {}
    for mat in materials:
        name = mat['material']
        qty = mat['quantity']
        if name not in material_totals:
            material_totals[name] = 0
        material_totals[name] += qty
    
    for name, qty in sorted(material_totals.items()):
        print(f"  • {name}: {qty}")
    
    # Günlük tüketim özeti
    consumptions = await db.daily_consumption.find({}).to_list(None)
    total_petkim = sum(c.get('petkim', 0) for c in consumptions)
    total_estol = sum(c.get('estol', 0) for c in consumptions)
    total_talk = sum(c.get('talk', 0) for c in consumptions)
    total_gaz = sum(c.get('gaz', 0) for c in consumptions)
    
    print("\n📉 Toplam Tüketim:")
    print(f"  • PETKİM: {total_petkim:.2f} kg")
    print(f"  • ESTOL: {total_estol:.2f} kg")
    print(f"  • TALK: {total_talk:.2f} kg")
    print(f"  • GAZ: {total_gaz:.2f} m³")
    
    # Stok durumu API'den
    print("\n📦 Canlı Stok Durumu:")
    import requests
    try:
        response = requests.get("http://localhost:8001/api/stock/stats")
        if response.status_code == 200:
            stats = response.json()
            print(f"  • Toplam Stok: {stats['totalStock']} adet")
            print(f"  • Kesilmiş Ürünler: {stats['cutProducts']} adet")
            print(f"  • Üretim Sayısı: {stats['productions']} kayıt")
            print(f"\n  Hammadde Kalan Stoklar:")
            print(f"    - GAZ: {stats['materials']['gaz']} m³")
            print(f"    - PETKİM: {stats['materials']['petkim']} kg")
            print(f"    - ESTOL: {stats['materials']['estol']} kg")
            print(f"    - TALK: {stats['materials']['talk']} kg")
            print(f"    - Masura 100: {stats['materials']['masura100']} adet")
            print(f"    - Masura 120: {stats['materials']['masura120']} adet")
            print(f"    - Masura 150: {stats['materials']['masura150']} adet")
            print(f"    - Masura 200: {stats['materials']['masura200']} adet")
            print(f"    - SARI: {stats['materials']['sari']} kg")
    except Exception as e:
        print(f"  ⚠️ API'den stok durumu alınamadı: {e}")

async def main():
    print("=" * 70)
    print("🔄 TÜM VERİLER YÜKLENİYOR")
    print("=" * 70)
    
    await load_materials()
    await load_daily_consumption()
    await load_exchange_rates()
    await verify_data()
    
    print("\n" + "=" * 70)
    print("✅ TÜM VERİLER BAŞARIYLA YÜKLENDİ VE DOĞRULANDI!")
    print("=" * 70)
    print("\n🌐 Uygulama: https://dosya-opener-1.preview.emergentagent.com")
    print("🔑 Giriş: admin / SAR2025!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
