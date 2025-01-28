from .places import places_bp

def register_blueprints(app):
    app.register_blueprint(places_bp)
