# wsgi.py — Production entry point
# Usage: gunicorn wsgi:app --workers 2 --bind 0.0.0.0:$PORT
from app import create_app

app = create_app()
