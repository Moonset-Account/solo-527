from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, SortingBag, SortingBagItem, Order, OrderItem, Building
from utils.decorators import internal_required
from utils.response import success_response, paginate_query
from utils.error_handler import APIError
from utils.helpers import generate_bag_no

sorting_bp = Blueprint('sorting', __name__)

@sorting_bp.route('/bags', methods=['POST'])
@internal_required
def create_bag():
    data = request.get_json()
    building_id = data.get('building_id')
    
    if not building_id:
        raise APIError('请选择楼栋', 400)
    
    building = Building.query.get(building_id)
    if not building:
        raise APIError('楼栋不存在', 404)
    
    bag = SortingBag(
        bag_no=generate_bag_no(building_id),
        building_id=building_id,
        status='packing'
    )
    db.session.add(bag)
    db.session.commit()
    
    return jsonify(success_response(bag.to_dict(), '分拣袋已创建'))

@sorting_bp.route('/bags', methods=['GET'])
@internal_required
def list_bags():
    query = SortingBag.query
    status = request.args.get('status')
    building_id = request.args.get('building_id')
    
    if status:
        query = query.filter(SortingBag.status == status)
    if building_id:
        query = query.filter(SortingBag.building_id == building_id)
    
    query = query.order_by(SortingBag.created_at.desc())
    result = paginate_query(query)
    
    return jsonify(success_response({
        'items': [b.to_dict(include_items=True) for b in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page']
    }))

@sorting_bp.route('/bags/<int:bag_id>', methods=['GET'])
@internal_required
def get_bag(bag_id):
    bag = SortingBag.query.get(bag_id)
    if not bag:
        raise APIError('分拣袋不存在', 404)
    return jsonify(success_response(bag.to_dict(include_items=True)))

@sorting_bp.route('/bags/<int:bag_id>/add-order', methods=['POST'])
@internal_required
def add_order_to_bag(bag_id):
    bag = SortingBag.query.get(bag_id)
    if not bag:
        raise APIError('分拣袋不存在', 404)
    
    if bag.status != 'packing':
        raise APIError('分拣袋已打包，无法添加', 400)
    
    data = request.get_json()
    order_id = data.get('order_id')
    
    order = Order.query.get(order_id)
    if not order:
        raise APIError('订单不存在', 404)
    
    if not order.is_cutoff:
        raise APIError('订单未截单，无法分拣', 400)
    
    if order.building_id != bag.building_id:
        raise APIError('订单所属楼栋与分拣袋不符', 400)
    
    existing = SortingBagItem.query.filter_by(bag_id=bag_id, order_id=order_id).first()
    if existing:
        raise APIError('该订单已在分拣袋中', 400)
    
    added_count = 0
    for item in order.items:
        if item.status != 'normal':
            continue
        bag_item = SortingBagItem(
            order_id=order_id,
            order_item_id=item.id,
            product_name=item.product_name,
            quantity=item.quantity,
            unit=item.unit
        )
        bag.items.append(bag_item)
        added_count += 1
    
    bag.total_orders += 1
    bag.total_items += added_count
    
    order.status = 'sorted'
    db.session.commit()
    
    return jsonify(success_response(bag.to_dict(include_items=True), f'已添加 {added_count} 个商品'))

@sorting_bp.route('/bags/<int:bag_id>/remove-item/<int:item_id>', methods=['DELETE'])
@internal_required
def remove_item_from_bag(bag_id, item_id):
    bag = SortingBag.query.get(bag_id)
    if not bag:
        raise APIError('分拣袋不存在', 404)
    
    if bag.status != 'packing':
        raise APIError('分拣袋已打包，无法移除', 400)
    
    bag_item = SortingBagItem.query.get(item_id)
    if not bag_item or bag_item.bag_id != bag_id:
        raise APIError('商品项不存在', 404)
    
    order_id = bag_item.order_id
    db.session.delete(bag_item)
    bag.total_items -= 1
    
    remaining = SortingBagItem.query.filter_by(bag_id=bag_id, order_id=order_id).count()
    if remaining == 0:
        bag.total_orders -= 1
        order = Order.query.get(order_id)
        if order:
            order.status = 'sorting'
    
    db.session.commit()
    
    return jsonify(success_response(bag.to_dict(include_items=True), '已移除'))

@sorting_bp.route('/bags/<int:bag_id>/check-item/<int:item_id>', methods=['POST'])
@internal_required
def check_bag_item(bag_id, item_id):
    bag_item = SortingBagItem.query.get(item_id)
    if not bag_item or bag_item.bag_id != bag_id:
        raise APIError('商品项不存在', 404)
    
    data = request.get_json()
    checked = data.get('checked', True)
    
    bag_item.is_checked = checked
    if checked:
        bag_item.checked_at = datetime.now()
    else:
        bag_item.checked_at = None
    
    db.session.commit()
    
    return jsonify(success_response(None, '操作成功'))

@sorting_bp.route('/bags/<int:bag_id>/pack', methods=['POST'])
@internal_required
def pack_bag(bag_id):
    bag = SortingBag.query.get(bag_id)
    if not bag:
        raise APIError('分拣袋不存在', 404)
    
    if bag.total_items == 0:
        raise APIError('分拣袋为空，无法打包', 400)
    
    bag.status = 'packed'
    bag.packed_by = get_jwt_identity()
    bag.packed_at = datetime.now()
    
    if 'remark' in request.get_json(silent=True) or {}:
        bag.remark = request.get_json().get('remark')
    
    db.session.commit()
    
    return jsonify(success_response(bag.to_dict(), '已打包'))

@sorting_bp.route('/bags/<int:bag_id>/complete', methods=['POST'])
@internal_required
def complete_bag(bag_id):
    bag = SortingBag.query.get(bag_id)
    if not bag:
        raise APIError('分拣袋不存在', 404)
    
    if bag.status != 'packed':
        raise APIError('请先打包', 400)
    
    bag.status = 'completed'
    
    for bag_item in bag.items:
        order = Order.query.get(bag_item.order_id)
        if order and order.status == 'sorted':
            pass
    
    db.session.commit()
    
    return jsonify(success_response(bag.to_dict(), '已完成'))

@sorting_bp.route('/building-summary', methods=['GET'])
@internal_required
def building_sorting_summary():
    buildings = Building.query.filter_by(is_active=True).all()
    result = []
    
    for building in buildings:
        pending_orders = Order.query.filter_by(
            building_id=building.id,
            is_cutoff=True,
            status='sorting'
        ).count()
        
        sorted_orders = Order.query.filter_by(
            building_id=building.id,
            status='sorted'
        ).count()
        
        packing_bags = SortingBag.query.filter_by(
            building_id=building.id,
            status='packing'
        ).count()
        
        packed_bags = SortingBag.query.filter_by(
            building_id=building.id,
            status='packed'
        ).count()
        
        result.append({
            'building_id': building.id,
            'building_name': building.name,
            'pending_orders': pending_orders,
            'sorted_orders': sorted_orders,
            'packing_bags': packing_bags,
            'packed_bags': packed_bags
        })
    
    return jsonify(success_response(result))
