from flask import request

def paginate_query(query, page=None, per_page=None):
    if page is None:
        page = request.args.get('page', 1, type=int)
    if per_page is None:
        per_page = request.args.get('per_page', 20, type=int)
    
    per_page = min(per_page, 100)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return {
        'items': pagination.items,
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    }

def success_response(data=None, message='操作成功', code=200):
    response = {'code': code, 'message': message}
    if data is not None:
        response['data'] = data
    return response, code

def error_response(message='操作失败', code=400, data=None):
    response = {'code': code, 'message': message}
    if data:
        response['data'] = data
    return response, code
