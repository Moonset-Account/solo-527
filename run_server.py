#!/usr/bin/env python3
"""启动医院检验样本时效看板服务器"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ['DASH_PORT'] = '8050'
os.environ['DASH_HOST'] = '0.0.0.0'
os.environ['DASH_DEBUG'] = 'False'

from app import app

if __name__ == '__main__':
    port = int(os.environ.get('DASH_PORT', 8050))
    host = os.environ.get('DASH_HOST', '0.0.0.0')
    debug = os.environ.get('DASH_DEBUG', 'False').lower() == 'true'
    
    print("=" * 60)
    print("🏥 医院检验样本时效看板")
    print("=" * 60)
    print(f"📡 服务器地址: http://{host}:{port}")
    print(f"🔧 调试模式: {'开启' if debug else '关闭'}")
    print(f"💾 数据模式: {'模拟数据' if os.environ.get('USE_MOCK_DATA', 'True') == 'True' else 'TimescaleDB'}")
    print("=" * 60)
    print()
    
    app.run(host=host, port=port, debug=debug)
