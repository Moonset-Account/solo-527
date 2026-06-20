import os
import sys
import signal
import subprocess
import time
from pathlib import Path

PORT = 8000
PROJECT_DIR = Path(__file__).parent.resolve()

def find_port_pids(port):
    try:
        result = subprocess.run(
            ['lsof', '-ti', f':{port}'],
            capture_output=True, text=True, timeout=5
        )
        pids = [int(p) for p in result.stdout.strip().split('\n') if p]
        return pids
    except Exception as e:
        print(f"  获取端口信息失败: {e}")
        return []

def main():
    print("=" * 50)
    print(f"  母婴会员复购营销系统 - 端口 {PORT} 启动")
    print(f"  项目目录: {PROJECT_DIR}")
    print("=" * 50)
    print()

    print(f"[1/3] 检查端口 {PORT}...")
    pids = find_port_pids(PORT)
    if pids:
        for pid in pids:
            try:
                cwd_result = subprocess.run(
                    ['lsof', '-p', str(pid)],
                    capture_output=True, text=True, timeout=5
                )
                cwd = "unknown"
                for line in cwd_result.stdout.splitlines():
                    parts = line.split()
                    if len(parts) >= 4 and parts[3] == "cwd":
                        cwd = parts[-1]
                        break
                
                is_current = str(PROJECT_DIR) in cwd
                tag = "当前项目" if is_current else "其他进程"
                print(f"  发现 PID={pid} ({tag}): {cwd}")
                
                os.kill(pid, signal.SIGKILL)
                print(f"  ✅ 已终止 PID={pid}")
            except ProcessLookupError:
                print(f"  ⚠️  PID={pid} 已不存在")
            except Exception as e:
                print(f"  ⚠️  终止 PID={pid} 失败: {e}")
        
        time.sleep(1.5)
        
        pids_after = find_port_pids(PORT)
        if pids_after:
            print(f"  ❌ 端口仍被占用: {pids_after}，请手动处理")
            sys.exit(1)
        else:
            print(f"  ✅ 端口 {PORT} 已释放")
    else:
        print(f"  ✅ 端口 {PORT} 空闲可用")

    print()
    print("[2/3] 切换到项目目录...")
    os.chdir(PROJECT_DIR)
    print(f"  当前目录: {os.getcwd()}")

    print()
    print(f"[3/3] 启动 uvicorn (端口 {PORT})...")
    print()
    print("访问地址:")
    print(f"  会员登录:     http://localhost:{PORT}/login")
    print(f"  运营登录:     http://localhost:{PORT}/admin/login")
    print(f"  会员商城:     http://localhost:{PORT}/mall")
    print(f"  运营后台:     http://localhost:{PORT}/admin/dashboard")
    print(f"  健康检查:     http://localhost:{PORT}/health")
    print(f"  API 文档:     http://localhost:{PORT}/docs")
    print()
    print("默认账号:")
    print("  member   / member123   → /mall          (会员, 5000积分)")
    print("  member2  / member123   → /mall          (会员, 800积分)")
    print("  admin    / admin123    → /admin/dashboard (管理员)")
    print("  operator / operator123 → /admin/dashboard (品牌运营)")
    print()
    print("=" * 50)
    print("按 Ctrl+C 停止服务")
    print("=" * 50)
    print()

    cmd = [
        sys.executable, "-m", "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", str(PORT),
        "--reload"
    ]
    os.execvp(sys.executable, cmd)

if __name__ == "__main__":
    main()
