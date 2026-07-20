import base64
import hashlib
from cryptography.fernet import Fernet
from flask import current_app

def _get_fernet():
    secret = current_app.config.get('SECRET_KEY', 'default_secret_key_change_me')
    key_bytes = hashlib.sha256(secret.encode('utf-8')).digest()
    key_b64 = base64.urlsafe_b64encode(key_bytes)
    return Fernet(key_b64)

def encrypt_text(text: str) -> str:
    """
    Encrypts sensitive string using Fernet authenticated symmetric encryption.
    """
    if not text:
        return text
    try:
        f = _get_fernet()
        return f.encrypt(text.encode('utf-8')).decode('utf-8')
    except Exception:
        return text

def decrypt_text(encrypted_text: str) -> str:
    """
    Decrypts Fernet cipher string back to plain text.
    """
    if not encrypted_text:
        return encrypted_text
    try:
        f = _get_fernet()
        return f.decrypt(encrypted_text.encode('utf-8')).decode('utf-8')
    except Exception:
        return encrypted_text
