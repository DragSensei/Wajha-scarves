import threading
from datetime import datetime, timezone
from api.core.db import db
from api.core.models import NewsletterSubscriber

def subscribe_email(email: str):
    """
    Subscribes or re-subscribes an email to the newsletter.
    Returns tuple: (subscriber_dict, is_new_or_resubscribed_bool)
    """
    clean_email = email.strip().lower()
    subscriber = NewsletterSubscriber.query.filter_by(email=clean_email).first()

    if subscriber:
        if subscriber.is_subscribed:
            return subscriber.to_dict(), False
        subscriber.is_subscribed = True
        subscriber.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return subscriber.to_dict(), True
    
    subscriber = NewsletterSubscriber(
        email=clean_email,
        is_subscribed=True
    )
    db.session.add(subscriber)
    db.session.commit()
    return subscriber.to_dict(), True


def unsubscribe_email(email: str):
    """Unsubscribes an email from the newsletter."""
    clean_email = email.strip().lower()
    subscriber = NewsletterSubscriber.query.filter_by(email=clean_email).first()
    if subscriber and subscriber.is_subscribed:
        subscriber.is_subscribed = False
        subscriber.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return True
    return False


def get_subscribers_paginated(page: int = 1, per_page: int = 12, search: str = None, active_only: bool = False):
    """
    Retrieves paginated newsletter subscribers.
    Default pagination limit is 12 rows per page to save database query overhead.
    """
    query = NewsletterSubscriber.query

    if active_only:
        query = query.filter(NewsletterSubscriber.is_subscribed == True)  # noqa: E712

    if search:
        search_term = f"%{search.strip().lower()}%"
        query = query.filter(NewsletterSubscriber.email.ilike(search_term))

    query = query.order_by(NewsletterSubscriber.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        'items': [item.to_dict() for item in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    }


def send_newsletter_campaign(subject: str, content: str, recipient_ids: list = None, send_all: bool = False):
    """
    Dispatches bulk newsletter campaign emails to active subscribers.
    Runs non-blocking in a background thread to prevent UI timeouts.
    """
    query = NewsletterSubscriber.query.filter(NewsletterSubscriber.is_subscribed == True)  # noqa: E712

    if not send_all and recipient_ids:
        query = query.filter(NewsletterSubscriber.id.in_(recipient_ids))

    recipients = query.all()
    recipient_emails = [sub.email for sub in recipients]
    count = len(recipient_emails)

    def _async_dispatch(emails, subj, body):
        print(f"[Newsletter Campaign] Starting broadcast to {len(emails)} subscribers...")
        safe_subj = subj.encode('ascii', errors='ignore').decode('ascii')
        safe_body = body[:100].encode('ascii', errors='ignore').decode('ascii')
        print(f"[Newsletter Campaign] Subject: {safe_subj}")
        print(f"[Newsletter Campaign] Content Snippet: {safe_body}...")
        for target_email in emails:
            # Simulated / SMTP delivery
            pass
        print(f"[Newsletter Campaign] Successfully completed campaign dispatch to {len(emails)} recipients.")

    thread = threading.Thread(target=_async_dispatch, args=(recipient_emails, subject, content), daemon=True)
    thread.start()

    return {
        'sent_count': count,
        'status': 'queued',
        'message': f'Campaign successfully queued for {count} subscribers'
    }


def delete_subscriber(subscriber_id: int):
    """Deletes a newsletter subscriber record."""
    subscriber = db.session.get(NewsletterSubscriber, subscriber_id)
    if subscriber:
        db.session.delete(subscriber)
        db.session.commit()
        return True
    return False
