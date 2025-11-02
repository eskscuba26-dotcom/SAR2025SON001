from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ===== Models =====

# Auth Models
class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str = "admin"

class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    role: str = "viewer"

# Role checker dependency
async def check_admin_role(current_user: str = Header(None, alias="X-User-Role")):
    """İzleyici rolündeki kullanıcılar veri değiştiremez"""
    if current_user == "viewer":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok. Sadece admin kullanıcılar veri ekleyebilir/düzenleyebilir/silebilir.")
    return True

# Production Models
class ProductionCreate(BaseModel):
    date: str
    machine: str
    thickness: str
    width: str
    length: str
    m2: float
    quantity: int
    masuraType: str
    color: str
    colorCategory: str

class Production(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    machine: str
    thickness: str
    width: str
    length: str
    m2: float
    quantity: int
    masuraType: str
    color: str
    colorCategory: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Stock Stats Model
class StockStats(BaseModel):
    totalStock: int = 0
    cutProducts: int = 0
    productions: int = 0
    materials: dict = {
        "gaz": 0,
        "petkim": 0,
        "estol": 0,
        "talk": 0,
        "masura100": 0,
        "masura120": 0,
        "masura150": 0,
        "masura200": 0,
        "sari": 0,
    }

# Stock Models
class StockItem(BaseModel):
    type: str
    thickness: str
    width: str
    length: str
    color: str
    colorCategory: str
    m2: float
    quantity: int


# ===== Auth Routes =====
@api_router.post("/auth/login", response_model=UserResponse)
async def login(request: LoginRequest):
    # Veritabanından kullanıcıyı bul
    user = await db.users.find_one({"username": request.username})
    
    if not user:
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")
    
    # Şifre kontrolü
    import bcrypt
    is_valid = bcrypt.checkpw(request.password.encode('utf-8'), user['password'].encode('utf-8'))
    
    if not is_valid:
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")
    
    return UserResponse(
        id=user.get('id', str(uuid.uuid4())),
        username=user['username'],
        name=user.get('name', ''),
        role=user.get('role', 'viewer')
    )

@api_router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, _: bool = Depends(check_admin_role)):
    # Kullanıcı zaten var mı kontrol et
    existing = await db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten kullanılıyor")
    
    # Şifreyi hashle
    import bcrypt
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Yeni kullanıcı oluştur
    new_user = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "password": hashed_password,
        "name": user.name,
        "role": user.role,
        "createdAt": datetime.utcnow().isoformat()
    }
    
    await db.users.insert_one(new_user)
    
    return UserResponse(
        id=new_user['id'],
        username=new_user['username'],
        role=new_user['role']
    )


# ===== Production Routes =====
@api_router.get("/production", response_model=List[Production])
async def get_productions():
    productions = await db.productions.find({}, {"_id": 0}).to_list(1000)
    return productions

@api_router.post("/production", response_model=Production)
async def create_production(production: ProductionCreate, _: bool = Depends(check_admin_role)):
    prod_dict = production.model_dump()
    prod_obj = Production(**prod_dict)
    
    doc = prod_obj.model_dump()
    await db.productions.insert_one(doc)
    return prod_obj

@api_router.put("/production/{prod_id}")
async def update_production(prod_id: str, production: ProductionCreate, _: bool = Depends(check_admin_role)):
    result = await db.productions.update_one(
        {"id": prod_id},
        {"$set": production.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Production not found")
    return {"message": "Updated successfully"}

@api_router.delete("/production/{prod_id}")
async def delete_production(prod_id: str, _: bool = Depends(check_admin_role)):
    result = await db.productions.delete_one({"id": prod_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Production not found")
    return {"message": "Deleted successfully"}


# ===== Stock Routes =====
@api_router.get("/stock/stats", response_model=StockStats)
async def get_stock_stats():
    # Count productions
    production_count = await db.productions.count_documents({})
    
    # Calculate total stock: Productions - Normal Shipments
    productions = await db.productions.find({}, {"_id": 0, "quantity": 1}).to_list(1000)
    total_produced = sum(p.get("quantity", 0) for p in productions)
    
    # Get normal shipments
    shipments = await db.shipments.find({}, {"_id": 0, "type": 1, "quantity": 1}).to_list(1000)
    total_shipped = sum(int(s.get("quantity", 0)) for s in shipments if s.get("type") == "Normal")
    
    # Remaining stock
    total_stock = total_produced - total_shipped
    
    # Calculate cut products TOTAL QUANTITY (Üretim - Sevkiyat)
    cut_products_list = await db.cut_products.find({}, {"_id": 0, "quantity": 1}).to_list(1000)
    cut_products_produced = sum(int(cp.get("quantity", 0)) for cp in cut_products_list)
    
    # Kesilmiş ürün sevkiyatlarını düş
    cut_shipments = [s for s in shipments if s.get("type") == "Kesilmiş"]
    cut_products_shipped = sum(int(s.get("quantity", 0)) for s in cut_shipments)
    
    # Kalan kesilmiş ürün stoğu
    cut_products_total = cut_products_produced - cut_products_shipped
    
    # Calculate material stocks (Giriş - Tüketim = Kalan)
    # Get materials entries
    materials = await db.materials.find({}, {"_id": 0}).to_list(1000)
    
    # Get daily consumption
    consumptions = await db.daily_consumption.find({}, {"_id": 0}).to_list(1000)
    
    # Initialize material stocks
    material_stocks = {
        "gaz": 0.0,  # GAZ EKLENDİ!
        "petkim": 0.0,
        "estol": 0.0,
        "talk": 0.0,
        "masura100": 0,
        "masura120": 0,
        "masura150": 0,
        "masura200": 0,
        "sari": 0.0,
    }
    
    # Add material entries (Giriş)
    for mat in materials:
        material_name = mat.get("material", "").upper()
        quantity = float(mat.get("quantity", 0))
        
        if "GAZ" in material_name:
            material_stocks["gaz"] += quantity
        elif "PETKİM" in material_name or "PETKIM" in material_name:
            material_stocks["petkim"] += quantity
        elif "ESTOL" in material_name:
            material_stocks["estol"] += quantity
        elif "TALK" in material_name:
            material_stocks["talk"] += quantity
        elif "MASURA 100" in material_name:
            material_stocks["masura100"] += int(quantity)
        elif "MASURA 120" in material_name:
            material_stocks["masura120"] += int(quantity)
        elif "MASURA 150" in material_name:
            material_stocks["masura150"] += int(quantity)
        elif "MASURA 200" in material_name:
            material_stocks["masura200"] += int(quantity)
        elif "SARI" in material_name or "SARI" in material_name.upper():
            material_stocks["sari"] += quantity
    
    # Subtract daily consumption (Çıkış) - YENİ: GAZ EKLENDİ
    for consumption in consumptions:
        gaz = float(consumption.get("gaz", 0))
        petkim = float(consumption.get("petkim", 0))
        estol = float(consumption.get("estol", 0))
        talk = float(consumption.get("talk", 0))
        
        material_stocks["gaz"] -= gaz
        material_stocks["petkim"] -= petkim
        material_stocks["estol"] -= estol
        material_stocks["talk"] -= talk
    
    # Subtract masura usage from productions
    production_list = await db.productions.find({}, {"_id": 0, "masuraType": 1, "quantity": 1}).to_list(1000)
    for prod in production_list:
        masura_type = prod.get("masuraType", "")
        quantity = int(prod.get("quantity", 0))
        
        if "100" in masura_type:
            material_stocks["masura100"] -= quantity
        elif "120" in masura_type:
            material_stocks["masura120"] -= quantity
        elif "150" in masura_type:
            material_stocks["masura150"] -= quantity
        elif "200" in masura_type:
            material_stocks["masura200"] -= quantity
    
    # Round to 2 decimals for float values
    material_stocks["petkim"] = round(material_stocks["petkim"], 2)
    material_stocks["estol"] = round(material_stocks["estol"], 2)
    material_stocks["talk"] = round(material_stocks["talk"], 2)
    material_stocks["sari"] = round(material_stocks["sari"], 2)
    
    return {
        "totalStock": total_stock,
        "cutProducts": cut_products_total,
        "productions": production_count,
        "materials": {
            "gaz": round(material_stocks["gaz"], 2),
            "petkim": round(material_stocks["petkim"], 2),
            "estol": round(material_stocks["estol"], 2),
            "talk": round(material_stocks["talk"], 2),
            "masura100": material_stocks["masura100"],
            "masura120": material_stocks["masura120"],
            "masura150": material_stocks["masura150"],
            "masura200": material_stocks["masura200"],
            "sari": round(material_stocks["sari"], 2),
        },
    }


# ===== Stock Stats Route =====
@api_router.get("/stock-stats")
async def get_stock_stats():
    """
    Stok istatistiklerini ebat ve renk bazında gruplar
    """
    # Tüm üretim ve sevkiyatları çek
    productions = await db.productions.find({}, {"_id": 0}).to_list(10000)
    shipments = await db.shipments.find({}, {"_id": 0}).to_list(10000)
    
    # Ebat ve renk bazında gruplayalım
    stock_by_size = {}
    
    # Üretimleri ekle
    for prod in productions:
        size = f"{prod.get('thickness', '')} x {prod.get('width', '')}cm x {prod.get('length', '')}m"
        color = prod.get('color', 'Doğal')
        key = f"{size}|{color}"
        
        if key not in stock_by_size:
            stock_by_size[key] = {
                'size': size,
                'color': color,
                'totalQuantity': 0,
                'totalM2': 0.0
            }
        
        stock_by_size[key]['totalQuantity'] += prod.get('quantity', 0)
        stock_by_size[key]['totalM2'] += prod.get('m2', 0.0)
    
    # Sevkiyatları çıkar
    for ship in shipments:
        size = ship.get('size', '')
        color = ship.get('color', 'Doğal')
        key = f"{size}|{color}"
        
        if key in stock_by_size:
            stock_by_size[key]['totalQuantity'] -= int(ship.get('quantity', 0))
            stock_by_size[key]['totalM2'] -= float(ship.get('m2', 0.0))
    
    # Liste haline getir ve pozitif stokları filtrele
    result = [v for v in stock_by_size.values() if v['totalQuantity'] > 0]
    
    # Miktara göre sırala
    result.sort(key=lambda x: x['totalQuantity'], reverse=True)
    
    return result


# ===== Cut Products Routes =====
@api_router.get("/cut-products")
async def get_cut_products():
    cut_products = await db.cut_products.find({}, {"_id": 0}).to_list(1000)
    return cut_products

@api_router.post("/cut-products")
async def create_cut_product(data: dict, _: bool = Depends(check_admin_role)):
    """
    Kesilmiş ürün kaydı oluşturur VE ana malzemeyi stoktan düşer
    """
    data['id'] = str(uuid.uuid4())
    
    # 1. Kesilmiş ürünü kaydet
    await db.cut_products.insert_one(data)
    
    # 2. Ana malzemeyi stoktan düş
    # Ana malzeme formatı: "1.8mm x 100cm x 300m"
    material = data.get('material', '')
    used_material = data.get('usedMaterial', '')  # "4 adet" formatında
    color = data.get('color', 'Doğal')
    date = data.get('date', '')
    
    # Kullanılan adet sayısını parse et
    try:
        used_count = int(used_material.split()[0])  # "4 adet" -> 4
    except:
        used_count = 0
    
    if used_count > 0 and material:
        # Ana malzeme bilgilerini parse et: "1.8mm x 100cm x 300m"
        parts = material.split(' x ')
        if len(parts) >= 3:
            # Kalınlığı normalize et: "1.8mm" -> "1.8 mm" (boşluk ekle)
            thickness_raw = parts[0].replace('mm', '').strip()
            thickness = f"{thickness_raw} mm"  # Üretim kayıtlarıyla aynı format
            width = parts[1].replace('cm', '').strip()  # "100"
            length = parts[2].replace('m', '').strip()  # "300"
            
            # Stoktan düşmek için negatif üretim kaydı ekle
            deduction_record = {
                'id': str(uuid.uuid4()),
                'date': date,
                'machine': 'Ebatlama Kesim',
                'thickness': thickness,
                'width': width,
                'length': length,
                'quantity': -used_count,  # NEGATİF - stoktan düşer
                'color': color,
                'colorCategory': color,
                'm2': 0,
                'note': f'Ebatlama kesimi - {data.get("cutSize", "")} için kullanıldı',
                'isCutDeduction': True  # Bu kaydın kesim için olduğunu işaretle
            }
            
            await db.productions.insert_one(deduction_record)
    
    return {
        "message": "Created", 
        "id": data['id'],
        "stockDeducted": used_count if used_count > 0 else 0
    }

@api_router.delete("/cut-products/{id}")
async def delete_cut_product(id: str, _: bool = Depends(check_admin_role)):
    """
    Kesilmiş ürün kaydını siler VE stoku geri ekler
    """
    # Önce kaydı bul
    cut_product = await db.cut_products.find_one({"id": id})
    if not cut_product:
        raise HTTPException(status_code=404, detail="Not found")
    
    # 1. Kesilmiş ürünü sil
    await db.cut_products.delete_one({"id": id})
    
    # 2. İlgili stok düşüş kaydını bul ve sil (eğer varsa)
    # cutSize bilgisini kullanarak ilgili deduction kaydını bul
    cut_size = cut_product.get('cutSize', '')
    await db.productions.delete_one({
        "isCutDeduction": True,
        "note": {"$regex": cut_size}
    })
    
    return {"message": "Deleted", "stockRestored": True}

# ===== Shipments Routes =====
@api_router.get("/shipments")
async def get_shipments():
    shipments = await db.shipments.find({}, {"_id": 0}).to_list(1000)
    return shipments

@api_router.post("/shipments")
async def create_shipment(data: dict, _: bool = Depends(check_admin_role)):
    data['id'] = str(uuid.uuid4())
    await db.shipments.insert_one(data)
    return {"message": "Created", "id": data['id']}

@api_router.put("/shipments/{id}")
async def update_shipment(id: str, data: dict, _: bool = Depends(check_admin_role)):
    result = await db.shipments.update_one(
        {"id": id},
        {"$set": data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return {"message": "Updated successfully"}

@api_router.delete("/shipments/{id}")
async def delete_shipment(id: str, _: bool = Depends(check_admin_role)):
    result = await db.shipments.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

@api_router.get("/materials")
async def get_materials():
    materials = await db.materials.find({}, {"_id": 0}).to_list(1000)
    return materials

@api_router.post("/materials")
async def create_material(data: dict, _: bool = Depends(check_admin_role)):
    data['id'] = str(uuid.uuid4())
    await db.materials.insert_one(data)
    return {"message": "Created", "id": data['id']}

@api_router.get("/daily-consumption")
async def get_daily_consumption():
    consumptions = await db.daily_consumption.find({}, {"_id": 0}).to_list(1000)
    return consumptions

@api_router.post("/daily-consumption")
async def create_daily_consumption(data: dict, _: bool = Depends(check_admin_role)):
    data['id'] = str(uuid.uuid4())
    await db.daily_consumption.insert_one(data)
    return {"message": "Created", "id": data['id']}

@api_router.get("/cost-analysis")
async def get_cost_analysis():
    """Üretim satırı bazında gerçek maliyet analizi - Makine bazında doğru hesaplama"""
    
    # 1. Tüm üretim kayıtlarını al
    productions = await db.productions.find({}, {"_id": 0}).to_list(1000)
    
    # 2. Günlük tüketim verilerini al
    consumptions = await db.daily_consumption.find({}, {"_id": 0}).to_list(1000)
    
    # 3. Hammadde fiyatlarını ve döviz kurlarını al
    materials = await db.materials.find({}, {"_id": 0}).to_list(1000)
    exchange_rates = await db.exchange_rates.find_one({}, {"_id": 0})
    
    usd_rate = float(exchange_rates.get('usd', 1)) if exchange_rates else 1
    eur_rate = float(exchange_rates.get('eur', 1)) if exchange_rates else 1
    
    # Hammadde birim fiyatları (TL'ye çevrilmiş)
    material_prices = {
        'petkim': 0, 'estol': 0, 'talk': 0, 'gaz': 0
    }
    masura_prices = {}  # Her masura tipi için ayrı fiyat
    
    for mat in materials:
        name = mat.get('material', '').upper()
        price = float(mat.get('unitPrice', 0))
        currency = mat.get('currency', 'TL')
        
        # Dövizi TL'ye çevir
        if currency == 'USD':
            price_tl = price * usd_rate
        elif currency == 'EUR':
            price_tl = price * eur_rate
        else:
            price_tl = price
        
        if 'PETK' in name or 'PETKİM' in name:
            material_prices['petkim'] = price_tl
        elif 'ESTOL' in name:
            material_prices['estol'] = price_tl
        elif 'TALK' in name:
            material_prices['talk'] = price_tl
        elif 'GAZ' in name:
            material_prices['gaz'] = price_tl
        elif 'MASURA' in name:
            # Masura tipine göre fiyatları kaydet
            masura_prices[mat.get('material', '')] = price_tl
    
    # 4. Tarihe ve makineye göre günlük tüketimi grupla
    # Petkim, Estol, Talk → Makine bazında
    # Gaz → O günün toplam gazını tüm makinelere dağıtacağız
    consumption_by_date_machine = {}
    total_gaz_by_date = {}  # Tarihe göre toplam gaz
    
    for cons in consumptions:
        date = cons.get('date')
        machine = cons.get('machine')
        key = f"{date}_{machine}"
        
        if key not in consumption_by_date_machine:
            consumption_by_date_machine[key] = {
                'petkim': 0, 'estol': 0, 'talk': 0, 'gaz': 0
            }
        
        # Petkim, Estol, Talk makine bazında topla
        consumption_by_date_machine[key]['petkim'] += float(cons.get('petkim', 0))
        consumption_by_date_machine[key]['estol'] += float(cons.get('estol', 0))
        consumption_by_date_machine[key]['talk'] += float(cons.get('talk', 0))
        
        # Gaz'ı tarihe göre topla (tüm makineler için toplam)
        if date not in total_gaz_by_date:
            total_gaz_by_date[date] = 0
        total_gaz_by_date[date] += float(cons.get('gaz', 0))
    
    # 5. Tarihe ve makineye göre toplam m² hesapla (gaz dağıtımı için gerekli)
    total_m2_by_date_machine = {}
    total_m2_by_date = {}  # O günün tüm makinelerindeki toplam m²
    
    for prod in productions:
        date = prod.get('date')
        machine = prod.get('machine')
        m2 = float(prod.get('m2', 0))
        
        key = f"{date}_{machine}"
        if key not in total_m2_by_date_machine:
            total_m2_by_date_machine[key] = 0
        total_m2_by_date_machine[key] += m2
        
        if date not in total_m2_by_date:
            total_m2_by_date[date] = 0
        total_m2_by_date[date] += m2
    
    # 6. Her üretim satırı için maliyet hesapla
    cost_analysis = []
    for prod in productions:
        date = prod.get('date')
        machine = prod.get('machine')
        m2 = float(prod.get('m2', 0))
        quantity = int(prod.get('quantity', 0))
        
        key = f"{date}_{machine}"
        
        # Bu tarih-makine için günlük tüketim
        daily_cons = consumption_by_date_machine.get(key, {'petkim': 0, 'estol': 0, 'talk': 0, 'gaz': 0})
        total_m2_machine = total_m2_by_date_machine.get(key, 1)
        
        # Bu üretimin payı (aynı makine içindeki ürünler arasında m²'ye göre)
        if total_m2_machine > 0:
            ratio = m2 / total_m2_machine
        else:
            ratio = 0
        
        # Petkim, Estol, Talk → Makine bazında dağıt
        prod_petkim = daily_cons.get('petkim', 0) * ratio
        prod_estol = daily_cons.get('estol', 0) * ratio
        prod_talk = daily_cons.get('talk', 0) * ratio
        
        # Gaz → O günün TÜM makineleri arasında m²'ye göre dağıt
        total_gaz_day = total_gaz_by_date.get(date, 0)
        total_m2_day = total_m2_by_date.get(date, 1)
        
        if total_m2_day > 0:
            gaz_ratio = m2 / total_m2_day
        else:
            gaz_ratio = 0
        
        prod_gaz = total_gaz_day * gaz_ratio
        
        # Hammadde maliyeti
        material_cost = (
            prod_petkim * material_prices['petkim'] +
            prod_estol * material_prices['estol'] +
            prod_talk * material_prices['talk'] +
            prod_gaz * material_prices['gaz']
        )
        
        # Masura maliyeti (Bu üretim satırının masura tipine göre!)
        masura_type = prod.get('masuraType', '').upper().strip()
        masura_unit_price = 0
        
        # Masura fiyatını bul (büyük/küçük harf duyarsız)
        for masura_name, masura_price in masura_prices.items():
            if masura_name.upper().strip() == masura_type:
                masura_unit_price = masura_price
                break
        
        masura_cost = quantity * masura_unit_price
        
        # Toplam maliyet
        total_cost = material_cost + masura_cost
        
        # Birim maliyetler
        unit_cost = total_cost / quantity if quantity > 0 else 0
        m2_cost = total_cost / m2 if m2 > 0 else 0
        
        cost_analysis.append({
            'id': prod.get('id', ''),
            'date': date,
            'machine': machine,
            'thickness': prod.get('thickness', ''),
            'width': int(prod.get('width', 0)),
            'length': int(prod.get('length', 0)),
            'm2': round(m2, 2),
            'quantity': quantity,
            'masuraType': prod.get('masuraType', ''),
            'color': prod.get('color', ''),
            'petkim': round(prod_petkim, 2),
            'estol': round(prod_estol, 2),
            'talk': round(prod_talk, 2),
            'gaz': round(prod_gaz, 2),
            'materialCost': round(material_cost, 2),
            'masuraCost': round(masura_cost, 2),
            'totalCost': round(total_cost, 2),
            'unitCost': round(unit_cost, 2),
            'm2Cost': round(m2_cost, 2),
        })
    
    # Tarihe göre sırala (en yeni önce)
    cost_analysis.sort(key=lambda x: x['date'], reverse=True)
    
    return cost_analysis

@api_router.post("/cost-analysis")
async def create_cost_analysis(data: dict, _: bool = Depends(check_admin_role)):
    data['id'] = str(uuid.uuid4())
    await db.cost_analysis.insert_one(data)
    return {"message": "Created", "id": data['id']}

@api_router.get("/users")
async def get_users():
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, _: bool = Depends(check_admin_role)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

@api_router.put("/users/change-password")
async def change_password(data: dict, _: bool = Depends(check_admin_role)):
    username = data.get("username")
    new_password = data.get("newPassword")
    
    if not username or not new_password:
        raise HTTPException(status_code=400, detail="Username and new password required")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Kullanıcıyı bul ve şifreyi güncelle
    result = await db.users.update_one(
        {"username": username},
        {"$set": {"password": new_password}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found or password unchanged")
    
    return {"message": "Password changed successfully"}

@api_router.get("/excel-viewer")
async def get_excel_data():
    """Excel dosyasını okuyup JSON olarak döndür"""
    import pandas as pd
    
    try:
        excel_file = "/tmp/SAR-2025-Original.xlsx"
        
        # Excel'i oku
        xls = pd.ExcelFile(excel_file)
        
        result = {
            "sheets": [],
            "filename": "SAR-2025.xlsx"
        }
        
        # Her sheet'i oku
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            
            # DataFrame'i dictionary'e çevir
            sheet_data = {
                "name": sheet_name,
                "columns": df.columns.tolist(),
                "data": df.values.tolist()
            }
            
            result["sheets"].append(sheet_data)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Excel okuma hatası: {str(e)}")

@api_router.get("/download-excel")
async def download_excel():
    """Orijinal Excel dosyasını indir"""
    from fastapi.responses import FileResponse
    import os
    
    excel_file = "/tmp/SAR-2025-Original.xlsx"
    
    if not os.path.exists(excel_file):
        raise HTTPException(status_code=404, detail="Excel dosyası bulunamadı")
    
    return FileResponse(
        path=excel_file,
        filename="SAR-2025.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@api_router.get("/exchange-rates")
async def get_exchange_rates():
    rate = await db.exchange_rates.find_one({}, {"_id": 0})
    if rate:
        return {"usd": rate.get('usd', 0), "eur": rate.get('eur', 0), "lastUpdated": rate.get('lastUpdated', '')}
    return {"usd": 42.00, "eur": 48.00}

@api_router.put("/exchange-rates")
async def update_exchange_rates(data: dict, _: bool = Depends(check_admin_role)):
    data['lastUpdated'] = datetime.now(timezone.utc).isoformat()
    await db.exchange_rates.update_one({}, {"$set": data}, upsert=True)
    return {"message": "Updated"}


# ===== Root Route =====
@api_router.get("/")
async def root():
    return {"message": "SAR Ambalaj API v1.0"}

# ===== Stock Routes =====
@api_router.get("/stock")
async def get_stock():
    """
    Dinamik stok hesaplama:
    Stok = Üretim - Sevkiyat
    Ürün tipine, kalınlığa, ene, metreye, renge göre gruplandırılmış
    """
    try:
        # 1. Tüm üretim kayıtlarını al
        productions = await db.productions.find({}).to_list(None)
        
        # 2. Tüm sevkiyat kayıtlarını al
        shipments = await db.shipments.find({}).to_list(None)
        
        # 3. Üretim verilerini grupla
        production_groups = {}
        for prod in productions:
            thickness = prod.get('thickness', '')
            width = prod.get('width', '')
            length = prod.get('length', '')
            color = prod.get('color', '')
            
            # Key oluştur: kalınlık_en_metre_renk
            key = f"{thickness}_{width}_{length}_{color}"
            
            if key not in production_groups:
                production_groups[key] = {
                    'type': 'Normal',
                    'thickness': thickness,
                    'width': width,
                    'length': length,
                    'color': color,
                    'colorCategory': prod.get('colorCategory', 'Doğal'),
                    'm2': prod.get('m2', 0),
                    'quantity': 0
                }
            
            production_groups[key]['quantity'] += prod.get('quantity', 0)
        
        # 4. Sevkiyat verilerini grupla
        shipment_groups = {}
        for ship in shipments:
            # Sevkiyat size'ından kalınlık, en, metre çıkar
            size = ship.get('size', '')
            ship_type = ship.get('type', 'Normal')
            color = ship.get('color', '')
            
            # Size parsing: "2mm x 100cm x 300m" veya "1.8mm x 50cm x 137.5cm"
            parts = size.split(' x ')
            if len(parts) >= 3:
                thickness_raw = parts[0].replace('mm', '').strip()
                width_raw = parts[1].replace('cm', '').strip()
                length_raw = parts[2].replace('m', '').replace('cm', '').strip()  # m veya cm'yi temizle
                
                # Üretimde thickness "2 mm" formatında
                thickness = f"{thickness_raw} mm"
                width = width_raw
                length = length_raw
                
                # Key oluştur - üretimle aynı format
                key = f"{thickness}_{width}_{length}_{color}"
                
                if key not in shipment_groups:
                    shipment_groups[key] = 0
                
                shipment_groups[key] += int(ship.get('quantity', 0))
        
        # 5. Stok hesapla (Üretim - Sevkiyat)
        stock_items = []
        for key, prod_data in production_groups.items():
            quantity = prod_data['quantity']
            
            # Sevkiyatı düş
            if key in shipment_groups:
                quantity -= shipment_groups[key]
            
            # Sadece stokta olan veya negatif olanları göster
            if quantity != 0:
                stock_items.append({
                    'type': prod_data['type'],
                    'thickness': prod_data['thickness'],
                    'width': prod_data['width'],
                    'length': prod_data['length'],
                    'color': prod_data['color'],
                    'colorCategory': prod_data['colorCategory'],
                    'm2': prod_data['m2'],
                    'quantity': quantity
                })
        
        # 6. Kesilmiş ürünleri ekle
        cut_products = await db.cut_products.find({}).to_list(None)
        cut_groups = {}
        
        for cut in cut_products:
            cut_size = cut.get('cutSize', '')
            color = cut.get('color', '')
            
            # cutSize parsing: "1.8mm x 50cm x 137.5cm"
            parts = cut_size.split(' x ')
            if len(parts) < 3:
                continue  # Geçersiz format, atla
            
            key = f"cut_{cut_size}_{color}"
            
            if key not in cut_groups:
                cut_groups[key] = {
                    'type': 'Kesilmiş',
                    'thickness': parts[0].replace('mm', '').strip(),
                    'width': parts[1].replace('cm', '').strip(),
                    'length': parts[2].strip(),
                    'color': color,
                    'colorCategory': cut.get('colorCategory', 'Doğal'),
                    'm2': 0.69,  # Kesilmiş ürün m2
                    'quantity': 0
                }
            
            cut_groups[key]['quantity'] += int(cut.get('quantity', 0))
        
        # Kesilmiş ürün sevkiyatlarını düş
        for ship in shipments:
            if ship.get('type') == 'Kesilmiş':
                size = ship.get('size', '')
                color = ship.get('color', '')
                key = f"cut_{size}_{color}"
                
                if key in cut_groups:
                    cut_groups[key]['quantity'] -= int(ship.get('quantity', 0))
        
        # Kesilmiş ürünleri stock_items'a ekle
        for cut_data in cut_groups.values():
            if cut_data['quantity'] != 0:
                stock_items.append(cut_data)
        
        # 7. Sırala (önce tip, sonra kalınlık)
        def safe_float(val):
            try:
                # "2 mm" -> "2" -> 2.0
                return float(str(val).replace(' mm', '').replace('mm', '').strip())
            except:
                return 0.0
        
        def safe_int(val):
            try:
                return int(str(val).strip())
            except:
                return 0
        
        stock_items.sort(key=lambda x: (
            0 if x['type'] == 'Normal' else 1,
            safe_float(x.get('thickness', '')),
            safe_int(x.get('width', ''))
        ))
        
        return stock_items
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()