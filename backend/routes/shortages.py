from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, ShortageItem, OrderItem, Order, Product
from utils.decorators import internal_required, get_current_user
from utils.response import success_response, paginate_query
from utils.error_handler import APIError

shortages_bp = Blueprint('shortages', __name__)

@shortages_bp.route('', methods=['POST'])
@internal_required
def create_shortage():
    data = request.get_json()
    order_item_id = data.get('order_item_id')
    shortage_quantity = data.get('shortage_quantity')
    remark = data.get('remark')
    
    if not order_item_id or shortage_quantity is None:
        raise APIError('请填写完整信息', 400)
    
    order_item = OrderItem.query.get(order_item_id)
    if not order_item:
        raise APIError('订单项不存在', 404)
    
    if float(shortage_quantity) > order_item.quantity:
        raise APIError('缺货数量不能超过订购数量', 400)
    
    existing = ShortageItem.query.filter_by(
        order_item_id=order_item_id,
        status='pending'
    ).first()
    if existing:
        raise APIError('该商品已有待处理的缺货记录', 400)
    
    shortage = ShortageItem(
        order_id=order_item.order_id,
        order_item_id=order_item_id,
        product_id=order_item.product_id,
        product_name=order_item.product_name,
        shortage_quantity=float(shortage_quantity),
        remark=remark,
        handled_by=int(get_jwt_identity())
    )
    
    db.session.add(shortage)
    db.session.commit()
    
    return jsonify(success_response(shortage.to_dict(), '已记录缺货'))

@shortages_bp.route('', methods=['GET'])
@internal_required
def list_shortages():
    query = ShortageItem.query
    status = request.args.get('status')
    building_id = request.args.get('building_id')
    keyword = request.args.get('keyword')
    
    if status:
        query = query.filter(ShortageItem.status == status)
    if building_id:
        query = query.join(Order).filter(Order.building_id == building_id)
    if keyword:
        query = query.filter(ShortageItem.product_name.like(f'%{keyword}%'))
    
    query = query.order_by(ShortageItem.created_at.desc())
    result = paginate_query(query)
    
    return jsonify(success_response({
        'items': [s.to_dict() for s in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page']
    }))

@shortages_bp.route('/my', methods=['GET'])
@jwt_required()
def my_shortages():
    user_id = int(get_jwt_identity())
    status = request.args.get('status')
    
    query = ShortageItem.query.join(Order).filter(Order.user_id == user_id)
    if status:
        query = query.filter(ShortageItem.status == status)
    
    query = query.order_by(ShortageItem.created_at.desc())
    result = paginate_query(query)
    
    return jsonify(success_response({
        'items': [s.to_dict() for s in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page']
    }))

@shortages_bp.route('/<int:shortage_id>/replace', methods=['POST'])
@internal_required
def propose_replace(shortage_id):
    shortage = ShortageItem.query.get(shortage_id)
    if not shortage:
        raise APIError('缺货记录不存在', 404)
    
    if shortage.status != 'pending':
        raise APIError('当前状态无法修改替换方案', 400)
    
    data = request.get_json()
    replace_product_id = data.get('replace_product_id')
    replace_quantity = data.get('replace_quantity')
    
    if replace_product_id:
        product = Product.query.get(replace_product_id)
        if not product:
            raise APIError('替换商品不存在', 404)
        shortage.replace_product_id = replace_product_id
        shortage.replace_product_name = product.name
        shortage.replace_price = product.price
    
    if replace_quantity is not None:
        shortage.replace_quantity = float(replace_quantity)
    
    if 'remark' in data:
        shortage.remark = data['remark']
    
    db.session.commit()
    
    return jsonify(success_response(shortage.to_dict(), '已提交替换方案'))

@shortages_bp.route('/<int:shortage_id>/confirm', methods=['POST'])
@jwt_required()
def user_confirm(shortage_id):
    shortage = ShortageItem.query.get(shortage_id)
    if not shortage:
        raise APIError('缺货记录不存在', 404)
    
    current_user = get_current_user()
    if shortage.order.user_id != current_user.id and current_user.role == 'user':
        raise APIError('无权操作', 403)
    
    if shortage.status != 'pending':
        raise APIError('当前状态无法确认', 400)
    
    data = request.get_json()
    confirm = data.get('confirm', False)
    
    shortage.user_confirm = confirm
    shortage.confirm_at = datetime.now()
    
    if confirm:
        shortage.status = 'confirmed'
    else:
        shortage.status = 'rejected'
    
    db.session.commit()
    
    return jsonify(success_response(shortage.to_dict(), '操作成功'))

@shortages_bp.route('/<int:shortage_id>/complete', methods=['POST'])
@internal_required
def complete_shortage(shortage_id):
    shortage = ShortageItem.query.get(shortage_id)
    if not shortage:
        raise APIError('缺货记录不存在', 404)
    
    shortage.status = 'completed'
    db.session.commit()
    
    return jsonify(success_response(shortage.to_dict(), '已完成'))
