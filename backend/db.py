"""
EcoSync SQLite Database & Spatial Seed
Creates local ecosync.db file on first run. Zero configuration required.
"""

import sqlite3
import json
from datetime import datetime, timezone

DB_FILE = "ecosync.db"

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Zones Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS zones (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        state TEXT NOT NULL,
        safe_capacity INTEGER NOT NULL,
        current_occupancy INTEGER NOT NULL DEFAULT 0,
        hazard_level TEXT NOT NULL DEFAULT 'NORMAL',
        status TEXT NOT NULL DEFAULT 'OPEN',
        weather_status TEXT NOT NULL DEFAULT 'Clear',
        fastag_gateways INTEGER NOT NULL DEFAULT 3,
        boundary JSON,
        updated_at TEXT NOT NULL
    )
    """)

    # Permits Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS permits (
        id TEXT PRIMARY KEY,
        tourist_id TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        vehicle_reg_number TEXT NOT NULL,
        slot_start TEXT NOT NULL,
        slot_end TEXT NOT NULL,
        passenger_count INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        signed_token TEXT,
        discount_applied INTEGER NOT NULL DEFAULT 0,
        discount_percent INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
    )
    """)

    # Scan Logs Table (Audit ledger)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scan_logs (
        id TEXT PRIMARY KEY,
        permit_id TEXT NOT NULL,
        guard_id TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        scan_type TEXT NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0,
        failure_reason TEXT,
        client_salt INTEGER,
        offline_captured_at TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Check if zones need seeding
    cursor.execute("SELECT COUNT(*) FROM zones")
    count = cursor.fetchone()[0]
    now_iso = datetime.now(timezone.utc).isoformat()

    if count == 0:
        seed_zones = [
            ("zone-kedarnath", "Kedarnath Wildlife Sanctuary", "Uttarakhand", 500, 425, "WARNING", "RESTRICTED", "Partly Cloudy", 3,
             json.dumps({"type": "Polygon", "coordinates": [[[79.00, 30.70], [79.10, 30.70], [79.10, 30.80], [79.00, 30.80], [79.00, 30.70]]]}), now_iso),
            ("zone-mudumalai", "Mudumalai Tiger Reserve", "Tamil Nadu", 800, 312, "NORMAL", "OPEN", "Clear", 5,
             json.dumps({"type": "Polygon", "coordinates": [[[76.50, 11.50], [76.70, 11.50], [76.70, 11.70], [76.50, 11.70], [76.50, 11.50]]]}), now_iso),
            ("zone-ghnp", "Great Himalayan National Park", "Himachal Pradesh", 350, 89, "NORMAL", "OPEN", "Sunny", 2,
             json.dumps({"type": "Polygon", "coordinates": [[[77.20, 31.70], [77.40, 31.70], [77.40, 31.90], [77.20, 31.90], [77.20, 31.70]]]}), now_iso),
            ("zone-sundarbans", "Sundarbans Biosphere Reserve", "West Bengal", 600, 571, "WARNING", "RESTRICTED", "Humid & Hazy", 4,
             json.dumps({"type": "Polygon", "coordinates": [[[88.70, 21.80], [89.00, 21.80], [89.00, 22.00], [88.70, 22.00], [88.70, 21.80]]]}), now_iso),
            ("zone-kaziranga", "Kaziranga National Park", "Assam", 400, 45, "NORMAL", "OPEN", "Light Rain", 3,
             json.dumps({"type": "Polygon", "coordinates": [[[93.10, 26.50], [93.30, 26.50], [93.30, 26.70], [93.10, 26.70], [93.10, 26.50]]]}), now_iso),
            ("zone-vof", "Valley of Flowers", "Uttarakhand", 200, 200, "LOCKDOWN", "CLOSED", "Heavy Rain & Landslide Risk", 1,
             json.dumps({"type": "Polygon", "coordinates": [[[79.60, 30.70], [79.70, 30.70], [79.70, 30.80], [79.60, 30.80], [79.60, 30.70]]]}), now_iso),
            ("zone-corbett", "Jim Corbett National Park", "Uttarakhand", 700, 390, "NORMAL", "OPEN", "Clear", 6,
             json.dumps({"type": "Polygon", "coordinates": [[[78.70, 29.50], [78.90, 29.50], [78.90, 29.70], [78.70, 29.70], [78.70, 29.50]]]}), now_iso),
            ("zone-ranthambore", "Ranthambore Tiger Reserve", "Rajasthan", 450, 411, "WARNING", "RESTRICTED", "Sunny & Hot", 4,
             json.dumps({"type": "Polygon", "coordinates": [[[76.30, 25.90], [76.50, 25.90], [76.50, 26.10], [76.30, 26.10], [76.30, 25.90]]]}), now_iso)
        ]
        cursor.executemany("""
        INSERT INTO zones (id, name, state, safe_capacity, current_occupancy, hazard_level, status, weather_status, fastag_gateways, boundary, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_zones)

        # Seed sample active permit
        cursor.execute("""
        INSERT INTO permits (id, tourist_id, zone_id, vehicle_reg_number, slot_start, slot_end, passenger_count, status, discount_applied, discount_percent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "permit-demo-01",
            "user-tourist-1",
            "zone-mudumalai",
            "TN-38-AB-1234",
            now_iso,
            datetime.fromtimestamp(datetime.now(timezone.utc).timestamp() + 21600, tz=timezone.utc).isoformat(),
            4,
            "ACTIVE",
            0,
            0,
            now_iso
        ))

    conn.commit()
    conn.close()
