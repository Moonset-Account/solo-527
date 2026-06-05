from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import Film
from app import db
from utils.error_handler import ValidationError
from datetime import datetime

films_bp = Blueprint('films', __name__)

@films_bp.route('', methods=['GET'])
@jwt_required()
def list_films():
    status = request.args.get('status')
    query = Film.query
    
    if status:
        query = query.filter_by(status=status)
    
    films = query.order_by(Film.created_at.desc()).all()
    return jsonify([f.to_dict() for f in films]), 200

@films_bp.route('/<int:film_id>', methods=['GET'])
@jwt_required()
def get_film(film_id):
    film = Film.query.get(film_id)
    if not film:
        raise ValidationError('影片不存在')
    return jsonify(film.to_dict(include_screenings=True)), 200

@films_bp.route('', methods=['POST'])
@jwt_required()
def create_film():
    from utils.auth import role_required
    role_required('admin', 'curator')()
    
    data = request.get_json()
    
    required_fields = ['title', 'duration', 'license_start_date', 'license_end_date']
    for field in required_fields:
        if not data.get(field):
            raise ValidationError(f'请提供{field}')
    
    try:
        license_start = datetime.strptime(data['license_start_date'], '%Y-%m-%d').date()
        license_end = datetime.strptime(data['license_end_date'], '%Y-%m-%d').date()
    except ValueError:
        raise ValidationError('日期格式不正确，请使用YYYY-MM-DD格式')
    
    if license_end < license_start:
        raise ValidationError('授权结束日期不能早于开始日期')
    
    film = Film(
        title=data['title'],
        original_title=data.get('original_title'),
        director=data.get('director'),
        year=data.get('year'),
        duration=data['duration'],
        country=data.get('country'),
        language=data.get('language'),
        synopsis=data.get('synopsis'),
        poster_url=data.get('poster_url'),
        license_start_date=license_start,
        license_end_date=license_end,
        distributor=data.get('distributor'),
        license_number=data.get('license_number'),
        status=data.get('status', 'active')
    )
    
    db.session.add(film)
    db.session.commit()
    
    return jsonify(film.to_dict()), 201

@films_bp.route('/<int:film_id>', methods=['PUT'])
@jwt_required()
def update_film(film_id):
    from utils.auth import role_required
    role_required('admin', 'curator')()
    
    film = Film.query.get(film_id)
    if not film:
        raise ValidationError('影片不存在')
    
    data = request.get_json()
    
    if data.get('title'):
        film.title = data['title']
    if data.get('original_title') is not None:
        film.original_title = data['original_title']
    if data.get('director') is not None:
        film.director = data['director']
    if data.get('year') is not None:
        film.year = data['year']
    if data.get('duration'):
        film.duration = data['duration']
    if data.get('country') is not None:
        film.country = data['country']
    if data.get('language') is not None:
        film.language = data['language']
    if data.get('synopsis') is not None:
        film.synopsis = data['synopsis']
    if data.get('poster_url') is not None:
        film.poster_url = data['poster_url']
    if data.get('distributor') is not None:
        film.distributor = data['distributor']
    if data.get('license_number') is not None:
        film.license_number = data['license_number']
    if data.get('status'):
        film.status = data['status']
    
    if data.get('license_start_date'):
        try:
            film.license_start_date = datetime.strptime(data['license_start_date'], '%Y-%m-%d').date()
        except ValueError:
            raise ValidationError('授权开始日期格式不正确')
    
    if data.get('license_end_date'):
        try:
            film.license_end_date = datetime.strptime(data['license_end_date'], '%Y-%m-%d').date()
        except ValueError:
            raise ValidationError('授权结束日期格式不正确')
    
    if film.license_end_date < film.license_start_date:
        raise ValidationError('授权结束日期不能早于开始日期')
    
    db.session.commit()
    return jsonify(film.to_dict()), 200

@films_bp.route('/<int:film_id>', methods=['DELETE'])
@jwt_required()
def delete_film(film_id):
    from utils.auth import role_required
    role_required('admin')()
    
    film = Film.query.get(film_id)
    if not film:
        raise ValidationError('影片不存在')
    
    if film.screenings:
        raise ValidationError('该影片有关联的放映场次，无法删除')
    
    db.session.delete(film)
    db.session.commit()
    
    return jsonify({'message': '影片已删除'}), 200

@films_bp.route('/check-license/<int:film_id>', methods=['GET'])
@jwt_required()
def check_license(film_id):
    film = Film.query.get(film_id)
    if not film:
        raise ValidationError('影片不存在')
    
    date_str = request.args.get('date')
    check_date = None
    if date_str:
        try:
            check_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            raise ValidationError('日期格式不正确')
    
    is_valid = film.is_license_valid(check_date)
    
    return jsonify({
        'film_id': film_id,
        'title': film.title,
        'license_start': film.license_start_date.isoformat(),
        'license_end': film.license_end_date.isoformat(),
        'is_valid': is_valid,
        'check_date': (check_date or datetime.now().date()).isoformat()
    }), 200
