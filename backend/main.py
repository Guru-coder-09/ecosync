import sqlite3
import time
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from typing import List, Optional, Literal

DB_FILE = "ecosync_v3.db"

# Generate Ed25519 keys for the prototype
private_key = ed25519.Ed25519PrivateKey.generate()
public_key = private_key.public_key()
private_key_bytes = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)
public_key_bytes = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

ZONE_WEATHER = {
    1: {"temp": "21°C", "condition": "Heavy Mist & Rain", "humidity": "92%", "wind": "18 km/h", "alert": "Ghat Landslide Warning"},
    2: {"temp": "14°C", "condition": "Dense Fog / Chilly", "humidity": "88%", "wind": "10 km/h", "alert": "Low Visibility on Hairpin Bends"},
    3: {"temp": "16°C", "condition": "Pleasant / Clear", "humidity": "55%", "wind": "8 km/h", "alert": "Normal Mountain Weather"},
    4: {"temp": "3°C", "condition": "Snow / Freezing Gales", "humidity": "82%", "wind": "32 km/h", "alert": "High-Altitude Blizzard Alert"},
    5: {"temp": "26°C", "condition": "Overcast & Humid", "humidity": "79%", "wind": "12 km/h", "alert": "Elephant Herd Crossing Active"},
    6: {"temp": "28°C", "condition": "Sunny & Dry", "humidity": "58%", "wind": "6 km/h", "alert": "Eco-Safe Jungle Conditions"}
}

def get_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            description TEXT
        );
        
        CREATE TABLE IF NOT EXISTS zones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER,
            name TEXT UNIQUE,
            state TEXT,
            safe_capacity INTEGER,
            current_occupancy INTEGER DEFAULT 0,
            hazard_level TEXT DEFAULT 'NORMAL',
            status TEXT DEFAULT 'OPEN',
            FOREIGN KEY(category_id) REFERENCES categories(id)
        );
        
        CREATE TABLE IF NOT EXISTS tourist_spots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone_id INTEGER,
            name TEXT UNIQUE,
            current_crowd INTEGER DEFAULT 0,
            max_capacity INTEGER,
            status TEXT DEFAULT 'OPEN',
            FOREIGN KEY(zone_id) REFERENCES zones(id)
        );

        CREATE TABLE IF NOT EXISTS gateways (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone_id INTEGER,
            name TEXT,
            gateway_type TEXT,
            FOREIGN KEY(zone_id) REFERENCES zones(id)
        );
        
        CREATE TABLE IF NOT EXISTS permits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone_id INTEGER,
            vehicle_reg_number TEXT,
            vehicle_type TEXT DEFAULT 'Tourist Vehicle',
            passenger_count INTEGER,
            origin_from TEXT DEFAULT '',
            visit_datetime TEXT DEFAULT '',
            slot_start INTEGER,
            slot_end INTEGER,
            status TEXT,
            FOREIGN KEY(zone_id) REFERENCES zones(id)
        );
        
        CREATE TABLE IF NOT EXISTS scan_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            permit_id INTEGER,
            gateway_id INTEGER,
            scan_type TEXT,
            verified BOOLEAN,
            created_at INTEGER,
            FOREIGN KEY(permit_id) REFERENCES permits(id),
            FOREIGN KEY(gateway_id) REFERENCES gateways(id)
        );
    """)
    
    # Seed Categories
    categories = [
        ("Hill Stations", "Elevated tourist destinations"),
        ("High-Altitude Passes", "Mountain passes with fragile ecosystems"),
        ("Wildlife & Biosphere", "Protected natural habitats")
    ]
    cursor.executemany("INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)", categories)
    
    # Seed Zones
    zones = [
        (1, "Lonavala", "Maharashtra", 5000, 4200, "NORMAL", "OPEN"),
        (1, "Ooty", "Tamil Nadu", 3000, 2600, "ELEVATED", "OPEN"),
        (1, "Shimla", "Himachal Pradesh", 4000, 3800, "HIGH", "OPEN"),
        (2, "Rohtang Pass & Solang Valley", "Himachal Pradesh", 1200, 1150, "CRITICAL", "OPEN"),
        (3, "Mudumalai", "Tamil Nadu", 500, 200, "NORMAL", "OPEN"),
        (3, "Corbett", "Uttarakhand", 800, 400, "NORMAL", "OPEN")
    ]
    cursor.executemany("INSERT OR IGNORE INTO zones (category_id, name, state, safe_capacity, current_occupancy, hazard_level, status) VALUES (?, ?, ?, ?, ?, ?, ?)", zones)
    
    # Seed Specific Tourist Spots for each zone
    spots = [
        # Lonavala
        (1, "Tiger Point (Lion's Point)", 380, 400, "HIGH_DENSITY"),
        (1, "Bhushi Dam Cascades", 510, 600, "MODERATE"),
        (1, "Karla & Bhaja Buddhist Caves", 130, 300, "LOW_DENSITY"),
        # Ooty
        (2, "Government Botanical Garden", 640, 800, "MODERATE"),
        (2, "Doddabetta Mountain Peak", 360, 400, "HIGH_DENSITY"),
        (2, "Pykara Lake & Waterfalls", 190, 500, "LOW_DENSITY"),
        # Shimla
        (3, "The Ridge & Mall Road", 1180, 1200, "CRITICAL"),
        (3, "Jakhoo Temple & Ropeway", 320, 500, "MODERATE"),
        (3, "Kufri Adventure Highland", 460, 600, "MODERATE"),
        # Rohtang Pass & Solang
        (4, "Rohtang Glacier Crest", 490, 500, "CRITICAL"),
        (4, "Solang Valley Adventure Bowl", 430, 500, "HIGH_DENSITY"),
        (4, "Atal Tunnel North Portal", 230, 400, "LOW_DENSITY"),
        # Mudumalai
        (5, "Theppakadu Elephant Camp", 95, 150, "MODERATE"),
        (5, "Moyar River Gorge Trail", 65, 100, "LOW_DENSITY"),
        # Corbett
        (6, "Dhikala Ecotourism Core", 215, 250, "HIGH_DENSITY"),
        (6, "Bijrani Jungle Safari Ring", 145, 250, "LOW_DENSITY")
    ]
    cursor.executemany("INSERT OR IGNORE INTO tourist_spots (zone_id, name, current_crowd, max_capacity, status) VALUES (?, ?, ?, ?, ?)", spots)

    # Seed Gateways
    gateways = [
        (1, "Khandala Ghat FASTag Toll", "FASTAG_TOLL"),
        (1, "Tiger Point Barrier", "MANUAL_CHECKPOST"),
        (2, "Ooty Main Toll", "FASTAG_TOLL"),
        (4, "Gulaba Checkpost", "FASTAG_TOLL")
    ]
    cursor.executemany("INSERT OR IGNORE INTO gateways (zone_id, name, gateway_type) VALUES (?, ?, ?)", gateways)
    
    # Pre-seed recent permits for the Authority Dashboard Passenger Manifest
    now = int(time.time())
    initial_permits = [
        (1, "MH 14 DX 4022", "Private SUV", 4, now - 3600, now + 14400, "VERIFIED_ENTRY"),
        (1, "MH 12 QP 8819", "MSRTC State Bus", 38, now - 2800, now + 12000, "VERIFIED_ENTRY"),
        (1, "MH 02 BF 9101", "Private Sedan", 2, now - 1800, now + 10800, "VERIFIED_ENTRY"),
        (2, "TN 43 B 8891", "SETC Tourist Coach", 32, now - 4200, now + 8000, "VERIFIED_ENTRY"),
        (2, "TN 07 CB 1204", "Private EV", 3, now - 1200, now + 18000, "VERIFIED_ENTRY"),
        (3, "HP 01 A 3302", "HRTC Himgaurav Bus", 42, now - 5000, now + 7200, "VERIFIED_ENTRY"),
        (3, "DL 3C AB 9012", "Private SUV", 5, now - 900, now + 15000, "PENDING_CHECKPOST"),
        (4, "HP 66 5011", "Commercial 4x4", 6, now - 2200, now + 8000, "VERIFIED_ENTRY"),
        (4, "HR 26 DQ 7720", "Private Sedan", 4, now - 400, now + 9000, "PENDING_CHECKPOST"),
        (6, "UK 04 E 1144", "Forest Safari Gypsy", 6, now - 3100, now + 7000, "VERIFIED_ENTRY")
    ]
    cursor.executemany("""
        INSERT OR IGNORE INTO permits (zone_id, vehicle_reg_number, vehicle_type, passenger_count, slot_start, slot_end, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, initial_permits)

    conn.commit()
    conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="EcoSync DPI API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FastagWebhookPayload(BaseModel):
    gateway_id: int
    vehicle_reg: str
    count: int
    type: Literal['ENTRY', 'EXIT']

class PermitPayload(BaseModel):
    zone_id: int
    vehicle_reg_number: str
    passenger_count: int
    vehicle_type: Optional[str] = 'Tourist Vehicle'
    origin_from: Optional[str] = ''
    visit_datetime: Optional[str] = ''

@app.get("/api/categories-summary")
def get_categories_summary(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM categories")
    categories = cursor.fetchall()
    
    result = []
    for cat in categories:
        cat_dict = dict(cat)
        cursor.execute("SELECT * FROM zones WHERE category_id = ?", (cat['id'],))
        zones = cursor.fetchall()
        
        total_capacity = sum(z['safe_capacity'] for z in zones)
        total_occupancy = sum(z['current_occupancy'] for z in zones)
        
        zones_data = []
        for z in zones:
            z_id = z['id']
            cursor.execute("SELECT * FROM gateways WHERE zone_id = ?", (z_id,))
            gateways = cursor.fetchall()

            cursor.execute("SELECT * FROM tourist_spots WHERE zone_id = ?", (z_id,))
            spots = cursor.fetchall()

            z_dict = dict(z)
            z_dict['gateways'] = [dict(g) for g in gateways]
            z_dict['spots'] = [dict(s) for s in spots]
            z_dict['weather'] = ZONE_WEATHER.get(z_id, {
                "temp": "20°C", "condition": "Clear", "humidity": "60%", "wind": "10 km/h", "alert": "Normal Conditions"
            })
            zones_data.append(z_dict)
            
        cat_dict['total_capacity'] = total_capacity
        cat_dict['total_occupancy'] = total_occupancy
        cat_dict['zones'] = zones_data
        result.append(cat_dict)
        
    return result

@app.get("/api/permits")
def get_permits(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT p.*, z.name as zone_name, z.state as zone_state
        FROM permits p
        JOIN zones z ON p.zone_id = z.id
        ORDER BY p.id DESC
        LIMIT 50
    """)
    rows = cursor.fetchall()
    return [dict(r) for r in rows]

@app.get("/api/transport-flow")
def get_transport_flow():
    return {
        "railway": [
            {
                "route": "Kalka - Shimla Heritage Mountain Railway",
                "active_trains": 4,
                "passengers_today": 1280,
                "capacity_utilization": 94,
                "status": "ON_SCHEDULE"
            },
            {
                "route": "Nilgiri Mountain Toy Train (Mettupalayam - Ooty)",
                "active_trains": 2,
                "passengers_today": 620,
                "capacity_utilization": 98,
                "status": "HIGH_DEMAND"
            },
            {
                "route": "Pune - Lonavala Suburban Corridor",
                "active_trains": 8,
                "passengers_today": 4150,
                "capacity_utilization": 82,
                "status": "FLOWING"
            }
        ],
        "buses": [
            {
                "operator": "MSRTC (Maharashtra State Road Transport)",
                "active_fleet": 46,
                "passengers_today": 2340,
                "target_zone": "Lonavala & Western Ghats",
                "status": "NORMAL"
            },
            {
                "operator": "HRTC (Himachal Road Transport Corporation)",
                "active_fleet": 38,
                "passengers_today": 1820,
                "target_zone": "Shimla & Solang Valley",
                "status": "CONTROLLED_DISPATCH"
            },
            {
                "operator": "SETC (Tamil Nadu State Express)",
                "active_fleet": 24,
                "passengers_today": 1150,
                "target_zone": "Ooty & Nilgiris",
                "status": "NORMAL"
            }
        ],
        "vehicles": {
            "total_fastag_scans_today": 8420,
            "hourly_entry_velocity": 412,
            "hourly_exit_velocity": 385,
            "avg_dwell_time_hours": 4.2
        }
    }

@app.post("/api/fastag-webhook")
def fastag_webhook(payload: FastagWebhookPayload, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("BEGIN TRANSACTION")
    
    try:
        # Get zone_id for gateway
        cursor.execute("SELECT zone_id FROM gateways WHERE id = ?", (payload.gateway_id,))
        gateway = cursor.fetchone()
        if not gateway:
            raise HTTPException(status_code=404, detail="Gateway not found")
        
        zone_id = gateway['zone_id']
        
        # Update zone occupancy atomically
        modifier = payload.count if payload.type == 'ENTRY' else -payload.count
        cursor.execute("""
            UPDATE zones 
            SET current_occupancy = MAX(0, current_occupancy + ?) 
            WHERE id = ?
        """, (modifier, zone_id))
        
        # Insert scan log
        cursor.execute("""
            INSERT INTO scan_logs (permit_id, gateway_id, scan_type, verified, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (None, payload.gateway_id, f"FASTAG_{payload.type}", True, int(time.time())))
        
        # Fetch updated zone info
        cursor.execute("SELECT * FROM zones WHERE id = ?", (zone_id,))
        updated_zone = dict(cursor.fetchone())
        
        db.commit()
        return {"status": "success", "updated_zone": updated_zone}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sign-permit")
def sign_permit(payload: PermitPayload, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    now = int(time.time())

    # Migrate old DB: add columns if they don't exist yet
    try:
        cursor.execute("ALTER TABLE permits ADD COLUMN origin_from TEXT DEFAULT ''")
        db.commit()
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE permits ADD COLUMN visit_datetime TEXT DEFAULT ''")
        db.commit()
    except Exception:
        pass

    cursor.execute("""
        INSERT INTO permits (zone_id, vehicle_reg_number, vehicle_type, passenger_count, origin_from, visit_datetime, slot_start, slot_end, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        payload.zone_id,
        payload.vehicle_reg_number,
        payload.vehicle_type or 'Tourist Vehicle',
        payload.passenger_count,
        payload.origin_from or '',
        payload.visit_datetime or '',
        now,
        now + 86400,
        "ISSUED"
    ))
    permit_id = cursor.lastrowid
    db.commit()

    # Generate Ed25519 signed JWT with 30s TOTP salt concept
    token_payload = {
        "permit_id": permit_id,
        "zone_id": payload.zone_id,
        "vehicle_reg": payload.vehicle_reg_number,
        "passengers": payload.passenger_count,
        "origin_from": payload.origin_from or '',
        "visit_datetime": payload.visit_datetime or '',
        "exp": now + 30,
        "iat": now,
        "salt": os.urandom(8).hex()
    }

    token = jwt.encode(token_payload, private_key_bytes, algorithm="EdDSA")

    return {
        "permit_id": permit_id,
        "token": token,
        "public_key": public_key_bytes.decode('utf-8')
    }
