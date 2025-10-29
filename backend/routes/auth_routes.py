from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from models import db, User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.post('/register')
def register():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if not all([username, email, password]):
        return jsonify({'message': 'Faltan campos requeridos'}), 400
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'message': 'Usuario o correo ya existe'}), 400
    user = User(username=username, email=email)
    # Primer usuario registrado será admin por conveniencia en desarrollo
    if User.query.count() == 0:
        user.is_admin = True
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Registro exitoso', 'is_admin': user.is_admin}), 201

@auth_bp.post('/login')
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Credenciales inválidas'}), 401
    claims = {'is_admin': user.is_admin, 'username': user.username}
    # PyJWT puede exigir que 'sub' (identity) sea cadena; usamos str(user.id)
    access_token = create_access_token(identity=str(user.id), additional_claims=claims)
    return jsonify({'access_token': access_token, 'user': {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_admin
    }}), 200

@auth_bp.post('/logout')
@jwt_required()
def logout():
    # En JWT, el logout se maneja en el cliente (borrar token).
    # Endpoint informativo para UX.
    return jsonify({'message': 'Logout exitoso'}), 200