import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCX_OUTPUT = "EcoSync_Complete_Source_Code.docx"

FILES_TO_EXPORT = [
    # 1. Project Overview & Launchers
    ("README.md", "Documentation & Architecture Overview"),
    ("run_demo.bat", "Windows One-Click SIH Launcher"),
    ("package.json", "Node Dependencies & Scripts"),
    ("vite.config.ts", "Vite + PWA Configuration"),
    ("tailwind.config.ts", "Tailwind CSS & GoI Palette Configuration"),

    # 2. Backend (FastAPI + SQLite + Ed25519)
    ("backend/requirements.txt", "Backend Python Dependencies"),
    ("backend/main.py", "FastAPI Main Application & REST Endpoints"),
    ("backend/crypto_utils.py", "Ed25519 Cryptographic Signing & Verification Engine"),
    ("backend/db.py", "SQLite Database Initialization & Spatial Seed Data"),

    # 3. Core Libraries & Crypto
    ("src/lib/types.ts", "TypeScript Schema & Type Definitions"),
    ("src/lib/utils.ts", "IST Timezone, Vehicle Formatting & Math Utilities"),
    ("src/lib/api.ts", "Unified FastAPI Client with Fallback Handler"),
    ("src/lib/env.ts", "Environment Detection Module"),
    ("src/lib/idb.ts", "IndexedDB Offline Storage & Public Key Cache"),
    ("src/lib/mockData.ts", "In-Memory Demonstration Datasets"),
    ("src/crypto/permitCrypto.ts", "Client-Side Cryptographic Token & Grace Window Engine"),

    # 4. State Stores
    ("src/stores/authStore.ts", "Authentication & RBAC Store"),
    ("src/stores/zoneStore.ts", "Zone Capacity & Telemetry State Store"),
    ("src/stores/permitStore.ts", "Permit Generation & Lifecycle Store"),
    ("src/stores/scanStore.ts", "Guard Offline Queue & Synchronization Store"),

    # 5. Shared Components
    ("src/components/QRDisplay.tsx", "Dynamic 30-Second Refreshing QR Component"),
    ("src/components/CapacityBar.tsx", "Carrying Capacity Visual Progress Component"),
    ("src/components/HazardModal.tsx", "Emergency Kill Switch Modal Component"),
    ("src/components/ZoneMap.tsx", "Leaflet GeoJSON Sanctuary Map Component"),
    ("src/components/NavBar.tsx", "Government of India Navigation Bar"),
    ("src/components/AuthGuard.tsx", "Route Protection Guard & Sign-In Form"),
    ("src/components/LoadingSpinner.tsx", "Branded Loading Indicator"),

    # 6. Tourist Portal Interface
    ("src/routes/Tourist/index.tsx", "Tourist E-Pass Portal (Wizard Controller)"),
    ("src/routes/Tourist/ZoneSelector.tsx", "Ecological Sensitive Zone Grid Selector"),
    ("src/routes/Tourist/BookingForm.tsx", "Vehicle & Time Slot Reservation Form"),
    ("src/routes/Tourist/YieldBanner.tsx", "High-Demand Reroute & 20% Discount Banner"),
    ("src/routes/Tourist/EPassView.tsx", "Digital E-Pass High-Contrast Display"),

    # 7. Authority Dashboard Interface
    ("src/routes/Authority/index.tsx", "NDMA Command & Disaster Dashboard Root"),
    ("src/routes/Authority/StatCards.tsx", "Macro Telemetry KPI Metric Cards"),
    ("src/routes/Authority/ZoneControlPanel.tsx", "Interactive Zone Capacity & Lockdown Table"),
    ("src/routes/Authority/ScanFeed.tsx", "Real-Time Entry/Exit Audit Ledger Feed"),

    # 8. Guard Scanner PWA Interface
    ("src/routes/Scanner/index.tsx", "Checkpost Guard Scanner PWA Root"),
    ("src/routes/Scanner/QRScanner.tsx", "ZXing Optical Camera Viewport with Crosshairs"),
    ("src/routes/Scanner/ResultBanner.tsx", "Tactile Green/Red/Yellow Verification Banner"),
    ("src/routes/Scanner/OfflineQueue.tsx", "0-Bars Mountain Offline Queue & Sync Dock"),

    # 9. App Shell, PWA & SQL Migration
    ("src/App.tsx", "React Root Router & Route Configuration"),
    ("src/main.tsx", "React 18 Application Mount Point"),
    ("src/index.css", "Global Styles, Tricolor Stripes & Design Tokens"),
    ("public/manifest.json", "Progressive Web App Manifest"),
    ("public/sw.js", "Offline Service Worker Strategy"),
    ("supabase/migrations/001_ecosync_schema.sql", "PostgreSQL 16 + PostGIS SQL Schema & RLS"),
]

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def create_document():
    doc = docx.Document()

    # Set normal margins
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    # ── COVER HEADER ─────────────────────────────────────────────────────────
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_p.add_run("EcoSync")
    title_run.font.size = Pt(28)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(26, 35, 126) # GoI Navy #1A237E

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_run = sub_p.add_run("Government of India Digital Public Infrastructure (DPI) Prototype\nComplete System Architecture & Source Code Documentation")
    sub_run.font.size = Pt(14)
    sub_run.font.color.rgb = RGBColor(255, 111, 0) # Saffron #FF6F00
    sub_run.font.bold = True

    desc_p = doc.add_paragraph()
    desc_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    desc_run = desc_p.add_run("Target: Smart India Hackathon (SIH) | Stack: FastAPI (Python 3.13) + SQLite + React 18 (Vite) + Tailwind CSS + Ed25519 Cryptography")
    desc_run.font.size = Pt(9.5)
    desc_run.font.italic = True
    desc_run.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # ── TABLE OF CONTENTS / SUMMARY TABLE ────────────────────────────────────
    h2 = doc.add_heading("1. Source Code Manifest & File Inventory", level=1)
    h2.runs[0].font.color.rgb = RGBColor(26, 35, 126)

    table = doc.add_table(rows=1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = "#"
    hdr_cells[1].text = "File Path"
    hdr_cells[2].text = "Module Description"

    for c in hdr_cells:
        set_cell_background(c, "1A237E")
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                r.font.size = Pt(9.5)

    for idx, (fpath, fdesc) in enumerate(FILES_TO_EXPORT, 1):
        row_cells = table.add_row().cells
        row_cells[0].text = str(idx)
        row_cells[1].text = fpath
        row_cells[2].text = fdesc

        bg = "F8FAFC" if idx % 2 == 0 else "FFFFFF"
        for c in row_cells:
            set_cell_background(c, bg)
            for p in c.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(8.5)
                    if c == row_cells[1]:
                        r.font.name = "Consolas"

    doc.add_page_break()

    # ── EXPORT EACH FILE'S CODE ──────────────────────────────────────────────
    h_code = doc.add_heading("2. Full Source Code Repository", level=1)
    h_code.runs[0].font.color.rgb = RGBColor(26, 35, 126)

    for idx, (fpath, fdesc) in enumerate(FILES_TO_EXPORT, 1):
        full_path = os.path.abspath(fpath)
        if not os.path.exists(full_path):
            continue

        try:
            with open(full_path, "r", encoding="utf-8") as f:
                code_content = f.read()
        except Exception as e:
            code_content = f"// Error reading file: {e}"

        # File Heading
        h_file = doc.add_heading(f"2.{idx} {fpath}", level=2)
        h_file.runs[0].font.color.rgb = RGBColor(0, 105, 92) # Eco Green
        h_file.runs[0].font.size = Pt(13)

        desc_p = doc.add_paragraph()
        desc_p.paragraph_format.space_after = Pt(4)
        run_desc = desc_p.add_run(f"Description: {fdesc}")
        run_desc.font.size = Pt(9.5)
        run_desc.font.italic = True
        run_desc.font.color.rgb = RGBColor(71, 85, 105)

        # Code Block container (single-cell table for clean background box)
        code_table = doc.add_table(rows=1, cols=1)
        code_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = code_table.rows[0].cells[0]
        set_cell_background(cell, "F1F5F9") # Soft light slate background

        # Populate lines
        lines = code_content.splitlines()
        p_code = cell.paragraphs[0]
        p_code.paragraph_format.line_spacing = 1.05
        p_code.paragraph_format.space_after = Pt(0)
        p_code.paragraph_format.space_before = Pt(0)

        # Write code lines (with line numbering for high readability)
        code_text = "\n".join(f"{i+1:4d} | {line}" for i, line in enumerate(lines))
        run_code = p_code.add_run(code_text)
        run_code.font.name = "Consolas"
        run_code.font.size = Pt(7.5)
        run_code.font.color.rgb = RGBColor(15, 23, 42)

        doc.add_paragraph().paragraph_format.space_after = Pt(12)

    doc.save(DOCX_OUTPUT)
    print(f"SUCCESS: Exported {len(FILES_TO_EXPORT)} files to {os.path.abspath(DOCX_OUTPUT)}")

if __name__ == "__main__":
    create_document()
