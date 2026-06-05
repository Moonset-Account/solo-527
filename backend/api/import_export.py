from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import ImportExportTask, Member, Film, Screening, Booking, Guest
from extensions import db
from utils.error_handler import ValidationError
from datetime import datetime
import pandas as pd
import os
from werkzeug.utils import secure_filename

ie_bp = Blueprint('ie', __name__)

ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@ie_bp.route('/tasks', methods=['GET'])
@jwt_required()
def list_tasks():
    tasks = ImportExportTask.query.order_by(ImportExportTask.created_at.desc()).limit(20).all()
    return jsonify([{
        'id': t.id,
        'type': t.type,
        'entity_type': t.entity_type,
        'status': t.status,
        'file_name': t.file_name,
        'total_records': t.total_records,
        'processed_records': t.processed_records,
        'failed_records': t.failed_records,
        'created_at': t.created_at.isoformat(),
        'completed_at': t.completed_at.isoformat() if t.completed_at else None
    } for t in tasks]), 200

@ie_bp.route('/export/<entity_type>', methods=['GET'])
@jwt_required()
def export_data(entity_type):
    from utils.auth import role_required
    role_required('admin', 'curator', 'finance').check()
    
    if entity_type not in ImportExportTask.ENTITY_TYPES:
        raise ValidationError(f'不支持的导出类型: {entity_type}')
    
    user_id = get_jwt_identity()
    
    task = ImportExportTask(
        type='export',
        entity_type=entity_type,
        status='processing',
        created_by=user_id,
        started_at=datetime.utcnow()
    )
    db.session.add(task)
    db.session.commit()
    
    try:
        data = []
        filename = f'{entity_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        filepath = os.path.join(request.app.config['UPLOAD_FOLDER'], filename)
        
        if entity_type == 'members':
            members = Member.query.all()
            data = [{
                '会员编号': m.member_no,
                '姓名': m.name,
                '电话': m.phone,
                '邮箱': m.email,
                '会员等级': m.level.name if m.level else '',
                '入会日期': m.join_date.isoformat() if m.join_date else '',
                '到期日期': m.expiry_date.isoformat() if m.expiry_date else '',
                '状态': m.status,
                '备注': m.notes
            } for m in members]
        
        elif entity_type == 'films':
            films = Film.query.all()
            data = [{
                '影片名称': f.title,
                '原名': f.original_title,
                '导演': f.director,
                '年份': f.year,
                '时长(分钟)': f.duration,
                '国家': f.country,
                '语言': f.language,
                '授权开始': f.license_start_date.isoformat() if f.license_start_date else '',
                '授权结束': f.license_end_date.isoformat() if f.license_end_date else '',
                '发行方': f.distributor,
                '授权编号': f.license_number,
                '状态': f.status
            } for f in films]
        
        elif entity_type == 'screenings':
            screenings = Screening.query.all()
            data = [{
                '影片': s.film.title if s.film else '',
                '放映厅': s.hall.name if s.hall else '',
                '开始时间': s.start_time.isoformat(),
                '结束时间': s.end_time.isoformat(),
                '容量': s.capacity,
                '状态': s.status,
                '仅会员': '是' if s.is_member_only else '否',
                '允许候补': '是' if s.allow_waitlist else '否',
                '策展备注': s.curator_notes
            } for s in screenings]
        
        elif entity_type == 'bookings':
            bookings = Booking.query.all()
            data = [{
                '报名编号': b.booking_no,
                '会员编号': b.member.member_no if b.member else '',
                '会员姓名': b.member.name if b.member else '',
                '影片': b.screening.film.title if b.screening and b.screening.film else '',
                '放映时间': b.screening.start_time.isoformat() if b.screening else '',
                '状态': b.status,
                '携伴人数': b.guest_count,
                '候补位置': b.waitlist_position,
                '报名时间': b.registered_at.isoformat() if b.registered_at else '',
                '确认时间': b.confirmed_at.isoformat() if b.confirmed_at else '',
                '签到时间': b.checked_in_at.isoformat() if b.checked_in_at else ''
            } for b in bookings]
        
        elif entity_type == 'guests':
            guests = Guest.query.all()
            data = [{
                '姓名': g.name,
                '头衔': g.title,
                '单位': g.organization,
                '电话': g.phone,
                '邮箱': g.email,
                '影片': g.screening.film.title if g.screening and g.screening.film else '',
                '放映时间': g.screening.start_time.isoformat() if g.screening else '',
                '状态': g.status,
                '确认时间': g.confirmed_at.isoformat() if g.confirmed_at else '',
                '签到时间': g.checked_in_at.isoformat() if g.checked_in_at else ''
            } for g in guests]
        
        df = pd.DataFrame(data)
        df.to_excel(filepath, index=False, engine='openpyxl')
        
        task.file_name = filename
        task.file_path = filepath
        task.total_records = len(data)
        task.processed_records = len(data)
        task.status = 'completed'
        task.completed_at = datetime.utcnow()
        db.session.commit()
        
        return send_file(filepath, as_attachment=True, download_name=filename)
    
    except Exception as e:
        task.status = 'failed'
        task.error_log = str(e)
        task.completed_at = datetime.utcnow()
        db.session.commit()
        raise ValidationError(f'导出失败: {str(e)}')

@ie_bp.route('/import/<entity_type>', methods=['POST'])
@jwt_required()
def import_data(entity_type):
    from utils.auth import role_required
    role_required('admin', 'curator').check()
    
    if entity_type not in ImportExportTask.ENTITY_TYPES:
        raise ValidationError(f'不支持的导入类型: {entity_type}')
    
    if 'file' not in request.files:
        raise ValidationError('请上传文件')
    
    file = request.files['file']
    if file.filename == '':
        raise ValidationError('请选择文件')
    
    if not allowed_file(file.filename):
        raise ValidationError('不支持的文件格式，请上传 xlsx 或 csv 文件')
    
    user_id = get_jwt_identity()
    
    filename = secure_filename(f'import_{entity_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}_{file.filename}')
    filepath = os.path.join(request.app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    task = ImportExportTask(
        type='import',
        entity_type=entity_type,
        status='processing',
        file_name=filename,
        file_path=filepath,
        created_by=user_id,
        started_at=datetime.utcnow()
    )
    db.session.add(task)
    db.session.commit()
    
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath, engine='openpyxl')
        
        total_records = len(df)
        processed = 0
        failed = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                if entity_type == 'members':
                    from api.members import generate_member_no
                    level_name = row.get('会员等级', '基础会员')
                    from models import MemberLevel
                    level = MemberLevel.query.filter_by(name=level_name).first()
                    if not level:
                        level = MemberLevel.query.first()
                    
                    member = Member(
                        member_no=row.get('会员编号') or generate_member_no(),
                        name=str(row.get('姓名', '')).strip(),
                        phone=str(row.get('电话', '')).strip(),
                        email=str(row.get('邮箱', '')).strip(),
                        level_id=level.id if level else 1,
                        status=str(row.get('状态', 'active')).strip()
                    )
                    db.session.add(member)
                
                elif entity_type == 'films':
                    film = Film(
                        title=str(row.get('影片名称', '')).strip(),
                        original_title=str(row.get('原名', '')).strip() if pd.notna(row.get('原名')) else None,
                        director=str(row.get('导演', '')).strip() if pd.notna(row.get('导演')) else None,
                        year=int(row.get('年份')) if pd.notna(row.get('年份')) else None,
                        duration=int(row.get('时长(分钟)', 0)),
                        country=str(row.get('国家', '')).strip() if pd.notna(row.get('国家')) else None,
                        license_start_date=pd.to_datetime(row.get('授权开始')).date() if pd.notna(row.get('授权开始')) else datetime.now().date(),
                        license_end_date=pd.to_datetime(row.get('授权结束')).date() if pd.notna(row.get('授权结束')) else (datetime.now().date() + __import__('datetime').timedelta(days=365)),
                        distributor=str(row.get('发行方', '')).strip() if pd.notna(row.get('发行方')) else None,
                        license_number=str(row.get('授权编号', '')).strip() if pd.notna(row.get('授权编号')) else None
                    )
                    db.session.add(film)
                
                processed += 1
            except Exception as e:
                failed += 1
                errors.append(f'行 {idx + 2}: {str(e)}')
        
        db.session.commit()
        
        task.total_records = total_records
        task.processed_records = processed
        task.failed_records = failed
        task.error_log = '\n'.join(errors) if errors else None
        task.status = 'completed'
        task.completed_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'task_id': task.id,
            'total': total_records,
            'processed': processed,
            'failed': failed,
            'errors': errors[:10]
        }), 200
    
    except Exception as e:
        task.status = 'failed'
        task.error_log = str(e)
        task.completed_at = datetime.utcnow()
        db.session.commit()
        raise ValidationError(f'导入失败: {str(e)}')
