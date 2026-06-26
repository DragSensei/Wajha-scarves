from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "message": "Flask backend is running successfully on Vercel!"
    })

@app.route('/api/products', methods=['GET'])
def get_products():
    scarves = [
        {"id": 1, "name": "Classic Cashmere Scarf", "price": 49.99, "color": "Crimson", "inStock": True},
        {"id": 2, "name": "Silk Infinity Scarf", "price": 35.00, "color": "Navy Blue", "inStock": True},
        {"id": 3, "name": "Wool Tartan Scarf", "price": 42.50, "color": "Forest Green", "inStock": False},
        {"id": 4, "name": "Linen Summer Shawl", "price": 29.99, "color": "Sand", "inStock": True}
    ]
    return jsonify(scarves)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
