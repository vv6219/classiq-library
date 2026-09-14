"""HTML and JavaScript templates for interactive Swagger UI 5.x and ReDoc rendering.

Engineered with KaTeX mathematical formula rendering, executive dark styling,
deep model expansion, real-time request duration telemetry, and dynamic DOM mutation observation.
"""

from __future__ import annotations


def get_swagger_ui_html(
    openapi_url: str = "/openapi.json",
    title: str = "DispatchEngine REST API - Swagger UI Console",
) -> str:
    """Renders interactive Swagger UI 5.x interface with KaTeX math rendering and executive styling."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  
  <!-- Swagger UI 5.x Styles -->
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  
  <!-- KaTeX 0.16.9 Math Engine Styles -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous" />
  
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2338bdf8'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <style>
    :root {{
      --bg-primary: #0b0f19;
      --bg-surface: #111827;
      --bg-card: #1f2937;
      --accent-cyan: #38bdf8;
      --accent-cyan-dark: #0284c7;
      --accent-indigo: #818cf8;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --border-color: #374151;
    }}

    *, *::before, *::after {{
      box-sizing: border-box;
    }}

    body {{
      margin: 0;
      padding: 0;
      background: #0f172a;
      color: #e2e8f0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }}

    /* Custom Executive Header */
    .topbar {{
      background: linear-gradient(135deg, #020617 0%, #0f172a 100%) !important;
      border-bottom: 2px solid #38bdf8;
      padding: 14px 24px !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }}
    .topbar .wrapper {{
      max-width: 1460px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}
    .topbar a.link {{
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }}
    .topbar a.link::before {{
      content: "⚛️";
      font-size: 26px;
      line-height: 1;
    }}
    .topbar a.link span {{
      color: #f8fafc;
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.025em;
    }}
    .topbar a.link span::after {{
      content: "DISPATCH ENGINE 1.0 (CLASSIQ 32Q & KATEX MATH)";
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #38bdf8;
      letter-spacing: 0.08em;
      margin-top: 2px;
    }}
    .topbar .download-url-wrapper {{
      display: none !important;
    }}

    /* Header quick links */
    .header-nav {{
      display: flex;
      gap: 12px;
      align-items: center;
    }}
    .header-nav a {{
      color: #94a3b8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      background: #1e293b;
      border: 1px solid #334155;
      transition: all 0.2s ease;
    }}
    .header-nav a:hover {{
      color: #38bdf8;
      border-color: #38bdf8;
      background: #0f172a;
    }}
    .header-nav a.active {{
      background: #0369a1;
      color: #ffffff;
      border-color: #38bdf8;
    }}

    /* Container adjustments */
    .swagger-ui {{
      max-width: 1460px;
      margin: 0 auto;
      padding: 24px 20px 80px 20px;
    }}

    /* Typography & Info Card */
    .swagger-ui .info {{
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 28px;
      margin: 20px 0 32px 0;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }}
    .swagger-ui .info .title {{
      color: #f8fafc !important;
      font-weight: 800;
      font-size: 28px;
      letter-spacing: -0.02em;
    }}
    .swagger-ui .info .title small {{
      background: #0284c7;
      color: #ffffff;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      padding: 3px 8px;
      margin-left: 10px;
      vertical-align: middle;
    }}
    .swagger-ui .info p, 
    .swagger-ui .info li,
    .swagger-ui .info table {{
      color: #cbd5e1 !important;
      line-height: 1.65;
      font-size: 14px;
    }}
    .swagger-ui .info h3,
    .swagger-ui .info h4 {{
      color: #38bdf8 !important;
      font-weight: 700;
      margin-top: 18px;
      margin-bottom: 8px;
    }}
    .swagger-ui .info code {{
      background: #0f172a;
      color: #38bdf8;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Fira Code', monospace;
      font-size: 13px;
    }}

    /* Scheme & Filter bar */
    .swagger-ui .scheme-container {{
      background: #1e293b !important;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 16px 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-bottom: 24px;
    }}
    .swagger-ui .filter-container {{
      padding: 0 !important;
      margin: 0 !important;
    }}
    .swagger-ui .filter-container .operation-filter-input {{
      border: 1px solid #475569 !important;
      border-radius: 8px !important;
      padding: 10px 14px !important;
      font-family: 'Inter', sans-serif !important;
      font-size: 14px !important;
      background: #0f172a !important;
      color: #f8fafc !important;
      width: 100% !important;
      transition: border-color 0.2s;
    }}
    .swagger-ui .filter-container .operation-filter-input:focus {{
      border-color: #38bdf8 !important;
      outline: none !important;
    }}

    /* Operation Sections & Tags */
    .swagger-ui .opblock-tag-section {{
      margin-bottom: 24px;
    }}
    .swagger-ui .opblock-tag {{
      border-bottom: 1px solid #334155 !important;
      padding: 14px 0 !important;
      color: #f1f5f9 !important;
      font-size: 20px !important;
      font-weight: 700 !important;
    }}
    .swagger-ui .opblock-tag small {{
      color: #94a3b8 !important;
      font-size: 13px !important;
      font-weight: 400 !important;
      margin-left: 12px !important;
    }}

    /* Operation Blocks */
    .swagger-ui .opblock {{
      background: #1e293b !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      margin: 0 0 14px 0 !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15) !important;
      overflow: hidden;
    }}
    .swagger-ui .opblock .opblock-summary {{
      padding: 10px 16px !important;
      background: #1e293b !important;
    }}
    .swagger-ui .opblock .opblock-summary-path {{
      color: #f1f5f9 !important;
      font-family: 'Fira Code', monospace !important;
      font-size: 14px !important;
      font-weight: 600 !important;
    }}
    .swagger-ui .opblock .opblock-summary-description {{
      color: #94a3b8 !important;
      font-size: 13px !important;
      font-weight: 500 !important;
    }}

    /* Vivid Method Badges */
    .swagger-ui .opblock.opblock-post .opblock-summary-method {{
      background: #059669 !important;
      font-weight: 800 !important;
      border-radius: 6px !important;
      min-width: 80px;
    }}
    .swagger-ui .opblock.opblock-get .opblock-summary-method {{
      background: #0284c7 !important;
      font-weight: 800 !important;
      border-radius: 6px !important;
      min-width: 80px;
    }}
    .swagger-ui .opblock.opblock-put .opblock-summary-method {{
      background: #d97706 !important;
      font-weight: 800 !important;
      border-radius: 6px !important;
      min-width: 80px;
    }}
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {{
      background: #e11d48 !important;
      font-weight: 800 !important;
      border-radius: 6px !important;
      min-width: 80px;
    }}

    /* Opblock Bodies & Inner Content */
    .swagger-ui .opblock-body {{
      background: #0f172a !important;
      padding: 20px !important;
      border-top: 1px solid #334155;
    }}
    .swagger-ui .opblock-description-wrapper p,
    .swagger-ui .opblock-description-wrapper li {{
      color: #e2e8f0 !important;
      font-size: 14px !important;
      line-height: 1.6 !important;
    }}
    .swagger-ui .opblock-description-wrapper h3,
    .swagger-ui .opblock-description-wrapper h4 {{
      color: #38bdf8 !important;
      margin-top: 14px;
      margin-bottom: 6px;
    }}
    .swagger-ui .tabheader {{
      border-bottom: 1px solid #334155 !important;
    }}
    .swagger-ui .tabheader li button {{
      color: #94a3b8 !important;
    }}
    .swagger-ui .tabheader li.active button {{
      color: #38bdf8 !important;
      border-bottom-color: #38bdf8 !important;
    }}

    /* Code blocks & Pre elements */
    .swagger-ui pre {{
      background: #020617 !important;
      border: 1px solid #1e293b !important;
      border-radius: 6px !important;
      color: #38bdf8 !important;
      font-family: 'Fira Code', monospace !important;
      font-size: 13px !important;
    }}
    .swagger-ui select,
    .swagger-ui input[type="text"] {{
      background: #1e293b !important;
      color: #f8fafc !important;
      border: 1px solid #475569 !important;
      border-radius: 6px !important;
      padding: 8px 12px !important;
    }}
    .swagger-ui select:focus,
    .swagger-ui input[type="text"]:focus {{
      border-color: #38bdf8 !important;
      outline: none !important;
    }}

    /* Action Buttons (Try it out / Execute) */
    .swagger-ui .btn.try-out__btn {{
      border-color: #38bdf8 !important;
      color: #38bdf8 !important;
      background: transparent !important;
      border-radius: 6px !important;
      font-weight: 700 !important;
      transition: all 0.2s;
    }}
    .swagger-ui .btn.try-out__btn:hover {{
      background: #38bdf8 !important;
      color: #0f172a !important;
    }}
    .swagger-ui .btn.execute {{
      background: #0284c7 !important;
      border-color: #0284c7 !important;
      color: #ffffff !important;
      border-radius: 6px !important;
      font-weight: 800 !important;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4) !important;
    }}
    .swagger-ui .btn.execute:hover {{
      background: #0369a1 !important;
    }}
    .swagger-ui .btn.btn-clear {{
      border-color: #64748b !important;
      color: #cbd5e1 !important;
      border-radius: 6px !important;
    }}

    /* Models & Schemas Section */
    .swagger-ui section.models {{
      background: #1e293b !important;
      border: 1px solid #334155 !important;
      border-radius: 12px !important;
      padding: 24px !important;
      margin-top: 36px !important;
    }}
    .swagger-ui section.models h4 {{
      color: #f8fafc !important;
      font-size: 20px !important;
      font-weight: 800 !important;
    }}
    .swagger-ui .model-box {{
      background: #0f172a !important;
      border-radius: 8px !important;
      padding: 12px 16px !important;
      border: 1px solid #334155 !important;
    }}
    .swagger-ui .model {{
      color: #cbd5e1 !important;
      font-family: 'Fira Code', monospace !important;
      font-size: 13px !important;
    }}
    .swagger-ui .prop-type {{
      color: #38bdf8 !important;
      font-weight: 600 !important;
    }}

    /* =========================================================================
       KATEX DARK THEME & MATH TYPOGRAPHY STYLING
       ========================================================================= */
    .katex {{
      font-size: 1.08em;
      color: #f8fafc !important;
    }}
    .katex .mord, .katex .mbin, .katex .mrel, .katex .mop {{
      color: #f8fafc;
    }}
    .katex .mop {{
      color: #38bdf8 !important; /* cyan for operators like sum, prod, min, max */
      font-weight: 600;
    }}
    .katex .mrel {{
      color: #818cf8 !important; /* indigo for relations =, <=, >=, in */
    }}
    .katex .mbin {{
      color: #38bdf8 !important; /* cyan for binary operations +, - */
    }}
    .katex-display {{
      display: block;
      margin: 14px 0 !important;
      padding: 12px 18px !important;
      background: #090d16 !important;
      border: 1px solid #273549 !important;
      border-left: 3px solid #38bdf8 !important;
      border-radius: 8px !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }}
    .katex-display > .katex {{
      display: inline-block;
      text-align: left;
    }}
    .swagger-ui .renderedMarkdown p > .katex {{
      padding: 1px 4px;
      background: rgba(56, 189, 248, 0.08);
      border-radius: 4px;
      border: 1px solid rgba(56, 189, 248, 0.2);
    }}
  </style>
</head>
<body>
  <div class="topbar">
    <div class="wrapper">
      <a class="link" href="/docs">
        <span>DispatchEngine API Console</span>
      </a>
      <div class="header-nav">
        <a href="/docs" class="active">Swagger UI</a>
        <a href="/redoc">ReDoc 3-Panel</a>
        <a href="/openapi.json" target="_blank">OpenAPI JSON</a>
        <a href="/sqlite">SQLite Studio</a>
        <a href="/glossary">📚 A–Z Glossary</a>
        <a href="/api/v1/database/download">Download DB</a>
        <a href="http://localhost:3000" target="_blank">Web Simulator &rarr;</a>
      </div>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <!-- Swagger UI 5.x Bundle Scripts -->
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"></script>

  <!-- KaTeX 0.16.21 Math Engine Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/contrib/copy-tex.min.js" crossorigin="anonymous"></script>

  <script>
    // Robust KaTeX formula pre-processing and rendering handler
    function preprocessMathInElement(root) {{
      if (!root) return;
      const targets = root.querySelectorAll ? root.querySelectorAll('.renderedMarkdown, .markdown, .info, .opblock-description-wrapper, p, li, td, span') : [root];
      targets.forEach(node => {{
        if (node.classList && (node.classList.contains('katex') || node.closest('.katex'))) return;
        let html = node.innerHTML;
        if (!html || !html.includes('$')) return;

        let changed = false;
        // Clean display math $$ ... $$
        if (html.includes('$$')) {{
          html = html.replace(/\\$\\$([\\s\\S]*?)\\$\\$/g, (match, inner) => {{
            changed = true;
            const cleaned = inner
              .replace(/<\\/?em>/gi, '_')
              .replace(/<\\/?strong>/gi, '__')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&');
            return '$$' + cleaned + '$$';
          }});
        }}
        // Clean inline math $ ... $
        html = html.replace(/\\$([^\\$\\n]+?)\\$/g, (match, inner) => {{
          changed = true;
          const cleaned = inner
            .replace(/<\\/?em>/gi, '_')
            .replace(/<\\/?strong>/gi, '__')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
          return '$' + cleaned + '$';
        }});

        if (changed && html !== node.innerHTML) {{
          node.innerHTML = html;
        }}
      }});
    }}

    function renderMathFormulas(rootElement) {{
      if (!window.renderMathInElement || !rootElement) return;
      try {{
        preprocessMathInElement(rootElement);
        window.renderMathInElement(rootElement, {{
          delimiters: [
            {{ left: "$$", right: "$$", display: true }},
            {{ left: "$", right: "$", display: false }},
            {{ left: "\\\\(", right: "\\\\)", display: false }},
            {{ left: "\\\\[", right: "\\\\]", display: true }}
          ],
          throwOnError: false,
          errorColor: "#f43f5e",
          ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
          ignoredClasses: ["katex", "katex-html", "katex-mathml"]
        }});
      }} catch (err) {{
        console.warn("KaTeX render error:", err);
      }}
    }}

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
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        filter: true,
        showRequestDuration: true,
        tryItOutEnabled: true,
        syntaxHighlight: {{
          activate: true,
          theme: "agate"
        }}
      }});

      let renderTimeout = null;
      function scheduleKaTeXRender() {{
        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(() => {{
          const container = document.getElementById('swagger-ui');
          if (container) {{
            renderMathFormulas(container);
          }}
        }}, 50);
      }}

      // Multi-pass schedule to handle asynchronous Swagger UI mounting
      setTimeout(scheduleKaTeXRender, 150);
      setTimeout(scheduleKaTeXRender, 500);
      setTimeout(scheduleKaTeXRender, 1200);
      setTimeout(scheduleKaTeXRender, 2500);

      // MutationObserver for dynamic interactions (expanding tags, endpoints, parameters)
      const target = document.getElementById('swagger-ui');
      if (target && window.MutationObserver) {{
        const observer = new MutationObserver((mutations) => {{
          let shouldRender = false;
          for (const m of mutations) {{
            if (m.addedNodes.length > 0) {{
              const isKatexNode = Array.from(m.addedNodes).some(n => 
                n.classList && (n.classList.contains('katex') || n.classList.contains('katex-display'))
              );
              if (!isKatexNode) {{
                shouldRender = true;
                break;
              }}
            }}
          }}
          if (shouldRender) {{
            scheduleKaTeXRender();
          }}
        }});
        observer.observe(target, {{ childList: true, subtree: true }});
      }}
    }};
  </script>
</body>
</html>
"""


def get_redoc_html(
    openapi_url: str = "/openapi.json",
    title: str = "DispatchEngine REST API - ReDoc Technical Dossier",
) -> str:
    """Renders ReDoc 3-panel documentation interface with KaTeX math rendering and enterprise styling."""
    return f"""<!DOCTYPE html>
<html>
  <head>
    <title>{title}</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2338bdf8'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>" />
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous" />
    <style>
      body {{
        margin: 0;
        padding: 0;
        background: #0f172a;
        font-family: 'Inter', sans-serif;
      }}
      .katex {{
        color: #f8fafc !important;
      }}
      .katex .mop, .katex .mbin {{
        color: #38bdf8 !important;
      }}
      .katex .mrel {{
        color: #818cf8 !important;
      }}
    </style>
  </head>
  <body>
    <div id="redoc-container"></div>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
    <script>
      Redoc.init('{openapi_url}', {{
        expandResponses: "200,201",
        theme: {{
          colors: {{
            primary: {{ main: '#0284c7' }},
            text: {{ primary: '#f8fafc', secondary: '#94a3b8' }},
            http: {{ get: '#0284c7', post: '#059669', put: '#d97706', delete: '#e11d48' }}
          }}
        }}
      }}, document.getElementById('redoc-container'), () => {{
        if (window.renderMathInElement) {{
          window.renderMathInElement(document.body, {{
            delimiters: [
              {{ left: "$$", right: "$$", display: true }},
              {{ left: "$", right: "$", display: false }}
            ],
            throwOnError: false
          }});
        }}
      }});
    </script>
  </body>
</html>
"""
