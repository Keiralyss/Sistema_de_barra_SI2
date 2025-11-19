import os
from flask import Flask, jsonify
from flask_cors import CORS
import pymysql
import pymysql.cursors

# Inicializa la aplicación Flask
app = Flask(__name__)
# Habilita CORS para permitir peticiones desde tu Front-end React
CORS(app) 


# 1. CONFIGURACIÓN DE BASE DE DATOS (Leer variables de Docker Compose)

# Importante: Las contraseñas de 'default' (el 2do argumento) NO deben ser las reales.
# Solo se usan si las variables de entorno no están presentes.
DB_HOST = os.getenv('DATABASE_HOST')
DB_USER = os.getenv('DATABASE_USER')
DB_PASSWORD = os.getenv('DATABASE_PASSWORD')
DB_NAME = os.getenv('DATABASE_NAME')

def get_db_connection():
    """Establece y devuelve la conexión a MySQL."""
    if not all([DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
        print("ERROR: Variables de entorno de DB incompletas.")
        return None
        
    try:
        # Nota: El HOST es 'db' porque así lo nombramos en docker-compose.yml
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor # Resultados como diccionarios
        )
        return conn
    except Exception as e:
        # Se lanza si el contenedor de la BD aún no está listo o las credenciales son incorrectas
        print(f"Error al conectar a la DB: {e}")
        return None


# 2. RUTAS DE LA API Ejemplo-

@app.route('/', methods=['GET'])
def home():
    """Ruta de prueba simple."""
    return jsonify({"message": "API de Inventario en ejecución.", "status": "ok"}), 200

@app.route('/api/productos', methods=['GET'])
def get_productos():
    """Obtener todos los productos de la BD."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

    try:
        with conn.cursor() as cursor:
            # Solo hacemos la consulta SELECT:
            cursor.execute("SELECT id, nombre, cantidad FROM Productos;") 
            productos = cursor.fetchall()
            
        conn.close()
        return jsonify(productos), 200

    except pymysql.err.ProgrammingError as e:
        # Error común si la tabla 'Productos' no existe (porque no la has creado en Workbench)
        conn.close()
        return jsonify({"error": "La tabla 'Productos' no existe aún. Conéctate con Workbench para crearla."}), 500
    except Exception as e:
        conn.close()
        return jsonify({"error": f"Error desconocido: {e}"}), 500



# 3. PUNTO DE ENTRADA (Gunicorn)
 
# Gunicorn buscará el objeto 'app'
if __name__ == '__main__':
    # Esto es solo para uso local fuera de Docker/Gunicorn
    app.run(host='0.0.0.0', port=5000, debug=True)

    