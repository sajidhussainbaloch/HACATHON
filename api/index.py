"""
Vercel Serverless Function Entry Point
Wraps the FastAPI app for deployment on Vercel.
"""

import sys
import os

# Add the backend directory to Python path so imports resolve correctly
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, os.path.abspath(backend_dir))

# Now import the FastAPI app
from main import app

# Vercel expects the FastAPI `app` object to be exposed at module level.
# The @vercel/python runtime automatically detects ASGI apps (FastAPI/Starlette).
