from api.core.utils import EMAIL_REGEX

def validate_subscribe_payload(data):
    if not isinstance(data, dict):
        return False, {"error": "Invalid JSON payload"}
    
    email = data.get('email')
    if not email or not isinstance(email, str):
        return False, {"error": "Email is required"}
    
    clean_email = email.strip().lower()
    if not EMAIL_REGEX.match(clean_email):
        return False, {"error": "Invalid email address format"}
    
    return True, clean_email

def validate_campaign_payload(data):
    if not isinstance(data, dict):
        return False, {"error": "Invalid JSON payload"}
    
    subject = data.get('subject')
    content = data.get('content')
    recipient_ids = data.get('recipient_ids')
    send_all = data.get('send_all', False)

    if not subject or not isinstance(subject, str) or not subject.strip():
        return False, {"error": "Subject line is required"}
    
    if not content or not isinstance(content, str) or not content.strip():
        return False, {"error": "Email content is required"}
    
    if not send_all and not (isinstance(recipient_ids, list) and len(recipient_ids) > 0):
        return False, {"error": "Please select recipients or select send_all"}

    return True, {
        "subject": subject.strip(),
        "content": content.strip(),
        "recipient_ids": recipient_ids if isinstance(recipient_ids, list) else [],
        "send_all": bool(send_all)
    }
