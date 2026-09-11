"""HTML and JavaScript templates for Swagger UI and ReDoc rendering."""

from __future__ import annotations


def get_swagger_ui_html(
    openapi_url: str = "/openapi.json",
    title: str = "DispatchEngine API - Swagger UI",
) -> str:
    """Renders interactive Swagger UI 5.x interface."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://fastapi.tiangolo.com/img/favicon.png" />
  <style>
    body {{
      margin: 0;
      background: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }}
    .topbar {{
      background: #0f172a !important;
      border-bottom: 2px solid #38bdf8;
    }}
    .topbar .download-url-wrapper {{
      display: none !important;
    }}
    .swagger-ui .info .title {{
      color: #0f172a;
      font-weight: 800;
    }}
    .swagger-ui .info {{
      margin: 25px 0;
    }}
    .swagger-ui .scheme-container {{
      background: #f1f5f9;
      box-shadow: none;
      border-radius: 8px;
    }}
  </style>
</head>
<body>
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


def get_redoc_html(
    openapi_url: str = "/openapi.json",
    title: str = "DispatchEngine API - ReDoc",
) -> str:
    """Renders ReDoc 3-panel documentation interface."""
    return f"""<!DOCTYPE html>
<html>
  <head>
    <title>{title}</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body {{
        margin: 0;
        padding: 0;
      }}
    </style>
  </head>
  <body>
    <redoc spec-url='{openapi_url}'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
  </body>
</html>
"""
