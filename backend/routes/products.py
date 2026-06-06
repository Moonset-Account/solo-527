from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Product
from utils.decorators import internal_required
from utils.response import success_response, paginate_query
from utils.error_handler import APIError

products_bp = Blueprint('products', __name__)

@products_bp.route('/public', methods=['GET'])
def list_public_products():
    query = Product.query.filter(Product.is_active == True)
    category = request.args.get('category')
    keyword = request.args.get('keyword')
    
    if category:
        query = query.filter(Product.category == category)
    if keyword:
        query = query.filter(Product.name.like(f'%{keyword}%'))
    
    query = query.order_by(Product.created_at.desc())
    result = paginate_query(query, per_page=50)
    
    return jsonify(success_response({
        'items': [p.to_dict() for p in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page']
    }))

@products_bp.route('', methods=['GET'])
@internal_required
def list_products():
    query = Product.query
    category = request.args.get('category')
    keyword = request.args.get('keyword')
    is_active = request.args.get('is_active')
    
    if category:
        query = query.filter(Product.category == category)
    if keyword:
        query = query.filter(Product.name.like(f'%{keyword}%'))
    if is_active is not None:
        query = query.filter(Product.is_active == (is_active == 'true'))
    
    query = query.order_by(Product.created_at.desc())
    result = paginate_query(query)
    
    return jsonify(success_response({
        'items': [p.to_dict() for p in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page'],
        'pages': result['pages']
    }))

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = db.session.query(Product.category).distinct().all()
    category_list = [c[0] for c in categories if c[0]]
    return jsonify(success_response(category_list))

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        raise APIError('商品不存在', 404)
    return jsonify(success_response(product.to_dict()))

@products_bp.route('', methods=['POST'])
@internal_required
def create_product():
    data = request.get_json()
    name = data.get('name')
    unit = data.get('unit')
    price = data.get('price')
    
    if not name or not unit or price is None:
        raise APIError('请填写商品名称、单位和价格', 400)
    
    product = Product(
        name=name,
        category=data.get('category'),
        unit=unit,
        price=float(price),
        stock=int(data.get('stock', 0)),
        image=data.get('image'),
        description=data.get('description'),
        is_active=data.get('is_active', True)
    )
    db.session.add(product)
    db.session.commit()
    
    return jsonify(success_response(product.to_dict(), '创建成功'))

@products_bp.route('/<int:product_id>', methods=['PUT'])
@internal_required
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        raise APIError('商品不存在', 404)
    
    data = request.get_json()
    for field in ['name', 'category', 'unit', 'image', 'description']:
        if field in data:
            setattr(product, field, data[field])
    if 'price' in data:
        product.price = float(data['price'])
    if 'stock' in data:
        product.stock = int(data['stock'])
    if 'is_active' in data:
        product.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(success_response(product.to_dict(), '更新成功'))

@products_bp.route('/<int:product_id>', methods=['DELETE'])
@internal_required
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        raise APIError('商品不存在', 404)
    
    product.is_active = False
    db.session.commit()
    return jsonify(success_response(None, '已下架'))
