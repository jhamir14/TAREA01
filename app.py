from flask import Flask, render_template, request, redirect, url_for, flash
from flask_migrate import Migrate
from datetime import datetime

from models import db, Alumno, Curso, Tarea, Nota

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///educacion.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key'  # para flash messages

# Inicializar DB y migraciones
db.init_app(app)
migrate = Migrate(app, db)

@app.route('/')
def index():
    alumnos_count = Alumno.query.count()
    cursos_count = Curso.query.count()
    tareas_count = Tarea.query.count()
    notas_count = Nota.query.count()
    ultimas_notas = Nota.query.order_by(Nota.id.desc()).limit(5).all()
    stats = {
        'alumnos': alumnos_count,
        'cursos': cursos_count,
        'tareas': tareas_count,
        'notas': notas_count
    }
    return render_template('index.html', stats=stats, ultimas_notas=ultimas_notas)

# -------------------- ALUMNOS --------------------
@app.route('/alumnos')
def alumnos_list():
    alumnos = Alumno.query.order_by(Alumno.apellido, Alumno.nombre).all()
    return render_template('alumnos/list.html', alumnos=alumnos)

@app.route('/alumnos/nuevo', methods=['GET', 'POST'])
def alumnos_create():
    if request.method == 'POST':
        nombre = request.form.get('nombre','').strip()
        apellido = request.form.get('apellido','').strip()
        email = request.form.get('email','').strip()
        if not nombre or not apellido or not email:
            flash('Todos los campos de Alumno son obligatorios.', 'error')
            return redirect(url_for('alumnos_create'))
        a = Alumno(nombre=nombre, apellido=apellido, email=email)
        db.session.add(a)
        db.session.commit()
        flash('Alumno creado correctamente.', 'success')
        return redirect(url_for('alumnos_list'))
    return render_template('alumnos/form.html', alumno=None)

@app.route('/alumnos/<int:alumno_id>/editar', methods=['GET', 'POST'])
def alumnos_edit(alumno_id):
    alumno = Alumno.query.get_or_404(alumno_id)
    if request.method == 'POST':
        alumno.nombre = request.form.get('nombre','').strip()
        alumno.apellido = request.form.get('apellido','').strip()
        alumno.email = request.form.get('email','').strip()
        db.session.commit()
        flash('Alumno actualizado correctamente.', 'success')
        return redirect(url_for('alumnos_list'))
    return render_template('alumnos/form.html', alumno=alumno)

@app.route('/alumnos/<int:alumno_id>/eliminar', methods=['POST'])
def alumnos_delete(alumno_id):
    alumno = Alumno.query.get_or_404(alumno_id)
    db.session.delete(alumno)
    db.session.commit()
    flash('Alumno eliminado.', 'success')
    return redirect(url_for('alumnos_list'))

@app.route('/alumnos/<int:alumno_id>')
def alumnos_detail(alumno_id):
    alumno = Alumno.query.get_or_404(alumno_id)
    notas = Nota.query.filter_by(alumno_id=alumno.id).order_by(Nota.id.desc()).all()
    return render_template('alumnos/detail.html', alumno=alumno, notas=notas)

# -------------------- CURSOS --------------------
@app.route('/cursos')
def cursos_list():
    cursos = Curso.query.order_by(Curso.nombre).all()
    return render_template('cursos/list.html', cursos=cursos)

@app.route('/cursos/nuevo', methods=['GET', 'POST'])
def cursos_create():
    if request.method == 'POST':
        nombre = request.form.get('nombre','').strip()
        descripcion = request.form.get('descripcion','').strip()
        if not nombre:
            flash('El nombre del curso es obligatorio.', 'error')
            return redirect(url_for('cursos_create'))
        c = Curso(nombre=nombre, descripcion=descripcion)
        db.session.add(c)
        db.session.commit()
        flash('Curso creado correctamente.', 'success')
        return redirect(url_for('cursos_list'))
    return render_template('cursos/form.html', curso=None)

@app.route('/cursos/<int:curso_id>/editar', methods=['GET', 'POST'])
def cursos_edit(curso_id):
    curso = Curso.query.get_or_404(curso_id)
    if request.method == 'POST':
        curso.nombre = request.form.get('nombre','').strip()
        curso.descripcion = request.form.get('descripcion','').strip()
        db.session.commit()
        flash('Curso actualizado correctamente.', 'success')
        return redirect(url_for('cursos_list'))
    return render_template('cursos/form.html', curso=curso)

@app.route('/cursos/<int:curso_id>/eliminar', methods=['POST'])
def cursos_delete(curso_id):
    curso = Curso.query.get_or_404(curso_id)
    db.session.delete(curso)
    db.session.commit()
    flash('Curso eliminado.', 'success')
    return redirect(url_for('cursos_list'))

# -------------------- TAREAS --------------------
@app.route('/tareas')
def tareas_list():
    tareas = Tarea.query.order_by(Tarea.fecha_limite.desc().nullslast()).all()
    return render_template('tareas/list.html', tareas=tareas)

@app.route('/tareas/nueva', methods=['GET', 'POST'])
def tareas_create():
    if request.method == 'POST':
        nombre = request.form.get('nombre','').strip()
        descripcion = request.form.get('descripcion','').strip()
        fecha_limite_str = request.form.get('fecha_limite','').strip()
        completada = request.form.get('completada') == 'on'
        fecha_limite = None
        if fecha_limite_str:
            try:
                fecha_limite = datetime.strptime(fecha_limite_str, '%Y-%m-%d').date()
            except ValueError:
                flash('Fecha límite inválida. Use formato YYYY-MM-DD.', 'error')
                return redirect(url_for('tareas_create'))
        if not nombre:
            flash('El nombre de la tarea es obligatorio.', 'error')
            return redirect(url_for('tareas_create'))
        t = Tarea(nombre=nombre, descripcion=descripcion, fecha_limite=fecha_limite, completada=completada)
        db.session.add(t)
        db.session.commit()
        flash('Tarea creada correctamente.', 'success')
        return redirect(url_for('tareas_list'))
    return render_template('tareas/form.html', tarea=None)

@app.route('/tareas/<int:tarea_id>/editar', methods=['GET', 'POST'])
def tareas_edit(tarea_id):
    tarea = Tarea.query.get_or_404(tarea_id)
    if request.method == 'POST':
        tarea.nombre = request.form.get('nombre','').strip()
        tarea.descripcion = request.form.get('descripcion','').strip()
        fecha_limite_str = request.form.get('fecha_limite','').strip()
        tarea.completada = request.form.get('completada') == 'on'
        if fecha_limite_str:
            try:
                tarea.fecha_limite = datetime.strptime(fecha_limite_str, '%Y-%m-%d').date()
            except ValueError:
                flash('Fecha límite inválida. Use formato YYYY-MM-DD.', 'error')
                return redirect(url_for('tareas_edit', tarea_id=tarea_id))
        else:
            tarea.fecha_limite = None
        db.session.commit()
        flash('Tarea actualizada correctamente.', 'success')
        return redirect(url_for('tareas_list'))
    return render_template('tareas/form.html', tarea=tarea)

@app.route('/tareas/<int:tarea_id>/eliminar', methods=['POST'])
def tareas_delete(tarea_id):
    tarea = Tarea.query.get_or_404(tarea_id)
    db.session.delete(tarea)
    db.session.commit()
    flash('Tarea eliminada.', 'success')
    return redirect(url_for('tareas_list'))

# -------------------- NOTAS --------------------
@app.route('/notas')
def notas_list():
    notas = Nota.query.order_by(Nota.id.desc()).all()
    return render_template('notas/list.html', notas=notas)

@app.route('/notas/nueva', methods=['GET', 'POST'])
def notas_create():
    alumnos = Alumno.query.order_by(Alumno.apellido, Alumno.nombre).all()
    cursos = Curso.query.order_by(Curso.nombre).all()
    tareas = Tarea.query.order_by(Tarea.nombre).all()
    pre_alumno_id = request.args.get('alumno_id', type=int)

    if request.method == 'POST':
        valor_str = request.form.get('valor','').strip()
        alumno_id = request.form.get('alumno_id', type=int)
        curso_id = request.form.get('curso_id', type=int)
        tarea_id = request.form.get('tarea_id', type=int)
        try:
            valor = float(valor_str)
        except ValueError:
            flash('El valor de la nota debe ser numérico.', 'error')
            return redirect(url_for('notas_create'))
        if not (alumno_id and curso_id and tarea_id):
            flash('Debe seleccionar Alumno, Curso y Tarea.', 'error')
            return redirect(url_for('notas_create'))
        n = Nota(valor=valor, alumno_id=alumno_id, curso_id=curso_id, tarea_id=tarea_id)
        db.session.add(n)
        db.session.commit()
        flash('Nota creada correctamente.', 'success')
        return redirect(url_for('notas_list'))

    return render_template('notas/form.html', alumnos=alumnos, cursos=cursos, tareas=tareas, pre_alumno_id=pre_alumno_id)

@app.route('/notas/<int:nota_id>/editar', methods=['GET', 'POST'])
def notas_edit(nota_id):
    nota = Nota.query.get_or_404(nota_id)
    if request.method == 'POST':
        valor_str = request.form.get('valor','').strip()
        try:
            nota.valor = float(valor_str)
        except ValueError:
            flash('El valor de la nota debe ser numérico.', 'error')
            return redirect(url_for('notas_edit', nota_id=nota_id))
        db.session.commit()
        flash('Nota actualizada correctamente.', 'success')
        return redirect(url_for('notas_list'))
    return render_template('notas/edit.html', nota=nota)

@app.route('/notas/<int:nota_id>/eliminar', methods=['POST'])
def notas_delete(nota_id):
    nota = Nota.query.get_or_404(nota_id)
    db.session.delete(nota)
    db.session.commit()
    flash('Nota eliminada.', 'success')
    return redirect(url_for('notas_list'))

if __name__ == '__main__':
    app.run(debug=True)