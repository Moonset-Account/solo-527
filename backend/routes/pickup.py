from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, Order, PickupRecord, User
from utils.decorators import internal_required
from utils.response import success_response, paginate_query
from utils.error_handler import APIError
from utils.helpers import generate_pickup_code

pickup_bp = Blueprint('pickup', __name__)

@pickup_bp.route('/pending', methods=['GET'])
@internal_required
def list_pending_pickup():
    query = Order.query.filter(Order.status.in_(['sorted', 'packed']))
    building_id = request.args.get('building_id')
    keyword = request.args.get('keyword')
    
    if building_id:
        query = query.filter(Order.building_id == building_id)
    if keyword:
        query = query.join(User).filter(
            (Order.order_no.like(f'%{keyword}%')) |
            (User.name.like(f'%{keyword}%')) |
            (User.phone.like(f'%{keyword}%'))
        )
    
    query = query.order_by(Order.created_at.desc())
    result = paginate_query(query)
    
    return jsonify(success_response({
        'items': [o.to_dict(include_items=True) for o in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page']
    }))

@pickup_bp.route('/verify', methods=['POST'])
@internal_required
def verify_pickup():
    data = request.get_json()
    order_no = data.get('order_no')
    pickup_code = data.get('pickup_code')
    
    if not order_no and not pickup_code:
        raise APIError('请输入订单号或取货码', 400)
    
    order = None
    if order_no:
        order = Order.query.filter_by(order_no=order_no).first()
    elif pickup_code:
        record = PickupRecord.query.filter_by(pickup_code=pickup_code).first()
        if record:
            order = Order.query.get(record.order_id)
    
    if not order:
        raise APIError('订单不存在', 404)
    
    if order.status not in ['sorted', 'packed']:
        raise APIError(f'订单状态：{order.get_status_text()}，无法取货', 400)
    
    return jsonify(success_response(order.to_dict(include_items=True)))

@pickup_bp.route('/confirm', methods=['POST'])
@internal_required
def confirm_pickup():
    data = request.get_json()
    order_id = data.get('order_id')
    remark = data.get('remark')
    
    order = Order.query.get(order_id)
    if not order:
        raise APIError('订单不存在', 404)
    
    if order.status not in ['sorted', 'packed']:
        raise APIError(f'订单状态：{order.get_status_text()}，无法取货', 400)
    
    pickup_code = generate_pickup_code()
    
    record = PickupRecord(
        order_id=order_id,
        user_id=order.user_id,
        picked_by=int(get_jwt_identity()),
        pickup_code=pickup_code,
        remark=remark
    )
    
    order.status = 'picked'
    db.session.add(record)
    db.session.commit()
    
    return jsonify(success_response({
        'order': order.to_dict(),
        'pickup_code': pickup_code
    }, '取货成功'))

@pickup_bp.route('/records', methods=['GET'])
@internal_required
def pickup_records():
    query = PickupRecord.query
    building_id = request.args.get('building_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if building_id:
        query = query.join(Order).filter(Order.building_id == building_id)
    if start_date:
        query = query.filter(PickupRecord.picked_at >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(PickupRecord.picked_at <= datetime.strptime(end_date + ' 23:59:59', '%Y-%m-%d %H:%M:%S'))
    
    query = query.order_by(PickupRecord.picked_at.desc())
    result = paginate_query(query)
    
    return jsonify(success_response({
        'items': [r.to_dict() for r in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page']
    }))
