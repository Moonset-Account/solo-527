#!/usr/bin/env python3
"""
医院检验样本时效看板 - 启动脚本
自动处理端口占用，确保在 8050 端口运行正确的应用
"""
import os
import sys
import time
import socket

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def is_port_in_use(port):
    """检查端口是否被占用"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('0.0.0.0', port))
            return False
        except OSError:
            return True

def get_pid_using_port(port):
    """获取占用端口的进程ID"""
    import subprocess
    try:
        result = subprocess.run(
            ['lsof', '-ti', f':{port}'],
            capture_output=True,
            text=True
        )
        pids = result.stdout.strip().split('\n')
        return [p for p in pids if p]
    except:
        return []

def kill_processes(pids):
    """杀掉指定进程"""
    import subprocess
    for pid in pids:
        try:
            subprocess.run(['kill', '-9', pid], capture_output=True)
            print(f"   ✅ 已终止进程 PID: {pid}")
        except:
            pass

def setup_database_if_needed():
    """
    检查 TimescaleDB 是否可用并初始化数据
    如果 USE_MOCK_DATA=False 但数据库不可用，自动回退到模拟数据
    """
    from dotenv import load_dotenv
    load_dotenv()
    
    use_mock = os.getenv('USE_MOCK_DATA', 'True').lower() == 'true'
    
    if use_mock:
        print("📊 数据模式: 模拟数据 (USE_MOCK_DATA=True)")
        print("   如需使用 TimescaleDB，请在 .env 中设置 USE_MOCK_DATA=False")
        return True
    
    print("🔌 数据模式: TimescaleDB (USE_MOCK_DATA=False)")
    
    try:
        from src.database.connection import get_engine, fetch_samples_from_db, fetch_thresholds_from_db
        engine = get_engine()
        
        if engine is None:
            print("   ⚠️  数据库连接失败，自动回退到模拟数据模式")
            os.environ['USE_MOCK_DATA'] = 'True'
            return True
        
        # 测试查询
        samples = fetch_samples_from_db()
        thresholds = fetch_thresholds_from_db()
        
        sample_count = len(samples) if samples is not None else 0
        threshold_count = len(thresholds) if thresholds is not None else 0
        
        print(f"   ✅ 数据库连接成功")
        print(f"   📋 样本数: {sample_count:,}")
        print(f"   ⚙️  阈值配置: {threshold_count} 条")
        
        if sample_count == 0:
            print("   ⚠️  数据库中暂无样本数据，正在写入模拟测试数据...")
            try:
                seed_database_with_test_data(engine)
                print("   ✅ 测试数据写入完成！")
            except Exception as e:
                print(f"   ❌ 写入失败: {e}")
                print("   ℹ️  请手动执行 schema.sql 初始化数据库")
        
        return True
        
    except Exception as e:
        print(f"   ❌ 数据库连接失败: {e}")
        print("   ⚠️  自动回退到模拟数据模式")
        os.environ['USE_MOCK_DATA'] = 'True'
        return True

def seed_database_with_test_data(engine):
    """向空数据库写入测试数据"""
    from src.database.mock_data import generate_mock_samples, get_threshold_configs
    from sqlalchemy import text
    
    samples_df, returns_df = generate_mock_samples(num_samples=2000)
    thresholds_df = get_threshold_configs()
    
    # 写入阈值配置
    with engine.begin() as conn:
        for _, row in thresholds_df.iterrows():
            conn.execute(
                text("""
                INSERT INTO threshold_configs 
                (sample_type, priority, stage_name, threshold_minutes, description)
                VALUES (:sample_type, :priority, :stage_name, :threshold_minutes, :description)
                ON CONFLICT (sample_type, priority, stage_name) DO NOTHING
                """),
                {
                    'sample_type': row['sample_type'],
                    'priority': row['priority'],
                    'stage_name': row['stage_name'],
                    'threshold_minutes': row['threshold_minutes'],
                    'description': row['description']
                }
            )
    
    # 写入样本数据（分批）
    batch_size = 500
    for i in range(0, len(samples_df), batch_size):
        batch = samples_df.iloc[i:i+batch_size]
        with engine.begin() as conn:
            for _, row in batch.iterrows():
                conn.execute(
                    text("""
                    INSERT INTO lab_samples 
                    (sample_id, sample_type, priority, requesting_department, patient_id,
                     collected_at, collected_at_source, dispatched_at, dispatched_at_source,
                     received_at, received_at_source, tested_at, tested_at_source,
                     reviewed_at, reviewed_at_source, reported_at, reported_at_source,
                     status, test_items)
                    VALUES 
                    (:sample_id, :sample_type, :priority, :requesting_department, :patient_id,
                     :collected_at, :collected_at_source, :dispatched_at, :dispatched_at_source,
                     :received_at, :received_at_source, :tested_at, :tested_at_source,
                     :reviewed_at, :reviewed_at_source, :reported_at, :reported_at_source,
                     :status, :test_items)
                    ON CONFLICT (sample_id) DO NOTHING
                    """),
                    {
                        'sample_id': row['sample_id'],
                        'sample_type': row['sample_type'],
                        'priority': row['priority'],
                        'requesting_department': row['requesting_department'],
                        'patient_id': row['patient_id'],
                        'collected_at': row['collected_at'],
                        'collected_at_source': row.get('collected_at_source', 'auto'),
                        'dispatched_at': row['dispatched_at'],
                        'dispatched_at_source': row.get('dispatched_at_source', 'auto'),
                        'received_at': row['received_at'],
                        'received_at_source': row.get('received_at_source', 'auto'),
                        'tested_at': row['tested_at'],
                        'tested_at_source': row.get('tested_at_source', 'auto'),
                        'reviewed_at': row['reviewed_at'],
                        'reviewed_at_source': row.get('reviewed_at_source', 'auto'),
                        'reported_at': row['reported_at'],
                        'reported_at_source': row.get('reported_at_source', 'auto'),
                        'status': row.get('status', 'completed'),
                        'test_items': row.get('test_items', '')
                    }
                )
    
    # 写入退回记录
    if not returns_df.empty:
        with engine.begin() as conn:
            for _, row in returns_df.iterrows():
                conn.execute(
                    text("""
                    INSERT INTO sample_return_records
                    (sample_id, return_time, return_reason, responsible_department, returned_by, notes)
                    VALUES
                    (:sample_id, :return_time, :return_reason, :responsible_department, :returned_by, :notes)
                    """),
                    {
                        'sample_id': row['sample_id'],
                        'return_time': row['return_time'],
                        'return_reason': row['return_reason'],
                        'responsible_department': row['responsible_department'],
                        'returned_by': row.get('returned_by', ''),
                        'notes': row.get('notes', '')
                    }
                )

def main():
    print("=" * 70)
    print("🏥 医院检验样本时效看板 - 启动程序")
    print("=" * 70)
    print()
    
    # 1. 端口处理
    PORT = 8050
    print(f"🔍 检查端口 {PORT} 状态...")
    
    if is_port_in_use(PORT):
        print(f"   ⚠️  端口 {PORT} 已被占用")
        pids = get_pid_using_port(PORT)
        if pids:
            print(f"   🛑 正在终止占用进程: {', '.join(pids)}")
            kill_processes(pids)
            time.sleep(2)
        else:
            print(f"   ❌ 无法获取占用进程的 PID")
            print(f"   ℹ️  请手动执行: kill $(lsof -t -i:{PORT})")
            sys.exit(1)
    else:
        print(f"   ✅ 端口 {PORT} 空闲")
    
    print()
    
    # 2. 数据库设置
    print("💾 配置数据源...")
    setup_database_if_needed()
    print()
    
    # 3. 导入并启动应用
    print("🚀 启动 Dash 应用...")
    print()
    
    os.environ['DASH_PORT'] = str(PORT)
    os.environ['DASH_HOST'] = '0.0.0.0'
    os.environ['DASH_DEBUG'] = 'False'
    
    from app import app
    
    print("=" * 70)
    print(f"✅ 医院检验样本时效看板已启动！")
    print(f"🌐 访问地址: http://localhost:{PORT}")
    print("=" * 70)
    print()
    
    port = int(os.environ.get('DASH_PORT', PORT))
    host = os.environ.get('DASH_HOST', '0.0.0.0')
    debug = os.environ.get('DASH_DEBUG', 'False').lower() == 'true'
    
    app.run(host=host, port=port, debug=debug)

if __name__ == '__main__':
    main()
