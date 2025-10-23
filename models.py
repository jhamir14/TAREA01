from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship
from datetime import date

# Instancia global de SQLAlchemy (se inicializa en app.py)
db = SQLAlchemy()

class Alumno(db.Model):
    __tablename__ = 'alumnos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    apellido = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(200), nullable=False, unique=True)

    notas = relationship('Nota', back_populates='alumno', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Alumno {self.nombre} {self.apellido}>"

class Curso(db.Model):
    __tablename__ = 'cursos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)

    notas = relationship('Nota', back_populates='curso', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Curso {self.nombre}>"

class Tarea(db.Model):
    __tablename__ = 'tareas'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    fecha_limite = db.Column(db.Date, nullable=True)
    completada = db.Column(db.Boolean, default=False, nullable=False)

    notas = relationship('Nota', back_populates='tarea', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Tarea {self.nombre} {'(completada)' if self.completada else ''}>"

class Nota(db.Model):
    __tablename__ = 'notas'
    id = db.Column(db.Integer, primary_key=True)
    valor = db.Column(db.Float, nullable=False)

    alumno_id = db.Column(db.Integer, db.ForeignKey('alumnos.id'), nullable=False)
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id'), nullable=False)
    tarea_id = db.Column(db.Integer, db.ForeignKey('tareas.id'), nullable=False)

    alumno = relationship('Alumno', back_populates='notas')
    curso = relationship('Curso', back_populates='notas')
    tarea = relationship('Tarea', back_populates='notas')

    def __repr__(self):
        return f"<Nota {self.valor} Alumno:{self.alumno_id} Curso:{self.curso_id} Tarea:{self.tarea_id}>"