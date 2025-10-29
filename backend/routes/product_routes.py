from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Product
from werkzeug.utils import secure_filename
import os
import time

product_bp = Blueprint('products', __name__, url_prefix='/api/products')

@product_bp.get('/')
def list_products():
  products = Product.query.order_by(Product.created_at.desc()).all()
  return jsonify([
    {
      'id': p.id,
      'name': p.name,
      'description': p.description,
      'price': p.price,
      'image_url': p.image_url
    } for p in products
  ]), 200

@product_bp.get('/<int:product_id>')
def get_product(product_id):
  p = Product.query.get_or_404(product_id)
  return jsonify({
    'id': p.id,
    'name': p.name,
    'description': p.description,
    'price': p.price,
    'image_url': p.image_url
  }), 200

@product_bp.post('/')
@jwt_required()
def create_product():
  claims = get_jwt()
  if not claims.get('is_admin'):
    return jsonify({'message': 'No autorizado'}), 403

  image_url = None
  if request.content_type and 'multipart/form-data' in request.content_type:
    name = request.form.get('name')
    price = request.form.get('price')
    description = request.form.get('description')
    file = request.files.get('image')
    if file and file.filename:
      filename = secure_filename(file.filename)
      filename = f"{int(time.time())}_{filename}"
      file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
      os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
      file.save(file_path)
      image_url = f"/uploads/{filename}"
  else:
    data = request.get_json() or {}
    name = data.get('name')
    price = data.get('price')
    description = data.get('description')
    image_url = data.get('image_url')

  # Validaciones
  if not name:
    return jsonify({'message': 'Nombre requerido'}), 400
  if price is None or (isinstance(price, str) and not price.strip()):
    return jsonify({'message': 'Precio requerido'}), 400
  try:
    price_val = float(price)
  except (TypeError, ValueError):
    return jsonify({'message': 'Precio inválido'}), 400

  p = Product(name=name, description=description, price=price_val, image_url=image_url)
  db.session.add(p)
  db.session.commit()
  return jsonify({'message': 'Producto creado', 'id': p.id}), 201

@product_bp.put('/<int:product_id>')
@jwt_required()
def update_product(product_id):
  claims = get_jwt()
  if not claims.get('is_admin'):
    return jsonify({'message': 'No autorizado'}), 403

  p = Product.query.get_or_404(product_id)
  if request.content_type and 'multipart/form-data' in request.content_type:
    name = request.form.get('name', p.name)
    description = request.form.get('description', p.description)
    price = request.form.get('price', p.price)
    file = request.files.get('image')
    if file and file.filename:
      filename = secure_filename(file.filename)
      filename = f"{int(time.time())}_{filename}"
      file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
      os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
      file.save(file_path)
      p.image_url = f"/uploads/{filename}"
    p.name = name
    p.description = description
    if price is not None:
      try:
        p.price = float(price)
      except:
        pass
  else:
    data = request.get_json() or {}
    p.name = data.get('name', p.name)
    p.description = data.get('description', p.description)
    if 'price' in data:
      p.price = float(data['price'])
    p.image_url = data.get('image_url', p.image_url)

  db.session.commit()
  return jsonify({'message': 'Producto actualizado'}), 200

@product_bp.delete('/<int:product_id>')
@jwt_required()
def delete_product(product_id):
  claims = get_jwt()
  if not claims.get('is_admin'):
    return jsonify({'message': 'No autorizado'}), 403
  p = Product.query.get_or_404(product_id)
  db.session.delete(p)
  db.session.commit()
  return jsonify({'message': 'Producto eliminado'}), 200