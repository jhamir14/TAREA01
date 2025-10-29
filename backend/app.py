from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
# Importar explícitamente los modelos para que Alembic los detecte en autogenerate
from models import User, Product, CartItem, Order, OrderItem, OrderInfo, OrderStatus, DailyMenuItem  # noqa: F401
from flask_migrate import Migrate
from routes.auth_routes import auth_bp
from routes.product_routes import product_bp
from routes.cart_routes import cart_bp
from routes.admin_routes import admin_bp
from routes.menu_routes import menu_bp
from routes.order_routes import order_bp

app = Flask(__name__)
import os
basedir = os.path.abspath(os.path.dirname(__file__))
# Conexión a MySQL (Railway)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:zyUJoHTgPdhIjZeiSaiiJSntOUPrYRsA@turntable.proxy.rlwy.net:15581/railway'
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
}
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key'  # Cambiar en producción
app.config['UPLOAD_FOLDER'] = os.path.join(basedir, 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Directorio IMG en la raíz del proyecto
IMG_DIR = os.path.abspath(os.path.join(basedir, '..', 'IMG'))

# Inicializar extensiones
# Permitir desarrollo desde puertos comunes de Vite y localhost
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
]}}, supports_credentials=True)
jwt = JWTManager(app)
db.init_app(app)
Migrate(app, db)

# Registrar blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(product_bp)
app.register_blueprint(cart_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(menu_bp)
app.register_blueprint(order_bp)

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Servir archivos desde IMG/
@app.route('/img/<path:filename>')
def img_file(filename):
    return send_from_directory(IMG_DIR, filename)

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)