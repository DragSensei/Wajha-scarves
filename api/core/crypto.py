import base64
import hashlib
from cryptography.fernet import Fernet
from flask import current_app

def _get_fernet():
    secret = current_app.config.get('SECRET_KEY', 'default_secret_key_change_me')
    return Fernet(base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest()))

def encrypt_text(text: str) -> str:
    """Encrypts sensitive string using Fernet authenticated symmetric encryption."""
    if not text:
        return text
    try:
        return _get_fernet().encrypt(text.encode()).decode()
    except Exception:
        return text

def decrypt_text(encrypted_text: str) -> str:
    """Decrypts Fernet cipher string back to plain text."""
    if not encrypted_text:
        return encrypted_text
    try:
        return _get_fernet().decrypt(encrypted_text.encode()).decode()
    except Exception:
        return encrypted_text

