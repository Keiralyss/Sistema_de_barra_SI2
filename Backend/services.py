# Este archivo utiliza los siguientes patrones de diseño de manera implícita:
#
# 1) Patrón Factory Method (Creacional, uso indirecto)
#    Este archivo no crea conexiones a la base de datos por sí mismo, sino que
#    delega esa tarea a la función get_db_connection() definida en app.py.
#    Esa función actúa como una “fábrica” que produce objetos de conexión listos
#    para usar. Services.py solo llama a la fábrica y utiliza el objeto creado.
#
# 2) Patrón Repository / DAO (Comportamiento)
#    Cada función encapsula una operación de consulta hacia la base de datos:
#      - get_professors_with_loans()
#      - get_professor_report()
#    Esto aísla el acceso SQL del resto del sistema. 
#    Los controladores no conocen consultas SQL; simplemente llaman funciones 
#    del servicio, lo que es exactamente el rol de un patrón Repository/DAO.
#
# 3) Patrón Service Layer (Comportamiento)
#    Este archivo agrupa la lógica que combina múltiples consultas, filtros y
#    verificaciones antes de entregar los datos al controlador. 
#    Ejemplo claro: get_professor_report(), que obtiene primero un profesor,
#    luego su historial detallado, devolviendo todo estructurado.
#    Esta organización define una capa de servicio por encima del acceso a datos.
#
# 4) Patrón Transaction Script (Comportamiento, leve)
#    Cada función ejecuta una “unidad” de trabajo completa: abrir conexión,
#    ejecutar consultas, procesar resultados y cerrar la conexión. 
#    No hay objetos persistentes ni modelos complejos, solo scripts secuenciales
#    que resuelven una operación puntual, típico del patrón Transaction Script.
#
# Estos patrones combinados permiten que el acceso a datos sea ordenado, aislado,
# reutilizable y fácil de integrar con los controladores del sistema.

#---------------------------------------------------------------------------------


# backend/services.py
from app import get_db_connection


def get_professors_with_loans():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
            SELECT p.id_Profesor, p.Nombre, p.Email_institucional, p.Rut, p.Activo,
                   COUNT(pr.id_Prestamo) AS total_prestamos
            FROM Profesor p
            JOIN Prestamo pr ON pr.fk_id_Profesor = p.id_Profesor
            GROUP BY p.id_Profesor, p.Nombre, p.Email_institucional, p.Rut, p.Activo
            HAVING COUNT(pr.id_Prestamo) >= 1
            ORDER BY total_prestamos DESC, p.Nombre;
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            return rows
    finally:
        conn.close()


def get_professor_report(prof_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:

            # Profesor
            prof_q = """
            SELECT id_Profesor, Nombre, Email_institucional, Rut, Activo 
            FROM Profesor 
            WHERE id_Profesor = %s
            """
            cursor.execute(prof_q, (prof_id,))
            prof = cursor.fetchone()

            if not prof:
                raise Exception("Profesor no encontrado")

            # Detalle
            detalle_q = """
            SELECT dp.id_Detalle_prestamo, dp.fk_id_equipo, dp.fk_id_Prestamo,
                DATE_FORMAT(dp.fecha_entrega, '%Y-%m-%d') AS fecha_entrega,
                DATE_FORMAT(dp.fecha_devolucion, '%Y-%m-%d') AS fecha_devolucion,
                dp.estado,
                e.Tipo_equipo, e.Descripcion
            FROM Detalle_prestamo dp
            JOIN Equipo e ON e.id_equipo = dp.fk_id_equipo
            JOIN Prestamo pr ON pr.id_Prestamo = dp.fk_id_Prestamo
            WHERE pr.fk_id_Profesor = %s
            ORDER BY dp.fecha_entrega DESC;
            """
            cursor.execute(detalle_q, (prof_id,))
            detalle = cursor.fetchall()

            return prof, detalle

    finally:
        conn.close()

def create_loan(fk_solicitante, fk_beneficiario, fk_equipo, fecha_devolucion=None):
    conn = get_db_connection()
    if conn is None:
        raise Exception("No DB connection")
    try:
        conn.begin()
        with conn.cursor() as cursor:
            # 1) validar equipo disponible
            cursor.execute("SELECT Estado FROM Equipo WHERE id_equipo = %s FOR UPDATE", (fk_equipo,))
            row = cursor.fetchone()
            if not row:
                raise Exception("Equipo no encontrado")
            if row['Estado'].lower() != 'disponible':
                raise Exception("Equipo no disponible")

            # 2) insertar Prestamo (se asigna al beneficiario)
            if not fecha_devolucion:
                # ejemplo: fecha_devolucion = CURDATE() + 7 dias en SQL
                cursor.execute("INSERT INTO Prestamo (fk_id_Profesor, fecha_solicitud, estado, fecha_devolucion) VALUES (%s, CURDATE(), 'Activo', DATE_ADD(CURDATE(), INTERVAL 7 DAY))",
                               (fk_beneficiario,))
            else:
                cursor.execute("INSERT INTO Prestamo (fk_id_Profesor, fecha_solicitud, estado, fecha_devolucion) VALUES (%s, CURDATE(), 'Activo', %s)",
                               (fk_beneficiario, fecha_devolucion))
            id_prestamo = cursor.lastrowid

            # 3) insertar Detalle_prestamo
            if not fecha_devolucion:
                cursor.execute("INSERT INTO Detalle_prestamo (fk_id_equipo, fk_id_Prestamo, fecha_entrega, fecha_devolucion, estado) VALUES (%s, %s, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Entregado')",
                               (fk_equipo, id_prestamo))
            else:
                cursor.execute("INSERT INTO Detalle_prestamo (fk_id_equipo, fk_id_Prestamo, fecha_entrega, fecha_devolucion, estado) VALUES (%s, %s, CURDATE(), %s, 'Entregado')",
                               (fk_equipo, id_prestamo, fecha_devolucion))

            # 4) actualizar Equipo
            cursor.execute("UPDATE Equipo SET Estado = 'Prestado' WHERE id_equipo = %s", (fk_equipo,))

        conn.commit()
        return {"ok": True, "id_Prestamo": id_prestamo, "message": "Prestamo creado"}
    except Exception as e:
        conn.rollback()
        raise
    finally:
        conn.close()
