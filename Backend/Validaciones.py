from database import get_db_connection 
def validar_campos(data, campos_obligatorios):
    """Verifica la presencia y no vaciedad de los campos obligatorios."""
    if not data:
        return "No se enviaron datos."

    for campo in campos_obligatorios:
        if campo not in data:
            return f"Falta el campo obligatorio: {campo}"

        # Usamos strip() en el valor convertido a string para verificar si está vacío
        if str(data[campo]).strip() == "":
            return f"El campo '{campo}' no puede estar vacío."

    return True


# VALIDAR PRÉSTAMO (POST /prestamos) - Encabezado
def validar_prestamo(data):
    """Valida los datos del encabezado del préstamo y la existencia del profesor."""
    # Los campos requeridos para crear el encabezado del préstamo
    # fk_id_Profesor es crítico. Los demás campos pueden ser gestionados por el backend (NOW(), 'Pendiente')
    campos = ["fk_id_Profesor"]
    validar = validar_campos(data, campos)

    if validar is not True:
        return validar

    # Validar ID Profesor
    try:
        id_prof = int(data["fk_id_Profesor"])
    except ValueError:
        return "El ID del profesor debe ser numérico."

    conn = get_db_connection()
    if conn is None:
        return "Error conectando a la base de datos."

    try:
        with conn.cursor() as cursor:
            # 1. Validar la existencia del Profesor
            cursor.execute(
                "SELECT id_Profesor FROM Profesor WHERE id_Profesor = %s",
                (id_prof,)
            )
            profesor = cursor.fetchone()
    finally:
        conn.close()

    if not profesor:
        return "El profesor ingresado no existe."

    return True


# VALIDAR DETALLE DE PRÉSTAMO (POST /detalle-prestamos) - Ítem
def validar_detalle_prestamo(data):
    """
    Valida los datos de un ítem (equipo) dentro de un préstamo existente.
    IMPLEMENTA: No permitir prestar si el equipo ya está prestado (estado 'Prestado').
    """
    # Se espera fk_id_equipo para saber qué prestar, y fk_id_Prestamo para saber a qué préstamo pertenece
    campos = ["fk_id_equipo", "fk_id_Prestamo"]
    validar = validar_campos(data, campos)

    if validar is not True:
        return validar

    try:
        id_equipo = int(data["fk_id_equipo"])
        id_prestamo = int(data["fk_id_Prestamo"])
    except ValueError:
        return "Los IDs deben ser valores numéricos."

    conn = get_db_connection()
    if conn is None:
        return "Error conectando a la base de datos."

    try:
        with conn.cursor() as cursor:
            # 1. Validar que el Préstamo (encabezado) exista
            cursor.execute(
                "SELECT * FROM Prestamo WHERE id_Prestamo = %s",
                (id_prestamo,)
            )
            prestamo = cursor.fetchone()

            if not prestamo:
                return "El préstamo (encabezado) al que se intenta asociar el equipo no existe."

            # 2. Validar que el Equipo exista
            cursor.execute(
                "SELECT * FROM Equipo WHERE id_equipo = %s",
                (id_equipo,)
            )
            equipo = cursor.fetchone()

            if not equipo:
                return "El equipo ingresado no existe."

            # 3. *** VALIDACIÓN CRÍTICA: ESTADO DEL EQUIPO (EVITAR DOBLE PRÉSTAMO) ***
            # Chequeamos si existe un Detalle_prestamo ACTIVO para este equipo
            cursor.execute(
                """
                SELECT id_Detalle_prestamo FROM Detalle_prestamo
                WHERE fk_id_equipo = %s AND estado = 'Prestado'
                """,
                (id_equipo,)
            )
            detalle_activo = cursor.fetchone()

            if detalle_activo:
                # El equipo está listado como 'Prestado' en un detalle activo
                return "El equipo ya está prestado y no ha sido devuelto."

            # Si el equipo tiene un campo de stock o estado global, también se puede verificar aquí
            # Ejemplo: if equipo.get("stock", 0) <= 0: return "Equipo agotado."

    finally:
        conn.close()

    return True


# VALIDAR DEVOLUCIÓN
# PUT /detalle-prestamo/<id>/devolver
def validar_devolucion(id_detalle):
    """Valida que el detalle de préstamo exista y aún no haya sido devuelto."""
    try:
        id_detalle = int(id_detalle)
    except ValueError:
        return "El ID de detalle de préstamo debe ser numérico."
        
    conn = get_db_connection()
    if conn is None:
        return "Error conectando a la base de datos."

    try:
        with conn.cursor(dictionary=True) as cursor: # Usar dictionary=True para acceso por nombre
            # 1. Buscar el detalle
            cursor.execute(
                "SELECT id_Detalle_prestamo, estado FROM Detalle_prestamo WHERE id_Detalle_prestamo = %s",
                (id_detalle,)
            )
            detalle = cursor.fetchone()
    finally:
        conn.close()

    if not detalle:
        return "El detalle de préstamo no existe."

    # 2. Validar estado (usamos el campo 'estado' del resultado de la consulta)
    if detalle["estado"] == "Devuelto":
        return "El equipo ya fue devuelto."

    return True


# VALIDAR ELIMINACIÓN DE PRÉSTAMO (ENCABEZADO)
# DELETE /prestamos/<id>
def validar_eliminar_prestamo(id_prestamo):
    """No permite eliminar un préstamo si tiene equipos asociados (detalles)."""
    try:
        id_prestamo = int(id_prestamo)
    except ValueError:
        return "El ID de préstamo debe ser numérico."
        
    conn = get_db_connection()
    if conn is None:
        return "Error conectando a la base de datos."

    try:
        with conn.cursor(dictionary=True) as cursor: # Usar dictionary=True para acceso por nombre
            # Contar los detalles asociados
            cursor.execute(
                "SELECT COUNT(*) AS total FROM Detalle_prestamo WHERE fk_id_Prestamo = %s",
                (id_prestamo,)
            )
            detalles = cursor.fetchone()["total"]
    finally:
        conn.close()

    if detalles > 0:
        return "No se puede eliminar: el préstamo tiene detalles asociados (elimine los equipos primero)."

    return True