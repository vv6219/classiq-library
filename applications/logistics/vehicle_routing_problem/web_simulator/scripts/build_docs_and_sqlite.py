"""Build script to export OpenAPI JSON, Swagger UI, ReDoc, SQLite Web Studio, and dispatchengine.db
into web_simulator/public and web_simulator/dist directories for Firebase Hosting and local serving.
"""

from __future__ import annotations
import os
import shutil
import sys
from pathlib import Path

# Paths
current_dir = Path(__file__).resolve().parent
web_sim_dir = current_dir.parent
vrp_dir = web_sim_dir.parent
engine_dir = vrp_dir / "DispatchEngine"
public_dir = web_sim_dir / "public"
dist_dir = web_sim_dir / "dist"

if str(vrp_dir) not in sys.path:
    sys.path.insert(0, str(vrp_dir))

from DispatchEngine.api.openapi_spec import export_openapi_json

def generate_swagger_html(openapi_url: str = "/openapi.json", title: str = "DispatchEngine API - Swagger UI") -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://fastapi.tiangolo.com/img/favicon.png" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <style>
    * {{
      box-sizing: border-box;
    }}
    body {{
      margin: 0;
      background: #090d16;
      color: #e2e8f0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }}
    /* Top Navigation HUD */
    .engine-nav {{
      background: #0f172a;
      border-bottom: 1px solid rgba(56, 189, 248, 0.25);
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      position: sticky;
      top: 0;
      z-index: 1000;
    }}
    .engine-brand {{
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
    }}
    .engine-logo-badge {{
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #040812;
      font-weight: 800;
      font-size: 13px;
      padding: 5px 9px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      font-family: 'JetBrains Mono', monospace;
    }}
    .engine-title {{
      font-size: 15px;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.2px;
    }}
    .engine-subtitle {{
      font-size: 11px;
      color: #38bdf8;
      font-weight: 500;
    }}
    .nav-links {{
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }}
    .nav-btn {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
    }}
    .nav-btn-active {{
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.4);
    }}
    .nav-btn-idle {{
      background: rgba(255, 255, 255, 0.04);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }}
    .nav-btn-idle:hover {{
      background: rgba(255, 255, 255, 0.08);
      color: #f1f5f9;
      border-color: rgba(255, 255, 255, 0.2);
    }}
    .nav-btn-accent {{
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3));
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }}
    .nav-btn-accent:hover {{
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.45));
      color: #6ee7b7;
    }}
    /* Swagger Customizations */
    .swagger-ui {{
      background: #090d16;
      color: #e2e8f0;
      padding-bottom: 60px;
    }}
    .swagger-ui .topbar {{
      display: none !important;
    }}
    .swagger-ui .info {{
      margin: 25px 0 20px 0;
    }}
    .swagger-ui .info .title {{
      color: #f8fafc;
      font-weight: 800;
      font-size: 28px;
    }}
    .swagger-ui .info p, .swagger-ui .info li {{
      color: #94a3b8;
    }}
    .swagger-ui .scheme-container {{
      background: #0f172a;
      box-shadow: none;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      margin-bottom: 20px;
      padding: 12px 20px;
    }}
    .swagger-ui .opblock-tag {{
      color: #f1f5f9 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      font-size: 18px;
      font-weight: 700;
    }}
    .swagger-ui .opblock {{
      background: #0f172a !important;
      border-radius: 8px;
      margin-bottom: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
    }}
    .swagger-ui .opblock .opblock-summary {{
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }}
    .swagger-ui .opblock-summary-path {{
      color: #f8fafc !important;
      font-family: 'JetBrains Mono', monospace !important;
    }}
    .swagger-ui .opblock-description-wrapper p, .swagger-ui .opblock-external-docs-wrapper p, .swagger-ui .opblock-title_normal p {{
      color: #94a3b8;
    }}
    .swagger-ui table thead tr td, .swagger-ui table thead tr th {{
      color: #cbd5e1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }}
    .swagger-ui .parameter__name {{
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
    }}
    .swagger-ui .parameter__type {{
      color: #a78bfa;
    }}
    .swagger-ui input[type=text], .swagger-ui textarea, .swagger-ui select {{
      background: #1e293b !important;
      color: #f8fafc !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      border-radius: 6px !important;
    }}
    .swagger-ui .btn {{
      border-radius: 6px !important;
      font-family: 'Inter', sans-serif !important;
      font-weight: 600 !important;
    }}
    .swagger-ui .btn.execute {{
      background-color: #0284c7 !important;
      border-color: #0284c7 !important;
      color: #fff !important;
    }}
    .swagger-ui .model-box {{
      background: #0f172a !important;
    }}
    .swagger-ui section.models {{
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 8px;
      background: #0f172a;
    }}
    .swagger-ui section.models h4 {{
      color: #f1f5f9;
    }}
  </style>
</head>
<body>
  <nav class="engine-nav">
    <a href="/" class="engine-brand">
      <span class="engine-logo-badge">VRP-Q</span>
      <div>
        <div class="engine-title">DispatchEngine API Documentation</div>
        <div class="engine-subtitle">Extended Rich Multi-Depot VRPTW &middot; Classiq Quantum Co-Processor</div>
      </div>
    </a>
    <div class="nav-links">
      <a href="/" class="nav-btn nav-btn-idle">&larr; 3D Digital Twin Simulator</a>
      <a href="/docs" class="nav-btn nav-btn-active">📖 Swagger UI</a>
      <a href="/redoc" class="nav-btn nav-btn-idle">📕 ReDoc</a>
      <a href="/sqlite" class="nav-btn nav-btn-idle">💾 SQLite Studio</a>
      <a href="/openapi.json" target="_blank" class="nav-btn nav-btn-idle">📄 OpenAPI 3.1.0</a>
      <a href="/dispatchengine.db" download class="nav-btn nav-btn-accent">📥 dispatchengine.db (626 KB)</a>
    </div>
  </nav>

  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = () => {{
      window.ui = SwaggerUIBundle({{
        url: '{openapi_url}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        docExpansion: "list",
        filter: true,
        showRequestDuration: true,
        tryItOutEnabled: true,
      }});
    }};
  </script>
</body>
</html>
"""

def generate_redoc_html(openapi_url: str = "/openapi.json", title: str = "DispatchEngine API - ReDoc") -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <link rel="icon" type="image/png" href="https://fastapi.tiangolo.com/img/favicon.png" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      padding: 0;
      background: #0f172a;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }}
    .engine-nav {{
      background: #0f172a;
      border-bottom: 1px solid rgba(56, 189, 248, 0.25);
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      position: sticky;
      top: 0;
      z-index: 1000;
    }}
    .engine-brand {{
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
    }}
    .engine-logo-badge {{
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #040812;
      font-weight: 800;
      font-size: 13px;
      padding: 5px 9px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      font-family: 'JetBrains Mono', monospace;
    }}
    .engine-title {{
      font-size: 15px;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.2px;
    }}
    .engine-subtitle {{
      font-size: 11px;
      color: #38bdf8;
      font-weight: 500;
    }}
    .nav-links {{
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }}
    .nav-btn {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
    }}
    .nav-btn-active {{
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.4);
    }}
    .nav-btn-idle {{
      background: rgba(255, 255, 255, 0.04);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }}
    .nav-btn-idle:hover {{
      background: rgba(255, 255, 255, 0.08);
      color: #f1f5f9;
      border-color: rgba(255, 255, 255, 0.2);
    }}
    .nav-btn-accent {{
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3));
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }}
    .nav-btn-accent:hover {{
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.45));
      color: #6ee7b7;
    }}
  </style>
</head>
<body>
  <nav class="engine-nav">
    <a href="/" class="engine-brand">
      <span class="engine-logo-badge">VRP-Q</span>
      <div>
        <div class="engine-title">DispatchEngine ReDoc Documentation</div>
        <div class="engine-subtitle">Extended Rich Multi-Depot VRPTW &middot; Classiq Quantum Co-Processor</div>
      </div>
    </a>
    <div class="nav-links">
      <a href="/" class="nav-btn nav-btn-idle">&larr; 3D Digital Twin Simulator</a>
      <a href="/docs" class="nav-btn nav-btn-idle">📖 Swagger UI</a>
      <a href="/redoc" class="nav-btn nav-btn-active">📕 ReDoc</a>
      <a href="/sqlite" class="nav-btn nav-btn-idle">💾 SQLite Studio</a>
      <a href="/openapi.json" target="_blank" class="nav-btn nav-btn-idle">📄 OpenAPI 3.1.0</a>
      <a href="/dispatchengine.db" download class="nav-btn nav-btn-accent">📥 dispatchengine.db (626 KB)</a>
    </div>
  </nav>

  <redoc spec-url='{openapi_url}'></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>
"""

def generate_sqlite_html() -> str:
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DispatchEngine SQLite Database Studio | WebAssembly Browser Viewer</title>
  <link rel="icon" type="image/png" href="https://fastapi.tiangolo.com/img/favicon.png" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <!-- sql.js (WebAssembly SQLite) -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: #090d16;
      color: #e2e8f0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    /* Top Navigation */
    .engine-nav {
      background: #0f172a;
      border-bottom: 1px solid rgba(56, 189, 248, 0.25);
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .engine-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
    }
    .engine-logo-badge {
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #040812;
      font-weight: 800;
      font-size: 13px;
      padding: 5px 9px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      font-family: 'JetBrains Mono', monospace;
    }
    .engine-title {
      font-size: 15px;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.2px;
    }
    .engine-subtitle {
      font-size: 11px;
      color: #38bdf8;
      font-weight: 500;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .nav-btn-active {
      background: rgba(16, 185, 129, 0.18);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.45);
    }
    .nav-btn-idle {
      background: rgba(255, 255, 255, 0.04);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .nav-btn-idle:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #f1f5f9;
      border-color: rgba(255, 255, 255, 0.2);
    }
    .nav-btn-accent {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.3));
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.4);
    }
    .nav-btn-accent:hover {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(14, 165, 233, 0.45));
      color: #7dd3fc;
    }

    /* Main Container */
    .studio-container {
      display: flex;
      flex: 1;
      overflow: hidden;
      height: calc(100vh - 61px);
    }

    /* Left Sidebar: Tables & Presets */
    .studio-sidebar {
      width: 320px;
      background: #0f172a;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      flex-shrink: 0;
    }
    .sidebar-section {
      padding: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .sidebar-heading {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .db-status-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
    }
    .db-status-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .db-status-row:last-child {
      margin-bottom: 0;
    }
    .db-status-label {
      color: #94a3b8;
    }
    .db-status-val {
      color: #f1f5f9;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }

    /* Table Item List */
    .table-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-radius: 6px;
      color: #cbd5e1;
      font-size: 13px;
      cursor: pointer;
      margin-bottom: 4px;
      transition: all 0.15s ease;
      font-family: 'JetBrains Mono', monospace;
      border: 1px solid transparent;
    }
    .table-item:hover {
      background: rgba(56, 189, 248, 0.08);
      color: #38bdf8;
      border-color: rgba(56, 189, 248, 0.2);
    }
    .table-item.active {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border-color: rgba(56, 189, 248, 0.4);
      font-weight: 700;
    }
    .table-badge {
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 11px;
      color: #94a3b8;
    }

    /* Preset Queries */
    .preset-btn {
      display: block;
      width: 100%;
      text-align: left;
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      color: #94a3b8;
      font-size: 12px;
      cursor: pointer;
      margin-bottom: 6px;
      transition: all 0.15s ease;
      font-family: 'Inter', sans-serif;
    }
    .preset-btn:hover {
      background: rgba(168, 85, 247, 0.1);
      color: #c084fc;
      border-color: rgba(168, 85, 247, 0.3);
    }

    /* Right Main Console */
    .studio-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #090d16;
    }

    /* Query Editor Header */
    .editor-pane {
      background: #0d1322;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .editor-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }
    .editor-title {
      font-size: 13px;
      font-weight: 700;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sql-input {
      width: 100%;
      min-height: 90px;
      background: #070a12;
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 8px;
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      line-height: 1.5;
      padding: 12px 14px;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .sql-input:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
    }

    .btn-run {
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 10px rgba(14, 165, 233, 0.3);
    }
    .btn-run:hover {
      background: linear-gradient(135deg, #0369a1, #0284c7);
      box-shadow: 0 4px 14px rgba(14, 165, 233, 0.5);
    }

    .btn-action {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-action:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #f8fafc;
    }

    /* Results Header & Grid */
    .results-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 16px 20px;
    }
    .results-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .results-meta {
      font-size: 12px;
      color: #94a3b8;
      font-family: 'JetBrains Mono', monospace;
    }
    .results-meta span {
      color: #34d399;
      font-weight: 700;
    }
    .table-filter-input {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      padding: 5px 10px;
      color: #f1f5f9;
      font-size: 12px;
      width: 200px;
      outline: none;
    }
    .table-filter-input:focus {
      border-color: #38bdf8;
    }

    .table-scroll-container {
      flex: 1;
      overflow: auto;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      background: #0c101c;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      text-align: left;
    }
    table.data-table th {
      background: #131b2e;
      color: #38bdf8;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(56, 189, 248, 0.25);
      position: sticky;
      top: 0;
      z-index: 10;
      font-weight: 700;
      letter-spacing: 0.2px;
      white-space: nowrap;
    }
    table.data-table td {
      padding: 8px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
      white-space: nowrap;
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    table.data-table tr:hover td {
      background: rgba(56, 189, 248, 0.04);
      color: #f8fafc;
    }

    /* Loading Overlay */
    #loadingOverlay {
      position: fixed;
      inset: 0;
      background: rgba(9, 13, 22, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 9999;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(56, 189, 248, 0.2);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="loadingOverlay">
    <div class="spinner"></div>
    <div style="font-size: 15px; font-weight: 700; color: #f8fafc;">Loading DispatchEngine SQLite Database...</div>
    <div style="font-size: 12px; color: #94a3b8;">Initializing WebAssembly SQL engine & reading dispatchengine.db (626 KB)</div>
  </div>

  <nav class="engine-nav">
    <a href="/" class="engine-brand">
      <span class="engine-logo-badge">SQLITE-WASM</span>
      <div>
        <div class="engine-title">DispatchEngine SQLite Database Studio</div>
        <div class="engine-subtitle">WebAssembly Direct Query Engine &middot; Real-Time Schema Explorer</div>
      </div>
    </a>
    <div class="nav-links">
      <a href="/" class="nav-btn nav-btn-idle">&larr; 3D Digital Twin Simulator</a>
      <a href="/docs" class="nav-btn nav-btn-idle">📖 Swagger UI</a>
      <a href="/redoc" class="nav-btn nav-btn-idle">📕 ReDoc</a>
      <a href="/sqlite" class="nav-btn nav-btn-active">💾 SQLite Studio</a>
      <a href="/openapi.json" target="_blank" class="nav-btn nav-btn-idle">📄 OpenAPI 3.1.0</a>
      <a href="/dispatchengine.db" download class="nav-btn nav-btn-accent">📥 Download DB (626 KB)</a>
    </div>
  </nav>

  <div class="studio-container">
    <!-- Left Sidebar -->
    <aside class="studio-sidebar">
      <div class="sidebar-section">
        <div class="sidebar-heading">Database Status</div>
        <div class="db-status-card">
          <div class="db-status-row">
            <span class="db-status-label">Database File:</span>
            <span class="db-status-val">dispatchengine.db</span>
          </div>
          <div class="db-status-row">
            <span class="db-status-label">Engine:</span>
            <span class="db-status-val" style="color: #38bdf8;">SQLite 3 (WASM)</span>
          </div>
          <div class="db-status-row">
            <span class="db-status-label">File Size:</span>
            <span class="db-status-val">626.7 KB</span>
          </div>
          <div class="db-status-row">
            <span class="db-status-label">Total Tables:</span>
            <span class="db-status-val" id="totalTablesCount">--</span>
          </div>
          <div class="db-status-row">
            <span class="db-status-label">Total Rows:</span>
            <span class="db-status-val" id="totalRowsCount" style="color: #34d399;">--</span>
          </div>
        </div>
      </div>

      <div class="sidebar-section" style="flex: 1;">
        <div class="sidebar-heading">
          <span>Tables</span>
          <span style="font-size: 10px; color: #64748b;">Click to view</span>
        </div>
        <div id="tableListContainer"></div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-heading">Preset Query Dossiers</div>
        <button class="preset-btn" onclick="runPreset('SELECT * FROM scenarios LIMIT 20;')">
          📁 All Scenarios Summary
        </button>
        <button class="preset-btn" onclick="runPreset('SELECT run_id, scenario_id, operational_mode, total_fleet_makespan_sec, total_distance_km, falsification_ratio_phi FROM execution_runs ORDER BY start_time DESC LIMIT 10;')">
          ⚡ Execution Runs & Metrics
        </button>
        <button class="preset-btn" onclick="runPreset('SELECT * FROM quantum_telemetry WHERE qubits_used > 0 LIMIT 20;')">
          ⚛️ Quantum Telemetry & Circuits
        </button>
        <button class="preset-btn" onclick="runPreset('SELECT algorithm_name, runtime_ms, total_cost_sek, battery_deficit_kwh, packing_volume_ratio FROM algorithm_benchmarks;')">
          📊 Algorithm Benchmark Matrix
        </button>
        <button class="preset-btn" onclick="runPreset('SELECT * FROM gate_validations WHERE passed = 0 OR is_falsified = 1;')">
          🛡️ Invariant Gate Violations
        </button>
        <button class="preset-btn" onclick="runPreset('SELECT placement_id, vehicle_id, box_x_m, box_y_m, box_z_m, is_hazard FROM container_placements WHERE is_hazard = 1 LIMIT 30;')">
          📦 3D Hazard Box Placements
        </button>
      </div>
    </aside>

    <!-- Right Main Workspace -->
    <main class="studio-main">
      <div class="editor-pane">
        <div class="editor-toolbar">
          <div class="editor-title">
            <span style="color: #38bdf8;">SQL Query Console</span>
            <span style="font-size: 11px; color: #64748b; font-weight: 500;">(Press Ctrl+Enter to execute)</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-action" onclick="formatQuery()">Format SQL</button>
            <button class="btn-run" onclick="executeCurrentQuery()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Execute Query
            </button>
          </div>
        </div>
        <textarea id="sqlQueryInput" class="sql-input" placeholder="SELECT * FROM scenarios LIMIT 50;"></textarea>
      </div>

      <div class="results-pane">
        <div class="results-header">
          <div class="results-meta" id="resultsMeta">
            Ready to execute query.
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" id="filterInput" class="table-filter-input" placeholder="Filter rows in view..." oninput="filterCurrentTable()" />
            <button class="btn-action" onclick="exportCSV()">Export CSV</button>
            <button class="btn-action" onclick="exportJSON()">Export JSON</button>
          </div>
        </div>

        <div class="table-scroll-container">
          <table class="data-table" id="dataTable">
            <thead id="dataThead"></thead>
            <tbody id="dataTbody"></tbody>
          </table>
        </div>
      </div>
    </main>
  </div>

  <script>
    let dbInstance = null;
    let currentResultData = { columns: [], values: [] };
    let activeTableName = '';

    async function initDatabase() {
      try {
        const SQL = await initSqlJs({
          locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
        });

        const res = await fetch('/dispatchengine.db');
        if (!res.ok) {
          throw new Error('Failed to fetch /dispatchengine.db: ' + res.statusText);
        }
        const buffer = await res.arrayBuffer();
        dbInstance = new SQL.Database(new Uint8Array(buffer));

        // Load Tables
        loadTableList();

        // Default query: Top scenarios
        runPreset('SELECT * FROM scenarios LIMIT 20;');

        document.getElementById('loadingOverlay').style.display = 'none';
      } catch (err) {
        console.error(err);
        document.getElementById('loadingOverlay').innerHTML = `
          <div style="color: #ef4444; font-weight: 700; font-size: 16px;">Error Loading SQLite Database</div>
          <div style="color: #94a3b8; font-size: 13px; max-width: 500px; text-align: center;">${err.message}</div>
          <button class="btn-run" style="margin-top: 10px;" onclick="location.reload()">Retry</button>
        `;
      }
    }

    function loadTableList() {
      const tablesRes = dbInstance.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
      if (!tablesRes.length) return;

      const tables = tablesRes[0].values.map(r => r[0]);
      document.getElementById('totalTablesCount').innerText = tables.length;

      let totalRows = 0;
      const listContainer = document.getElementById('tableListContainer');
      listContainer.innerHTML = '';

      tables.forEach(tableName => {
        let count = 0;
        try {
          const cRes = dbInstance.exec(`SELECT COUNT(*) FROM "${tableName}";`);
          if (cRes.length && cRes[0].values.length) {
            count = cRes[0].values[0][0];
            totalRows += count;
          }
        } catch (e) {}

        const item = document.createElement('div');
        item.className = 'table-item';
        item.id = 'tbl_' + tableName;
        item.innerHTML = `
          <span>${tableName}</span>
          <span class="table-badge">${count}</span>
        `;
        item.onclick = () => selectAndLoadTable(tableName);
        listContainer.appendChild(item);
      });

      document.getElementById('totalRowsCount').innerText = totalRows.toLocaleString();
    }

    function selectAndLoadTable(tableName) {
      activeTableName = tableName;
      document.querySelectorAll('.table-item').forEach(el => el.classList.remove('active'));
      const activeEl = document.getElementById('tbl_' + tableName);
      if (activeEl) activeEl.classList.add('active');

      const query = `SELECT * FROM "${tableName}" LIMIT 50;`;
      document.getElementById('sqlQueryInput').value = query;
      executeCurrentQuery();
    }

    function runPreset(query) {
      document.getElementById('sqlQueryInput').value = query;
      executeCurrentQuery();
    }

    function executeCurrentQuery() {
      const sql = document.getElementById('sqlQueryInput').value.trim();
      if (!sql || !dbInstance) return;

      const startTime = performance.now();
      try {
        const results = dbInstance.exec(sql);
        const elapsed = (performance.now() - startTime).toFixed(2);

        if (!results.length) {
          currentResultData = { columns: [], values: [] };
          renderTable([], []);
          document.getElementById('resultsMeta').innerHTML = `Query completed in <span>${elapsed} ms</span>. (0 rows returned)`;
          return;
        }

        const res = results[0];
        currentResultData = { columns: res.columns, values: res.values };
        renderTable(res.columns, res.values);
        document.getElementById('resultsMeta').innerHTML = `Query completed in <span>${elapsed} ms</span> &middot; <span>${res.values.length}</span> rows &times; <span>${res.columns.length}</span> columns.`;
      } catch (err) {
        document.getElementById('resultsMeta').innerHTML = `<span style="color: #ef4444;">SQL Error: ${err.message}</span>`;
      }
    }

    function renderTable(columns, rows) {
      const thead = document.getElementById('dataThead');
      const tbody = document.getElementById('dataTbody');

      if (!columns.length) {
        thead.innerHTML = '';
        tbody.innerHTML = '<tr><td style="text-align: center; padding: 30px; color: #64748b;">No results to display.</td></tr>';
        return;
      }

      thead.innerHTML = '<tr>' + columns.map(c => `<th>${c}</th>`).join('') + '</tr>';
      tbody.innerHTML = rows.map(r => {
        return '<tr>' + r.map(val => {
          let strVal = val === null ? '<span style="color: #64748b; font-style: italic;">NULL</span>' : String(val);
          return `<td>${strVal}</td>`;
        }).join('') + '</tr>';
      }).join('');
    }

    function filterCurrentTable() {
      const query = document.getElementById('filterInput').value.toLowerCase();
      if (!currentResultData.values.length) return;

      if (!query) {
        renderTable(currentResultData.columns, currentResultData.values);
        return;
      }

      const filtered = currentResultData.values.filter(row => {
        return row.some(cell => String(cell).toLowerCase().includes(query));
      });
      renderTable(currentResultData.columns, filtered);
    }

    function exportCSV() {
      if (!currentResultData.columns.length) return;
      const csvLines = [];
      csvLines.push(currentResultData.columns.map(c => `"${c}"`).join(','));
      currentResultData.values.forEach(row => {
        csvLines.push(row.map(val => `"${val !== null ? String(val).replace(/"/g, '""') : ''}"`).join(','));
      });
      const blob = new Blob([csvLines.join('\\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    function exportJSON() {
      if (!currentResultData.columns.length) return;
      const jsonArr = currentResultData.values.map(row => {
        const obj = {};
        currentResultData.columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
      const blob = new Blob([JSON.stringify(jsonArr, null, 2)], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    function formatQuery() {
      const input = document.getElementById('sqlQueryInput');
      input.value = input.value.trim();
    }

    // Ctrl+Enter shortcut
    document.getElementById('sqlQueryInput').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeCurrentQuery();
      }
    });

    window.addEventListener('DOMContentLoaded', initDatabase);
  </script>
</body>
</html>
"""

def main():
    print("[*] Starting compilation of Swagger UI, ReDoc, SQLite Web Studio, and OpenAPI specification...")

    # Ensure directories exist
    public_dir.mkdir(parents=True, exist_ok=True)
    dist_dir.mkdir(parents=True, exist_ok=True)
    (public_dir / "docs").mkdir(parents=True, exist_ok=True)
    (public_dir / "redoc").mkdir(parents=True, exist_ok=True)
    (public_dir / "sqlite").mkdir(parents=True, exist_ok=True)
    (dist_dir / "docs").mkdir(parents=True, exist_ok=True)
    (dist_dir / "redoc").mkdir(parents=True, exist_ok=True)
    (dist_dir / "sqlite").mkdir(parents=True, exist_ok=True)

    # 1. Export OpenAPI 3.1.0 Spec
    print("[1/5] Exporting complete OpenAPI 3.1.0 JSON specification...")
    spec_json = export_openapi_json()
    with open(public_dir / "openapi.json", "w", encoding="utf-8") as f:
        f.write(spec_json)
    with open(dist_dir / "openapi.json", "w", encoding="utf-8") as f:
        f.write(spec_json)
    print(f"      -> Wrote {len(spec_json)} bytes to openapi.json")

    # 2. Copy dispatchengine.db
    db_source = engine_dir / "dispatchengine.db"
    print(f"[2/5] Copying SQLite database from {db_source.resolve()}...")
    if db_source.exists():
        shutil.copy2(db_source, public_dir / "dispatchengine.db")
        shutil.copy2(db_source, dist_dir / "dispatchengine.db")
        print(f"      -> Copied dispatchengine.db ({db_source.stat().st_size} bytes)")
    else:
        print(f"      [!] WARNING: Source database {db_source} not found!")

    # 3. Generate Swagger UI HTML
    print("[3/5] Generating Swagger UI HTML (/docs and /docs.html)...")
    swagger_html = generate_swagger_html("/openapi.json")
    with open(public_dir / "docs.html", "w", encoding="utf-8") as f:
        f.write(swagger_html)
    with open(public_dir / "docs" / "index.html", "w", encoding="utf-8") as f:
        f.write(swagger_html)
    with open(dist_dir / "docs.html", "w", encoding="utf-8") as f:
        f.write(swagger_html)
    with open(dist_dir / "docs" / "index.html", "w", encoding="utf-8") as f:
        f.write(swagger_html)

    # 4. Generate ReDoc HTML
    print("[4/5] Generating ReDoc HTML (/redoc and /redoc.html)...")
    redoc_html = generate_redoc_html("/openapi.json")
    with open(public_dir / "redoc.html", "w", encoding="utf-8") as f:
        f.write(redoc_html)
    with open(public_dir / "redoc" / "index.html", "w", encoding="utf-8") as f:
        f.write(redoc_html)
    with open(dist_dir / "redoc.html", "w", encoding="utf-8") as f:
        f.write(redoc_html)
    with open(dist_dir / "redoc" / "index.html", "w", encoding="utf-8") as f:
        f.write(redoc_html)

    # 5. Generate SQLite Web Studio HTML
    print("[5/5] Generating SQLite Database Studio HTML (/sqlite and /sqlite.html)...")
    sqlite_html = generate_sqlite_html()
    with open(public_dir / "sqlite.html", "w", encoding="utf-8") as f:
        f.write(sqlite_html)
    with open(public_dir / "sqlite" / "index.html", "w", encoding="utf-8") as f:
        f.write(sqlite_html)
    with open(dist_dir / "sqlite.html", "w", encoding="utf-8") as f:
        f.write(sqlite_html)
    with open(dist_dir / "sqlite" / "index.html", "w", encoding="utf-8") as f:
        f.write(sqlite_html)

    print("[+] All API and SQLite assets generated successfully in public/ and dist/!")

if __name__ == "__main__":
    main()
