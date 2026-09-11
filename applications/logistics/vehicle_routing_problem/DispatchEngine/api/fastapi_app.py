"""Optional native FastAPI application mounting all schemas and routers."""

from __future__ import annotations
from typing import Optional

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from DispatchEngine.api.openapi_spec import generate_openapi_spec
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False


def create_fastapi_app() -> Optional[Any]:
    if not HAS_FASTAPI:
        return None

    app = FastAPI(
        title="Industrial Multi-Tier Warehouse Optimization Engine (DispatchEngine)",
        description="Extended Rich Multi-Depot VRPTW with Classiq Quantum Co-Processor Acceleration",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/v1/health")
    def health():
        return {"status": "healthy", "engine": "DispatchEngine"}

    return app


app = create_fastapi_app()
