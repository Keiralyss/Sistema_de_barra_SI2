# backend/api/loans.py
from flask import Blueprint, request, jsonify, current_app
from app import get_db_connection  # ajusta import según tu estructura
import pymysql

loans_bp = Blueprint('loans', __name__)

@loans_bp.route('/loans/request', methods=['POST'])
def request_loan():
    """
    POST /api/loans/request
    body: { fk_id_Profesor_solicitante, fk_id_Profesor_beneficiario, fk_id_equipo, fecha_devolucion (YYYY-MM-DD) }
    """
    data = request.get_json() or {}
    solicitante = data.get('fk_id_Profesor_solicitante')
    beneficiario = data.get('fk_id_Profesor_beneficiario')
    equipo_id = data.get('fk_id_equipo')
    fecha_devolucion = data.get('fecha_devolucion')  # opcional

    if not solicitante or not beneficiario or not equipo_id:
        return jsonify({"ok": False, "message": "Faltan campos: solicitante, beneficiario o equipo"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"ok": False, "message": "Error de conexión DB"}), 500

    try:
        with conn.cursor() as cursor:
            # 1) Verificar equipo existe y esté disponible
            cursor.execute("SELECT Estado FROM Equipo WHERE id_equipo = %s FOR UPDATE", (equipo_id,))
            row = cursor.fetchone()
            if not row:
                return jsonify({"ok": False, "message": "Equipo no encontrado"}), 404
            if row['Estado'].lower() != 'disponible':
                return jsonify({"ok": False, "message": "Equipo no disponible"}), 400

            # 2) Validar beneficiario existe y activo
            cursor.execute("SELECT Activo FROM Profesor WHERE id_Profesor = %s", (beneficiario,))
            prof = cursor.fetchone()
            if not prof or prof['Activo'] != 1:
                return jsonify({"ok": False, "message": "Beneficiario no válido o no activo"}), 400

            # 3) Crear prestamo y detalle (en la misma transacción)
            # Si fecha_devolucion no viene, el backend puede calcular por ejemplo +7 días
            if not fecha_devolucion:
                cursor.execute("SELECT DATE_ADD(CURDATE(), INTERVAL 7 DAY) AS fd")
                fecha_devolucion = cursor.fetchone()['fd']

            # Insert Prestamo
            cursor.execute(
                "INSERT INTO Prestamo (fk_id_Profesor, fecha_solicitud, estado, fecha_devolucion) "
                "VALUES (%s, CURDATE(), %s, %s)",
                (beneficiario, 'Activo', fecha_devolucion)
            )
            id_prestamo = cursor.lastrowid

            # Insert Detalle_prestamo
            cursor.execute(
                "INSERT INTO Detalle_prestamo (fk_id_equipo, fk_id_Prestamo, fecha_entrega, fecha_devolucion, estado) "
                "VALUES (%s, %s, CURDATE(), %s, %s)",
                (equipo_id, id_prestamo, fecha_devolucion, 'Entregado')
            )
            id_detalle = cursor.lastrowid

            # Update Equipo estado
            cursor.execute("UPDATE Equipo SET Estado = %s WHERE id_equipo = %s", ('Prestado', equipo_id))

            # commit
            conn.commit()

        return jsonify({"ok": True, "id_Prestamo": id_prestamo, "id_Detalle": id_detalle, "message": "Préstamo creado"}), 201

    except Exception as e:
        conn.rollback()
        current_app.logger.exception("Error creando préstamo")
        return jsonify({"ok": False, "message": str(e)}), 500
    finally:
        conn.close()
