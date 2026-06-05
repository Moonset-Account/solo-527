import json
from pathlib import Path
from typing import Optional, Dict
from datetime import datetime, timedelta

SESSION_FILE = Path(__file__).parent.parent.parent / ".session.json"
SESSION_EXPIRY_HOURS = 8


def save_session(user: Dict) -> bool:
    try:
        session_data = {
            'user_id': user['id'],
            'username': user['username'],
            'name': user.get('name'),
            'role': user['role'],
            'login_time': datetime.now().isoformat()
        }
        with open(SESSION_FILE, 'w', encoding='utf-8') as f:
            json.dump(session_data, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False


def load_session() -> Optional[Dict]:
    try:
        if not SESSION_FILE.exists():
            return None
        
        with open(SESSION_FILE, 'r', encoding='utf-8') as f:
            session_data = json.load(f)
        
        login_time = datetime.fromisoformat(session_data['login_time'])
        if datetime.now() - login_time > timedelta(hours=SESSION_EXPIRY_HOURS):
            clear_session()
            return None
        
        return {
            'id': session_data['user_id'],
            'username': session_data['username'],
            'name': session_data.get('name'),
            'role': session_data['role']
        }
    except Exception:
        clear_session()
        return None


def clear_session() -> bool:
    try:
        if SESSION_FILE.exists():
            SESSION_FILE.unlink()
        return True
    except Exception:
        return False


def get_current_user() -> Optional[Dict]:
    return load_session()


def require_login() -> Dict:
    user = get_current_user()
    if not user:
        return None
    return user


def require_role(allowed_roles: list) -> tuple:
    user = get_current_user()
    if not user:
        return False, "请先登录"
    if user['role'] not in allowed_roles:
        return False, f"权限不足，需要角色: {', '.join(allowed_roles)}"
    return True, user
