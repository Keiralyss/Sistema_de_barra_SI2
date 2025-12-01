# backend/api/__init__.py
from api.reports import reports_bp
from api.loans import loans_bp

def register_blueprints(app):
    app.register_blueprint(reports_bp, url_prefix="/api")

def register_blueprints(app):
    """
    Registra todos los blueprints del paquete `api` en la aplicación Flask `app`.
    Llamar desde el archivo principal (main.py / app.py):
        from api import register_blueprints
        register_blueprints(app)
    """
    # Si tus blueprints en sus archivos usan rutas como @bp.route('/reports/...'),
    # registra todos bajo el prefijo '/api' para que la ruta final sea /api/reports/...
    app.register_blueprint(reports_bp, url_prefix="/api")
    app.register_blueprint(loans_bp,   url_prefix="/api")
