from api import create_app

def test_search_query():
    app = create_app()
    with app.test_client() as client:
        res = client.get('/api/products?q=Silk')
        assert res.status_code == 200
        data = res.get_json()
        assert 'products' in data

if __name__ == '__main__':
    test_search_query()
    print("Search test passed!")
