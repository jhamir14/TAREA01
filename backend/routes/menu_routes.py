from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from datetime import date
from models import db, Product, DailyMenuItem

menu_bp = Blueprint('menu', __name__, url_prefix='/api/menu')

@menu_bp.get('/today')
def get_today_menu():
    today = date.today()
    items = DailyMenuItem.query.filter_by(date=today).all()
    products = [
        {
            'id': i.product.id,
            'name': i.product.name,
            'description': i.product.description,
            'price': i.product.price,
            'image_url': i.product.image_url,
        }
        for i in items
    ]
    return jsonify(products), 200

@menu_bp.post('/add')
@jwt_required()
def add_to_today_menu():
    claims = get_jwt()
    if not claims.get('is_admin'):
        return jsonify({'message': 'No autorizado'}), 403
    data = request.get_json() or {}
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({'message': 'product_id es requerido'}), 400
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Producto no encontrado'}), 404
    today = date.today()
    exists = DailyMenuItem.query.filter_by(product_id=product_id, date=today).first()
    if exists:
        return jsonify({'message': 'El producto ya está en el menú de hoy'}), 200
    item = DailyMenuItem(product_id=product_id, date=today)
    db.session.add(item)
    db.session.commit()
    return jsonify({'message': 'Añadido al menú de hoy'}), 201

@menu_bp.delete('/remove/<int:product_id>')
@jwt_required()
def remove_from_today_menu(product_id: int):
    claims = get_jwt()
    if not claims.get('is_admin'):
        return jsonify({'message': 'No autorizado'}), 403
    today = date.today()
    item = DailyMenuItem.query.filter_by(product_id=product_id, date=today).first()
    if not item:
        return jsonify({'message': 'No encontrado en el menú de hoy'}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Eliminado del menú de hoy'}), 200