"""
Vercel Serverless Function Entry Point
Wraps the FastAPI app for deployment on Vercel.
"""

import sys
import os
from starlette.middleware.base import BaseHTTPMiddleware

# Add the backend directory to Python path so imports resolve correctly
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, os.path.abspath(backend_dir))

# Now import the FastAPI app
from main import app

# Middleware to strip /api prefix from paths on Vercel
class StripPathMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.url.path.startswith("/api/"):
            # Remove /api prefix
            request.scope["path"] = request.url.path[4:]
        elif request.url.path == "/api":
            request.scope["path"] = "/"
        return await call_next(request)

app.add_middleware(StripPathMiddleware)

# Vercel expects the FastAPI `app` object to be exposed at module level.
# The @vercel/python runtime automatically detects ASGI apps (FastAPI/Starlette).
