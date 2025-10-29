from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Product, CartItem, Order, OrderItem, OrderInfo, User

cart_bp = Blueprint('cart', __name__, url_prefix='/api/cart')

@cart_bp.get('/')
@jwt_required()
def get_cart():
    user_id = int(get_jwt_identity())
    items = CartItem.query.filter_by(user_id=user_id).all()
    result = []
    total = 0.0
    for i in items:
        total += i.quantity * i.product.price
        result.append({
            'id': i.id,
            'product': {
                'id': i.product.id,
                'name': i.product.name,
                'price': i.product.price,
                'image_url': i.product.image_url
            },
            'quantity': i.quantity,
            'subtotal': i.quantity * i.product.price
        })
    return jsonify({'items': result, 'total': total}), 200

@cart_bp.post('/')
@jwt_required()
def add_to_cart():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    product_id = data.get('product_id')
    quantity = int(data.get('quantity', 1))
    p = Product.query.get_or_404(product_id)
    item = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
    if item:
        item.quantity += quantity
    else:
        item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
        db.session.add(item)
    db.session.commit()
    return jsonify({'message': 'Agregado al carrito', 'item_id': item.id}), 201

@cart_bp.put('/<int:item_id>')
@jwt_required()
def update_cart_item(item_id):
    user_id = int(get_jwt_identity())
    item = CartItem.query.get_or_404(item_id)
    if item.user_id != user_id:
        return jsonify({'message': 'No autorizado'}), 403
    data = request.get_json() or {}
    quantity = int(data.get('quantity', item.quantity))
    item.quantity = max(1, quantity)
    db.session.commit()
    return jsonify({'message': 'Cantidad actualizada'}), 200

@cart_bp.delete('/<int:item_id>')
@jwt_required()
def delete_cart_item(item_id):
    user_id = int(get_jwt_identity())
    item = CartItem.query.get_or_404(item_id)
    if item.user_id != user_id:
        return jsonify({'message': 'No autorizado'}), 403
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item eliminado'}), 200

@cart_bp.post('/checkout')
@jwt_required()
def checkout():
    # Identidad por defecto: el usuario autenticado
    current_identity = int(get_jwt_identity())
    user_id = current_identity
    items = CartItem.query.filter_by(user_id=user_id).all()
    if not items:
        return jsonify({'message': 'Carrito vacío'}), 400
    data = request.get_json() or {}
    order_type = (data.get('order_type') or '').strip().lower()
    table_number = data.get('table_number')
    delivery_address = (data.get('delivery_address') or '').strip()
    delivery_phone = (data.get('delivery_phone') or '').strip()
    override_user_id = data.get('user_id')
    payment_method = (data.get('payment_method') or '').strip().lower() or None

    # Si es admin y manda user_id, registrar el pedido para ese cliente
    claims = get_jwt()
    clear_admin_cart = False
    if claims.get('is_admin') and override_user_id:
        try:
            candidate_id = int(override_user_id)
            # Verificar que exista el usuario destino
            if not User.query.get(candidate_id):
                return jsonify({'message': 'Cliente destino no existe'}), 404
            user_id = candidate_id
            # Marcar para limpiar también el carrito del admin para mantener la UI consistente
            clear_admin_cart = True
        except Exception:
            return jsonify({'message': 'user_id inválido'}), 400
        # Usar los items del carrito del ADMIN para generar el pedido del cliente
        # Esto permite que el operador arme el pedido y lo asigne al cliente seleccionado
        items = CartItem.query.filter_by(user_id=current_identity).all()

    if order_type not in ('mesa', 'delivery'):
        return jsonify({'message': "order_type debe ser 'mesa' o 'delivery'"}), 400
    if order_type == 'mesa':
        try:
            tn = int(table_number)
            if tn <= 0:
                raise ValueError
            table_number = tn
        except Exception:
            return jsonify({'message': 'Número de mesa inválido'}), 400
    if order_type == 'delivery':
        if not delivery_address:
            return jsonify({'message': 'Dirección de entrega requerida'}), 400

    order = Order(user_id=user_id, total=0.0)
    db.session.add(order)
    total = 0.0
    for i in items:
        oi = OrderItem(order=order, product_id=i.product_id, quantity=i.quantity, price_at_purchase=i.product.price)
        db.session.add(oi)
        total += i.quantity * i.product.price
        db.session.delete(i)
    order.total = total
    info = OrderInfo(order=order, order_type=order_type, table_number=table_number if order_type == 'mesa' else None,
                     delivery_address=delivery_address if order_type == 'delivery' else None,
                     delivery_phone=delivery_phone if order_type == 'delivery' else None,
                     payment_method=payment_method)
    db.session.add(info)
    
    # Si el pedido lo realizó un administrador en nombre de un cliente,
    # limpiamos también el carrito del administrador para evitar confusiones en la interfaz.
    if clear_admin_cart:
        admin_items = CartItem.query.filter_by(user_id=current_identity).all()
        for ai in admin_items:
            db.session.delete(ai)
    
    db.session.commit()
    return jsonify({'message': 'Pedido finalizado', 'order_id': order.id, 'total': total, 'order_type': order_type}), 201