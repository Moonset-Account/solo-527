from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, Refund, Order, OrderItem
from utils.decorators import internal_required, get_current_user
from utils.response import success_response, paginate_query
from utils.error_handler import APIError
from utils.helpers import generate_refund_no

refunds_bp = Blueprint('refunds', __name__)

@refunds_bp.route('', methods=['POST'])
@jwt_required()
def create_refund():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    order_id = data.get('order_id')
    order_item_id = data.get('order_item_id')
    amount = data.get('amount')
    reason = data.get('reason')
    
    if not order_id or amount is None:
        raise APIError('请填写完整信息', 400)
    
    order = Order.query.get(order_id)
    if not order:
        raise APIError('订单不存在', 404)
    
    if order.user_id != user_id:
        raise APIError('无权申请此订单退款', 403)
    
    refund = Refund(
        refund_no=generate_refund_no(),
        order_id=order_id,
        order_item_id=order_item_id,
        user_id=user_id,
        amount=float(amount),
        reason=reason
    )
    
    db.session.add(refund)
    db.session.commit()
    
    return jsonify(success_response(refund.to_dict(), '退款申请已提交'))

@refunds_bp.route('', methods=['GET'])
@internal_required
def list_refunds():
    query = Refund.query
    status = request.args.get('status')
    building_id = request.args.get('building_id')
    keyword = request.args.get('keyword')
    
    if status:
        status_list = [s.strip() for s in status.split(',') if s.strip()]
        if len(status_list) > 1:
            query = query.filter(Refund.status.in_(status_list))
        else:
            query = query.filter(Refund.status == status)
    if building_id:
        query = query.join(Order).filter(Order.building_id == building_id)
    if keyword:
        query = query.filter(
            (Refund.refund_no.like(f'%{keyword}%')) |
            (Refund.reason.like(f'%{keyword}%'))
        )
    
    query = query.order_by(Refund.created_at.desc())
    result = paginate_query(query)
    
    return jsonify(success_response({
        'items': [r.to_dict() for r in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page']
    }))

@refunds_bp.route('/my', methods=['GET'])
@jwt_required()
def my_refunds():
    user_id = int(get_jwt_identity())
    status = request.args.get('status')
    
    query = Refund.query.filter_by(user_id=user_id)
    if status:
        status_list = [s.strip() for s in status.split(',') if s.strip()]
        if len(status_list) > 1:
            query = query.filter(Refund.status.in_(status_list))
        else:
            query = query.filter(Refund.status == status)
    
    query = query.order_by(Refund.created_at.desc())
    result = paginate_query(query)
    
    return jsonify(success_response({
        'items': [r.to_dict() for r in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page']
    }))

@refunds_bp.route('/<int:refund_id>/approve', methods=['POST'])
@internal_required
def approve_refund(refund_id):
    refund = Refund.query.get(refund_id)
    if not refund:
        raise APIError('退款记录不存在', 404)
    
    if refund.status != 'pending':
        raise APIError('当前状态无法审批', 400)
    
    data = request.get_json()
    remark = data.get('remark')
    
    refund.status = 'approved'
    refund.approved_by = int(get_jwt_identity())
    refund.approved_at = datetime.now()
    if remark:
        refund.remark = remark
    
    db.session.commit()
    
    return jsonify(success_response(refund.to_dict(), '已通过'))

@refunds_bp.route('/<int:refund_id>/reject', methods=['POST'])
@internal_required
def reject_refund(refund_id):
    refund = Refund.query.get(refund_id)
    if not refund:
        raise APIError('退款记录不存在', 404)
    
    if refund.status != 'pending':
        raise APIError('当前状态无法审批', 400)
    
    data = request.get_json()
    remark = data.get('remark')
    
    refund.status = 'rejected'
    refund.approved_by = int(get_jwt_identity())
    refund.approved_at = datetime.now()
    if remark:
        refund.remark = remark
    
    db.session.commit()
    
    return jsonify(success_response(refund.to_dict(), '已拒绝'))

@refunds_bp.route('/<int:refund_id>/complete', methods=['POST'])
@internal_required
def complete_refund(refund_id):
    refund = Refund.query.get(refund_id)
    if not refund:
        raise APIError('退款记录不存在', 404)
    
    if refund.status != 'approved':
        raise APIError('请先通过审批', 400)
    
    refund.status = 'completed'
    
    order = refund.order
    if order and order.status != 'refunded':
        all_refunded = all(r.status == 'completed' for r in order.refunds)
        if all_refunded:
            order.status = 'refunded'
    
    db.session.commit()
    
    return jsonify(success_response(refund.to_dict(), '退款已完成'))

@refunds_bp.route('/<int:refund_id>/withdraw', methods=['POST'])
@jwt_required()
def withdraw_refund(refund_id):
    refund = Refund.query.get(refund_id)
    if not refund:
        raise APIError('退款记录不存在', 404)
    
    current_user = get_current_user()
    if refund.user_id != current_user.id and current_user.role == 'user':
        raise APIError('无权撤回', 403)
    
    if refund.status != 'pending':
        raise APIError('当前状态无法撤回', 400)
    
    db.session.delete(refund)
    db.session.commit()
    
    return jsonify(success_response(None, '已撤回'))
