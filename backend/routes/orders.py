from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, Order, OrderItem, Product, User, Building
from utils.decorators import internal_required, get_current_user
from utils.response import success_response, paginate_query
from utils.error_handler import APIError
from utils.helpers import generate_order_no, generate_pickup_code

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('', methods=['POST'])
@jwt_required()
def create_order():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    items = data.get('items', [])
    building_id = data.get('building_id')
    room_number = data.get('room_number')
    remark = data.get('remark')
    
    if not items:
        raise APIError('请选择商品', 400)
    if not building_id:
        raise APIError('请选择楼栋', 400)
    
    building = Building.query.get(building_id)
    if not building or not building.is_active:
        raise APIError('所选楼栋无效', 400)
    
    order = Order(
        order_no=generate_order_no(),
        user_id=user_id,
        building_id=building_id,
        room_number=room_number,
        remark=remark,
        status='pending'
    )
    
    total_amount = 0
    for item_data in items:
        product_id = item_data.get('product_id')
        quantity = float(item_data.get('quantity', 0))
        
        if quantity <= 0:
            continue
        
        product = Product.query.get(product_id)
        if not product or not product.is_active:
            raise APIError(f'商品不存在或已下架', 400)
        
        subtotal = product.price * quantity
        total_amount += subtotal
        
        order_item = OrderItem(
            product_id=product_id,
            product_name=product.name,
            unit=product.unit,
            price=product.price,
            quantity=quantity,
            subtotal=subtotal
        )
        order.items.append(order_item)
    
    order.total_amount = total_amount
    db.session.add(order)
    db.session.commit()
    
    return jsonify(success_response(order.to_dict(include_items=True), '下单成功'))

@orders_bp.route('/my', methods=['GET'])
@jwt_required()
def my_orders():
    user_id = int(get_jwt_identity())
    status = request.args.get('status')
    
    query = Order.query.filter_by(user_id=user_id)
    if status:
        query = query.filter(Order.status == status)
    
    query = query.order_by(Order.created_at.desc())
    result = paginate_query(query)
    
    return jsonify(success_response({
        'items': [o.to_dict(include_items=True) for o in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page']
    }))

@orders_bp.route('', methods=['GET'])
@internal_required
def list_orders():
    query = Order.query
    status = request.args.get('status')
    building_id = request.args.get('building_id')
    user_id = request.args.get('user_id')
    keyword = request.args.get('keyword')
    is_cutoff = request.args.get('is_cutoff')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if status:
        query = query.filter(Order.status == status)
    if building_id:
        query = query.filter(Order.building_id == building_id)
    if user_id:
        query = query.filter(Order.user_id == user_id)
    if keyword:
        query = query.join(User).filter(
            (Order.order_no.like(f'%{keyword}%')) |
            (User.name.like(f'%{keyword}%')) |
            (User.phone.like(f'%{keyword}%'))
        )
    if is_cutoff is not None:
        query = query.filter(Order.is_cutoff == (is_cutoff == 'true'))
    if start_date:
        query = query.filter(Order.created_at >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(Order.created_at <= datetime.strptime(end_date + ' 23:59:59', '%Y-%m-%d %H:%M:%S'))
    
    query = query.order_by(Order.created_at.desc())
    result = paginate_query(query)
    
    return jsonify(success_response({
        'items': [o.to_dict(include_items=True) for o in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page'],
        'pages': result['pages']
    }))

@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        raise APIError('订单不存在', 404)
    
    current_user = get_current_user()
    if current_user.role not in ['admin', 'staff'] and order.user_id != current_user.id:
        raise APIError('无权查看此订单', 403)
    
    return jsonify(success_response(order.to_dict(include_items=True)))

@orders_bp.route('/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        raise APIError('订单不存在', 404)
    
    current_user = get_current_user()
    
    if order.is_cutoff and current_user.role == 'user':
        raise APIError('订单已截单，无法修改', 400)
    
    if current_user.role == 'user' and order.user_id != current_user.id:
        raise APIError('无权修改此订单', 403)
    
    data = request.get_json()
    
    if current_user.role in ['admin', 'staff']:
        if 'status' in data:
            order.status = data['status']
        if 'remark' in data:
            order.remark = data['remark']
    
    if not order.is_cutoff and current_user.role == 'user':
        if 'remark' in data:
            order.remark = data['remark']
    
    db.session.commit()
    return jsonify(success_response(order.to_dict(), '更新成功'))

@orders_bp.route('/<int:order_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        raise APIError('订单不存在', 404)
    
    current_user = get_current_user()
    if order.user_id != current_user.id and current_user.role == 'user':
        raise APIError('无权取消此订单', 403)
    
    if order.is_cutoff:
        raise APIError('订单已截单，无法取消', 400)
    
    if order.status not in ['pending', 'confirmed']:
        raise APIError('当前状态无法取消', 400)
    
    order.status = 'cancelled'
    db.session.commit()
    
    return jsonify(success_response(None, '取消成功'))

@orders_bp.route('/cutoff', methods=['POST'])
@internal_required
def cutoff_orders():
    data = request.get_json()
    order_ids = data.get('order_ids', [])
    building_id = data.get('building_id')
    
    query = Order.query.filter(Order.is_cutoff == False)
    if order_ids:
        query = query.filter(Order.id.in_(order_ids))
    if building_id:
        query = query.filter(Order.building_id == building_id)
    
    orders = query.filter(Order.status.in_(['pending', 'confirmed'])).all()
    
    for order in orders:
        order.is_cutoff = True
        order.cutoff_at = datetime.now()
        order.status = 'sorting'
    
    db.session.commit()
    
    return jsonify(success_response({'count': len(orders)}, f'已截单 {len(orders)} 个订单'))

@orders_bp.route('/cutoff-reminder', methods=['GET'])
@internal_required
def cutoff_reminder():
    pending_orders = Order.query.filter(
        Order.is_cutoff == False,
        Order.status.in_(['pending', 'confirmed'])
    ).count()
    
    buildings = Building.query.filter_by(is_active=True).all()
    building_stats = []
    for b in buildings:
        count = Order.query.filter_by(
            building_id=b.id,
            is_cutoff=False,
            status='confirmed'
        ).count()
        if count > 0:
            building_stats.append({
                'building_id': b.id,
                'building_name': b.name,
                'pending_count': count
            })
    
    return jsonify(success_response({
        'total_pending': pending_orders,
        'building_stats': building_stats
    }))
