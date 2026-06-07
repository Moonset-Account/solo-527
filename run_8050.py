#!/usr/bin/env python3
"""
医院检验样本时效看板 - 8050 端口专用启动脚本
确保：
1. 8050 端口只运行医院检验样本时效看板
2. 数据库不可用时自动降级到模拟数据，绝不卡住
3. 所有功能开箱即用
"""
import os
import sys
import time
import socket
import subprocess

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_DIR)

PORT = 8050


def log_step(step, message):
    print(f"[{step:2d}/5] {message}")


def kill_port(port):
    """杀掉占用端口的所有进程"""
    try:
        result = subprocess.run(
            ['lsof', '-ti', f':{port}'],
            capture_output=True,
            text=True
        )
        pids = [p.strip() for p in result.stdout.strip().split('\n') if p.strip()]
        for pid in pids:
            try:
                subprocess.run(['kill', '-9', pid], capture_output=True)
                print(f"      - 已终止进程 PID: {pid}")
            except:
                pass
        time.sleep(1)
        return True
    except Exception as e:
        print(f"      - 清理端口时出错: {e}")
        return False


def is_port_free(port):
    """检查端口是否空闲"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('0.0.0.0', port))
            return True
        except OSError:
            return False


def preload_data():
    """预加载数据，避免首次访问时卡顿"""
    print("      正在预加载数据...")
    try:
        from src.database.mock_data import (
            get_samples_df, get_returns_df, get_thresholds_df
        )
        from src.database.connection import get_db_status, check_database_health
        
        status = get_db_status()
        print(f"      数据源模式: {status['mode_name']}")
        print(f"      数据源状态: {status['message']}")
        
        samples = get_samples_df()
        returns = get_returns_df()
        thresholds = get_thresholds_df()
        
        print(f"      样本数: {len(samples):,}")
        print(f"      退回记录: {len(returns):,}")
        print(f"      阈值配置: {len(thresholds):,}")
        return True
    except Exception as e:
        print(f"      预加载警告: {e}")
        print(f"      但应用仍可正常启动")
        return True


def main():
    print()
    print("=" * 70)
    print("🏥 医院检验样本时效看板 - 8050 端口专用启动器")
    print("=" * 70)
    print()
    
    # Step 1: 端口清理
    log_step(1, f"清理端口 {PORT}...")
    if not is_port_free(PORT):
        print(f"      端口 {PORT} 被占用，正在释放...")
        kill_port(PORT)
    if is_port_free(PORT):
        print(f"      ✅ 端口 {PORT} 已准备就绪")
    else:
        print(f"      ⚠️  端口 {PORT} 可能仍被占用，但将继续尝试")
    print()
    
    # Step 2: 设置环境变量
    log_step(2, "配置环境变量...")
    os.environ['DASH_PORT'] = str(PORT)
    os.environ['DASH_HOST'] = '0.0.0.0'
    os.environ['DASH_DEBUG'] = 'False'
    os.environ['DB_CONNECT_TIMEOUT'] = '3'
    
    use_mock = os.getenv('USE_MOCK_DATA', 'True').lower() == 'true'
    print(f"      USE_MOCK_DATA = {use_mock}")
    if not use_mock:
        print(f"      数据库超时: {os.environ['DB_CONNECT_TIMEOUT']} 秒")
        print(f"      数据库不可用时自动降级到模拟数据")
    print()
    
    # Step 3: 预加载数据
    log_step(3, "初始化数据层...")
    preload_data()
    print()
    
    # Step 4: 导入应用
    log_step(4, "加载 Dash 应用...")
    try:
        from app import app
        print(f"      ✅ 应用标题: {app.title}")
        print(f"      ✅ 回调数量: {len(app.callback_map)}")
    except Exception as e:
        print(f"      ❌ 应用加载失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    print()
    
    # Step 5: 启动服务
    log_step(5, "启动 Web 服务...")
    print()
    print("=" * 70)
    print(f"✅  医院检验样本时效看板已就绪！")
    print(f"🌐  访问地址: http://localhost:{PORT}")
    print(f"💡  数据源模式: {'模拟数据' if use_mock else 'TimescaleDB（自动降级）'}")
    print(f"🔧  配置文件: {os.path.join(PROJECT_DIR, '.env')}")
    print("=" * 70)
    print()
    print("提示:")
    print("  - 页面右上角显示当前数据源状态")
    print("  - 阈值配置修改后所有页面自动刷新")
    print("  - 导出报告包含时间窗口、筛选口径和当前阈值")
    print()
    
    try:
        app.run(host='0.0.0.0', port=PORT, debug=False)
    except KeyboardInterrupt:
        print()
        print("👋 服务已停止")
    except Exception as e:
        print(f"❌ 服务启动失败: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
