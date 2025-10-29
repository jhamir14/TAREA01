from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from models import db, User, Order
from models import Product, OrderItem, OrderInfo

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.get('/users')
@jwt_required()
def list_users():
    claims = get_jwt()
    if not claims.get('is_admin'):
        return jsonify({'message': 'No autorizado'}), 403
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'is_admin': u.is_admin,
        'first_name': u.first_name,
        'last_name': u.last_name,
        'phone': u.phone,
        'address': u.address,
        'orders': [{
            'id': o.id,
            'total': o.total,
            'created_at': o.created_at.isoformat(),
            'info': (
                {
                  'order_type': (o.info.order_type if o.info else None),
                  'table_number': (o.info.table_number if o.info else None),
                  'delivery_address': (o.info.delivery_address if o.info else None),
                  'delivery_phone': (o.info.delivery_phone if o.info else None),
                  'payment_method': (o.info.payment_method if o.info else None)
                } if o.info else None
            )
        } for o in u.orders]
    } for u in users]), 200

@admin_bp.post('/users')
@jwt_required()
def create_user_by_admin():
    claims = get_jwt()
    if not claims.get('is_admin'):
        return jsonify({'message': 'No autorizado'}), 403
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = (data.get('email') or '').strip()
    password = (data.get('password') or '')
    # Forzar creación de clientes (no administradores) desde este endpoint
    is_admin = False

    # Campos extendidos de cliente
    first_name = (data.get('first_name') or '').strip()
    last_name = (data.get('last_name') or '').strip()
    phone = (data.get('phone') or '').strip()
    address = (data.get('address') or '').strip()

    # Permitir crear clientes sin alias visible; si no se envía username, autogenerarlo
    if not username:
        base = (first_name or 'cliente').lower().replace(' ', '')
        import time
        username = f"{base}_{int(time.time())}"
    # Email y contraseña ahora son opcionales para clientes
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'message': 'Usuario o email ya existe'}), 409

    user = User(username=username, email=email or None, is_admin=is_admin,
                first_name=first_name or None, last_name=last_name or None,
                phone=phone or None, address=address or None)
    if password:
        user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'id': user.id, 'username': user.username, 'email': user.email, 'is_admin': user.is_admin}), 201

@admin_bp.put('/users/<int:user_id>')
@jwt_required()
def update_user_by_admin(user_id: int):
    claims = get_jwt()
    if not claims.get('is_admin'):
        return jsonify({'message': 'No autorizado'}), 403
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    # Actualizar sólo campos de cliente y email; username no se edita desde admin
    first_name = (data.get('first_name') or user.first_name)
    last_name = (data.get('last_name') or user.last_name)
    phone = (data.get('phone') or user.phone)
    address = (data.get('address') or user.address)
    email = (data.get('email') or user.email)

    # Verificar conflicto de email si cambia
    if email != user.email and email:
        exists = User.query.filter(User.email == email, User.id != user.id).first()
        if exists:
            return jsonify({'message': 'Email ya en uso'}), 409

    user.first_name = first_name or None
    user.last_name = last_name or None
    user.phone = phone or None
    user.address = address or None
    user.email = email or None
    db.session.commit()
    return jsonify({'message': 'Cliente actualizado'}), 200

@admin_bp.post('/orders')
@jwt_required()
def create_order_by_admin():
    claims = get_jwt()
    if not claims.get('is_admin'):
        return jsonify({'message': 'No autorizado'}), 403
    data = request.get_json() or {}
    user_id = data.get('user_id')
    items = data.get('items') or []
    order_type = (data.get('order_type') or '').strip().lower()
    table_number = data.get('table_number')
    delivery_address = (data.get('delivery_address') or '').strip()
    delivery_phone = (data.get('delivery_phone') or '').strip()
    payment_method = (data.get('payment_method') or '').strip()

    if not user_id:
        return jsonify({'message': 'user_id es requerido'}), 400
    if not items:
        return jsonify({'message': 'items es requerido'}), 400
    if order_type not in ('mesa', 'delivery'):
        return jsonify({'message': "order_type debe ser 'mesa' o 'delivery'"}), 400

    # Validación mesa/delivery
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
        pid = i.get('product_id')
        qty = int(i.get('quantity', 1))
        p = Product.query.get(pid)
        if not p:
            return jsonify({'message': f'Producto {pid} no existe'}), 404
        oi = OrderItem(order=order, product_id=pid, quantity=max(1, qty), price_at_purchase=p.price)
        db.session.add(oi)
        total += max(1, qty) * p.price
    order.total = total
    info = OrderInfo(order=order, order_type=order_type,
                     table_number=table_number if order_type == 'mesa' else None,
                     delivery_address=delivery_address if order_type == 'delivery' else None,
                     delivery_phone=delivery_phone if order_type == 'delivery' else None,
                     payment_method=payment_method or None)
    db.session.add(info)
    db.session.commit()
    return jsonify({'message': 'Pedido creado', 'order_id': order.id, 'total': total}), 201