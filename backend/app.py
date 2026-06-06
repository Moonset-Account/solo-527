from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app, supports_credentials=True)
    JWTManager(app)
    db.init_app(app)
    
    with app.app_context():
        from routes.auth import auth_bp
        from routes.users import users_bp
        from routes.products import products_bp
        from routes.buildings import buildings_bp
        from routes.orders import orders_bp
        from routes.shortages import shortages_bp
        from routes.refunds import refunds_bp
        from routes.sorting import sorting_bp
        from routes.pickup import pickup_bp
        from routes.filters import filters_bp
        from routes.exports import exports_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(users_bp, url_prefix='/api/users')
        app.register_blueprint(products_bp, url_prefix='/api/products')
        app.register_blueprint(buildings_bp, url_prefix='/api/buildings')
        app.register_blueprint(orders_bp, url_prefix='/api/orders')
        app.register_blueprint(shortages_bp, url_prefix='/api/shortages')
        app.register_blueprint(refunds_bp, url_prefix='/api/refunds')
        app.register_blueprint(sorting_bp, url_prefix='/api/sorting')
        app.register_blueprint(pickup_bp, url_prefix='/api/pickup')
        app.register_blueprint(filters_bp, url_prefix='/api/filters')
        app.register_blueprint(exports_bp, url_prefix='/api/exports')
        
        from utils.error_handler import register_error_handlers
        register_error_handlers(app)
        
        db.create_all()
        
        from models import User, Building, Product
        if not User.query.filter_by(phone='13800138000').first():
            admin = User(
                name='系统管理员',
                phone='13800138000',
                password='admin123',
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
        
        if not Building.query.first():
            buildings = [
                Building(name='1号楼', address='小区东门'),
                Building(name='2号楼', address='小区南门'),
                Building(name='3号楼', address='小区西门'),
                Building(name='5号楼', address='小区北门'),
            ]
            db.session.add_all(buildings)
            db.session.commit()
        
        if not Product.query.first():
            products = [
                Product(name='新鲜西红柿', unit='斤', price=3.5, stock=100, category='蔬菜', image='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20red%20tomatoes%20vegetable&image_size=square'),
                Product(name='有机黄瓜', unit='斤', price=2.8, stock=80, category='蔬菜', image='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20organic%20cucumbers%20vegetable&image_size=square'),
                Product(name='土鸡蛋', unit='个', price=1.5, stock=200, category='蛋禽', image='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20farm%20eggs&image_size=square'),
                Product(name='五花肉', unit='斤', price=28.0, stock=50, category='肉类', image='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20pork%20belly%20meat&image_size=square'),
                Product(name='鲜牛奶', unit='盒', price=8.5, stock=60, category='乳品', image='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20milk%20carton&image_size=square'),
                Product(name='红富士苹果', unit='斤', price=5.0, stock=120, category='水果', image='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20red%20fuji%20apples&image_size=square'),
            ]
            db.session.add_all(products)
            db.session.commit()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
