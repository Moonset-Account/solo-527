from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import ErrorLog, Notification
from extensions import db
from utils.error_handler import ValidationError
from datetime import datetime, timedelta

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('/errors', methods=['GET'])
@jwt_required()
def list_error_logs():
    from utils.auth import role_required
    role_required('admin').check()
    
    level = request.args.get('level')
    days = request.args.get('days', 30, type=int)
    
    query = ErrorLog.query
    
    if level:
        query = query.filter_by(level=level)
    
    if days > 0:
        start_date = datetime.now() - timedelta(days=days)
        query = query.filter(ErrorLog.created_at >= start_date)
    
    logs = query.order_by(ErrorLog.created_at.desc()).limit(200).all()
    
    return jsonify([{
        'id': l.id,
        'level': l.level,
        'message': l.message,
        'path': l.path,
        'method': l.method,
        'user_id': l.user_id,
        'ip_address': l.ip_address,
        'created_at': l.created_at.isoformat()
    } for l in logs]), 200

@logs_bp.route('/errors/<int:log_id>', methods=['GET'])
@jwt_required()
def get_error_log(log_id):
    from utils.auth import role_required
    role_required('admin').check()
    
    log = ErrorLog.query.get(log_id)
    if not log:
        raise ValidationError('日志不存在')
    
    return jsonify({
        'id': log.id,
        'level': log.level,
        'message': log.message,
        'traceback': log.traceback,
        'path': log.path,
        'method': log.method,
        'user_id': log.user_id,
        'ip_address': log.ip_address,
        'user_agent': log.user_agent,
        'created_at': log.created_at.isoformat()
    }), 200

@logs_bp.route('/errors', methods=['DELETE'])
@jwt_required()
def clear_error_logs():
    from utils.auth import role_required
    role_required('admin').check()
    
    days = request.args.get('days', 90, type=int)
    cutoff_date = datetime.now() - timedelta(days=days)
    
    deleted = ErrorLog.query.filter(ErrorLog.created_at < cutoff_date).delete()
    db.session.commit()
    
    return jsonify({'message': f'已删除 {deleted} 条旧日志'}), 200

@logs_bp.route('/notifications', methods=['GET'])
@jwt_required()
def list_notifications():
    status = request.args.get('status')
    type = request.args.get('type')
    
    query = Notification.query
    
    if status:
        query = query.filter_by(status=status)
    if type:
        query = query.filter_by(type=type)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(100).all()
    
    return jsonify([{
        'id': n.id,
        'type': n.type,
        'recipient_type': n.recipient_type,
        'recipient_id': n.recipient_id,
        'recipient_email': n.recipient_email,
        'subject': n.subject,
        'status': n.status,
        'sent_at': n.sent_at.isoformat() if n.sent_at else None,
        'error_message': n.error_message,
        'related_type': n.related_type,
        'related_id': n.related_id,
        'created_at': n.created_at.isoformat()
    } for n in notifications]), 200

@logs_bp.route('/notifications/<int:notif_id>/retry', methods=['POST'])
@jwt_required()
def retry_notification(notif_id):
    from utils.auth import role_required
    role_required('admin').check()
    
    notif = Notification.query.get(notif_id)
    if not notif:
        raise ValidationError('通知不存在')
    
    notif.status = 'pending'
    notif.sent_at = None
    notif.error_message = None
    
    db.session.commit()
    
    return jsonify({'message': '已重置通知状态，将在下次发送时重试'}), 200
