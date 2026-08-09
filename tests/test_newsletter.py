import pytest
from api import create_app, Config
from api.core.db import db
from api.core.models import NewsletterSubscriber, User
from api.features.newsletter.services import (
    subscribe_email,
    unsubscribe_email,
    get_subscribers_paginated,
    send_newsletter_campaign,
    delete_subscriber
)

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    RATELIMIT_ENABLED = False

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        # Create an admin user for admin route tests
        admin = User(
            email='admin@test.com',
            full_name='Test Admin',
            role='admin'
        )
        admin.set_password('AdminPass123!')
        db.session.add(admin)
        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_client(client, app):
    """Fixture providing a client authenticated as an admin user."""
    with app.app_context():
        res = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'AdminPass123!'
        })
        assert res.status_code == 200
    return client


def test_subscribe_email_service(app):
    with app.app_context():
        sub, is_new = subscribe_email('customer1@example.com')
        assert is_new is True
        assert sub['email'] == 'customer1@example.com'
        assert sub['is_subscribed'] is True

        # Duplicate subscription test
        sub2, is_new2 = subscribe_email('customer1@example.com')
        assert is_new2 is False
        assert sub2['id'] == sub['id']


def test_unsubscribe_email_service(app):
    with app.app_context():
        subscribe_email('unsub@example.com')
        unsub_res = unsubscribe_email('unsub@example.com')
        assert unsub_res is True

        sub = NewsletterSubscriber.query.filter_by(email='unsub@example.com').first()
        assert sub.is_subscribed is False


def test_public_subscribe_api(client):
    # Test valid email
    res = client.post('/api/newsletter/subscribe', json={'email': 'subscriber@diya.com'})
    assert res.status_code == 201
    data = res.get_json()
    assert 'subscriber' in data
    assert data['subscriber']['email'] == 'subscriber@diya.com'

    # Test invalid email
    res_bad = client.post('/api/newsletter/subscribe', json={'email': 'invalid-email'})
    assert res_bad.status_code == 400


def test_subscribers_12_row_pagination(app, admin_client):
    with app.app_context():
        # Create 15 subscribers to test 12-row pagination threshold
        for i in range(15):
            subscribe_email(f'user{i}@example.com')

    res = admin_client.get('/api/admin/newsletter?page=1&per_page=12')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] == 15
    assert len(data['items']) == 12  # Strict 12 items on page 1
    assert data['pages'] == 2
    assert data['page'] == 1

    # Fetch page 2
    res_p2 = admin_client.get('/api/admin/newsletter?page=2&per_page=12')
    assert res_p2.status_code == 200
    data_p2 = res_p2.get_json()
    assert len(data_p2['items']) == 3


def test_subscribers_search_filter(app, admin_client):
    with app.app_context():
        subscribe_email('alice@domain.com')
        subscribe_email('bob@other.com')

    res = admin_client.get('/api/admin/newsletter?search=alice')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] == 1
    assert data['items'][0]['email'] == 'alice@domain.com'


def test_send_newsletter_campaign_api(app, admin_client):
    with app.app_context():
        subscribe_email('recipient1@test.com')
        subscribe_email('recipient2@test.com')

    res = admin_client.post('/api/admin/newsletter/send', json={
        'subject': '✨ Royal Collection Drop',
        'content': 'We are excited to launch our latest luxury silk scarves collection.',
        'send_all': True
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['sent_count'] == 2
    assert data['status'] == 'queued'


def test_delete_subscriber_api(app, admin_client):
    with app.app_context():
        sub, _ = subscribe_email('todelete@test.com')
        sub_id = sub['id']

    res = admin_client.delete(f'/api/admin/newsletter/{sub_id}')
    assert res.status_code == 200

    with app.app_context():
        assert db.session.get(NewsletterSubscriber, sub_id) is None
