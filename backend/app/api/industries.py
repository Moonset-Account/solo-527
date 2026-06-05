from flask import request, jsonify
from app import db
from app.models import IndustryTag
from app.middlewares.auth import require_role, require_login

def register_routes(api_bp):
    @api_bp.route('/industry-tags', methods=['GET'])
    def list_industry_tags():
        tags = IndustryTag.query.filter_by(is_active=True).order_by(IndustryTag.sort_order, IndustryTag.name).all()
        return jsonify([t.to_dict() for t in tags])

    @api_bp.route('/industry-tags', methods=['POST'])
    @require_role('admin')
    def create_industry_tag():
        data = request.get_json()
        tag = IndustryTag(
            name=data['name'],
            name_en=data.get('name_en'),
            category=data.get('category'),
            description=data.get('description'),
            icon=data.get('icon'),
            sort_order=data.get('sort_order', 0)
        )
        db.session.add(tag)
        db.session.commit()
        return jsonify(tag.to_dict()), 201

    @api_bp.route('/industry-tags/<int:tag_id>', methods=['PUT'])
    @require_role('admin')
    def update_industry_tag(tag_id):
        tag = db.session.get(IndustryTag, tag_id)
        if not tag:
            return jsonify({'error': 'Tag not found'}), 404
        
        data = request.get_json()
        for field in ['name', 'name_en', 'category', 'description', 'icon', 'sort_order', 'is_active']:
            if field in data:
                setattr(tag, field, data[field])
        
        db.session.commit()
        return jsonify(tag.to_dict())

    @api_bp.route('/industry-tags/<int:tag_id>', methods=['DELETE'])
    @require_role('admin')
    def delete_industry_tag(tag_id):
        tag = db.session.get(IndustryTag, tag_id)
        if not tag:
            return jsonify({'error': 'Tag not found'}), 404
        
        tag.is_active = False
        db.session.commit()
        return jsonify({'message': 'Tag deleted'})
