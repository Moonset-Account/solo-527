from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from io import BytesIO
import pandas as pd
from datetime import datetime
from models import Order, OrderItem, Building, User, Refund, ShortageItem, SortingBag
from utils.decorators import internal_required
from utils.error_handler import APIError

exports_bp = Blueprint('exports', __name__)

def create_excel_response(df, filename):
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Sheet1')
    output.seek(0)
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'{filename}_{datetime.now().strftime("%Y%m%d%H%M%S")}.xlsx'
    )

@exports_bp.route('/orders', methods=['GET'])
@internal_required
def export_orders():
    status = request.args.get('status')
    building_id = request.args.get('building_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Order.query
    if status:
        status_list = [s.strip() for s in status.split(',') if s.strip()]
        if len(status_list) > 1:
            query = query.filter(Order.status.in_(status_list))
        else:
            query = query.filter(Order.status == status)
    if building_id:
        query = query.filter(Order.building_id == building_id)
    if start_date:
        query = query.filter(Order.created_at >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(Order.created_at <= datetime.strptime(end_date + ' 23:59:59', '%Y-%m-%d %H:%M:%S'))
    
    orders = query.order_by(Order.created_at.desc()).all()
    
    data = []
    for order in orders:
        building_name = order.building.name if order.building else ''
        user_name = order.user.name if order.user else ''
        user_phone = order.user.phone if order.user else ''
        
        items_str = '; '.join([f'{item.product_name} x{item.quantity}{item.unit}' for item in order.items])
        
        data.append({
            '订单号': order.order_no,
            '下单时间': order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            '用户姓名': user_name,
            '手机号': user_phone,
            '楼栋': building_name,
            '房号': order.room_number or '',
            '商品明细': items_str,
            '订单金额': order.total_amount,
            '订单状态': order.get_status_text(),
            '是否截单': '是' if order.is_cutoff else '否',
            '备注': order.remark or ''
        })
    
    df = pd.DataFrame(data)
    return create_excel_response(df, '订单列表')

@exports_bp.route('/sorting/<int:building_id>', methods=['GET'])
@internal_required
def export_sorting(building_id):
    building = Building.query.get(building_id)
    if not building:
        raise APIError('楼栋不存在', 404)
    
    orders = Order.query.filter_by(
        building_id=building_id,
        is_cutoff=True
    ).filter(Order.status.in_(['sorting', 'sorted'])).all()
    
    data = []
    product_summary = {}
    
    for order in orders:
        user_name = order.user.name if order.user else ''
        room_number = order.room_number or ''
        
        for item in order.items:
            key = f'{item.product_name}|{item.unit}'
            if key not in product_summary:
                product_summary[key] = {'name': item.product_name, 'unit': item.unit, 'total': 0}
            product_summary[key]['total'] += item.quantity
            
            data.append({
                '订单号': order.order_no,
                '用户': user_name,
                '房号': room_number,
                '商品名称': item.product_name,
                '数量': item.quantity,
                '单位': item.unit,
                '单价': item.price,
                '小计': item.subtotal
            })
    
    df = pd.DataFrame(data)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='分拣明细')
        
        summary_data = []
        for ps in product_summary.values():
            summary_data.append({
                '商品名称': ps['name'],
                '单位': ps['unit'],
                '总数量': ps['total']
            })
        if summary_data:
            pd.DataFrame(summary_data).to_excel(writer, index=False, sheet_name='商品汇总')
    
    output.seek(0)
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'{building.name}_分拣单_{datetime.now().strftime("%Y%m%d%H%M%S")}.xlsx'
    )

@exports_bp.route('/refunds', methods=['GET'])
@internal_required
def export_refunds():
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Refund.query
    if status:
        status_list = [s.strip() for s in status.split(',') if s.strip()]
        if len(status_list) > 1:
            query = query.filter(Refund.status.in_(status_list))
        else:
            query = query.filter(Refund.status == status)
    if start_date:
        query = query.filter(Refund.created_at >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(Refund.created_at <= datetime.strptime(end_date + ' 23:59:59', '%Y-%m-%d %H:%M:%S'))
    
    refunds = query.order_by(Refund.created_at.desc()).all()
    
    data = []
    for refund in refunds:
        data.append({
            '退款单号': refund.refund_no,
            '关联订单': refund.order.order_no if refund.order else '',
            '申请时间': refund.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            '退款金额': refund.amount,
            '退款原因': refund.reason or '',
            '状态': refund.get_status_text(),
            '审批时间': refund.approved_at.strftime('%Y-%m-%d %H:%M:%S') if refund.approved_at else '',
            '备注': refund.remark or ''
        })
    
    df = pd.DataFrame(data)
    return create_excel_response(df, '退款列表')

@exports_bp.route('/shortages', methods=['GET'])
@internal_required
def export_shortages():
    status = request.args.get('status')
    building_id = request.args.get('building_id')
    
    query = ShortageItem.query
    if status:
        status_list = [s.strip() for s in status.split(',') if s.strip()]
        if len(status_list) > 1:
            query = query.filter(ShortageItem.status.in_(status_list))
        else:
            query = query.filter(ShortageItem.status == status)
    if building_id:
        query = query.join(Order).filter(Order.building_id == building_id)
    
    shortages = query.order_by(ShortageItem.created_at.desc()).all()
    
    data = []
    for s in shortages:
        building_name = s.order.building.name if s.order and s.order.building else ''
        data.append({
            '订单号': s.order.order_no if s.order else '',
            '楼栋': building_name,
            '缺货商品': s.product_name,
            '缺货数量': s.shortage_quantity,
            '替换商品': s.replace_product_name or '',
            '替换数量': s.replace_quantity or '',
            '状态': s.get_status_text(),
            '用户确认': '是' if s.user_confirm else '否' if s.user_confirm is False else '未确认',
            '确认时间': s.confirm_at.strftime('%Y-%m-%d %H:%M:%S') if s.confirm_at else '',
            '备注': s.remark or ''
        })
    
    df = pd.DataFrame(data)
    return create_excel_response(df, '缺货列表')
