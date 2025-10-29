from flask import Blueprint, jsonify, request
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Order, OrderItem, OrderInfo, User, OrderStatus

order_bp = Blueprint('order', __name__, url_prefix='/api/orders')

@order_bp.get('/')
@jwt_required()
def get_orders():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    
    # Si es admin, puede ver todos los pedidos, sino solo los suyos
    if claims.get('is_admin'):
        orders = Order.query.order_by(Order.created_at.desc()).all()
    else:
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        # Filtrar pedidos pagados fuera del listado principal
        status_obj = OrderStatus.query.filter_by(order_id=order.id).first()
        status_value = status_obj.status if status_obj else 'pendiente'
        if status_value == 'pagado':
            continue
        # Obtener información del usuario que hizo el pedido
        user = User.query.get(order.user_id)
        
        # Obtener items del pedido
        items = []
        for item in order.items:
            items.append({
                'id': item.id,
                'product_name': item.product.name,
                'quantity': item.quantity,
                'price_at_purchase': item.price_at_purchase,
                'subtotal': item.quantity * item.price_at_purchase
            })
        
        # Obtener información adicional del pedido
        order_info = order.info
        order_data = {
            'id': order.id,
            'user_id': order.user_id,
            'user_name': f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username,
            'total': order.total,
            'created_at': order.created_at.isoformat(),
            'items': items,
            'order_type': order_info.order_type if order_info else 'mesa',
            'table_number': order_info.table_number if order_info else None,
            'delivery_address': order_info.delivery_address if order_info else None,
            'delivery_phone': order_info.delivery_phone if order_info else None,
            'payment_method': order_info.payment_method if order_info else None,
            'status': status_value
        }
        result.append(order_data)
    
    return jsonify(result), 200

@order_bp.get('/history')
@jwt_required()
def get_orders_history():
    user_id = int(get_jwt_identity())
    claims = get_jwt()

    if claims.get('is_admin'):
        orders = Order.query.order_by(Order.created_at.desc()).all()
    else:
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()

    result = []
    for order in orders:
        status_obj = OrderStatus.query.filter_by(order_id=order.id).first()
        status_value = status_obj.status if status_obj else 'pendiente'
        if status_value != 'pagado':
            continue
        user = User.query.get(order.user_id)
        items = []
        for item in order.items:
            items.append({
                'id': item.id,
                'product_name': item.product.name,
                'quantity': item.quantity,
                'price_at_purchase': item.price_at_purchase,
                'subtotal': item.quantity * item.price_at_purchase
            })
        order_info = order.info
        order_data = {
            'id': order.id,
            'user_id': order.user_id,
            'user_name': f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username,
            'total': order.total,
            'created_at': order.created_at.isoformat(),
            'items': items,
            'order_type': order_info.order_type if order_info else 'mesa',
            'table_number': order_info.table_number if order_info else None,
            'delivery_address': order_info.delivery_address if order_info else None,
            'delivery_phone': order_info.delivery_phone if order_info else None,
            'payment_method': order_info.payment_method if order_info else None,
            'status': status_value
        }
        result.append(order_data)

    return jsonify(result), 200

@order_bp.put('/<int:order_id>/status')
@jwt_required()
def update_order_status(order_id: int):
    user_id = int(get_jwt_identity())
    claims = get_jwt()

    body = request.get_json(force=True) or {}
    new_status = (body.get('status') or '').strip().lower()
    allowed = {'pendiente', 'entregado', 'pagado'}
    if new_status not in allowed:
        return jsonify({'error': 'Estado inválido', 'allowed': list(allowed)}), 400

    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Pedido no encontrado'}), 404

    # Solo admin o dueño del pedido puede actualizar
    if not (claims.get('is_admin') or order.user_id == user_id):
        return jsonify({'error': 'No autorizado'}), 403

    status_obj = OrderStatus.query.filter_by(order_id=order_id).first()
    now = datetime.utcnow()
    if not status_obj:
        status_obj = OrderStatus(order_id=order_id, status=new_status, created_at=now, updated_at=now)
        db.session.add(status_obj)
    else:
        status_obj.status = new_status
        status_obj.updated_at = now

    db.session.commit()
    return jsonify({'message': 'Estado actualizado', 'order_id': order_id, 'status': new_status}), 200