#!/usr/bin/env python3
"""启动脚本 - 城市空气质量分析工作台"""
import os
import sys
import subprocess

def main():
    project_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_dir)
    
    # 尝试给 start.sh 加执行权限
    start_sh = os.path.join(project_dir, 'start.sh')
    try:
        import stat
        st = os.stat(start_sh)
        os.chmod(start_sh, st.st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
        print("已给 start.sh 添加执行权限")
    except Exception as e:
        print(f"提示: 无法设置 start.sh 权限 ({e})，但可以继续运行")
    
    if not os.path.exists('.env'):
        print("复制环境变量配置文件...")
        with open('.env.example', 'r') as src, open('.env', 'w') as dst:
            dst.write(src.read())
    
    print("检查Python环境...")
    python_exe = sys.executable
    
    venv_dir = os.path.join(project_dir, 'venv')
    if not os.path.exists(venv_dir):
        print("创建虚拟环境...")
        subprocess.check_call([python_exe, '-m', 'venv', 'venv'])
    
    venv_python = os.path.join(venv_dir, 'bin', 'python')
    if not os.path.exists(venv_python):
        venv_python = os.path.join(venv_dir, 'Scripts', 'python.exe')
    
    print("安装依赖...")
    subprocess.check_call([venv_python, '-m', 'pip', 'install', '--upgrade', 'pip'])
    subprocess.check_call([venv_python, '-m', 'pip', 'install', '-r', 'requirements.txt'])
    
    print("\n==========================================")
    print("启动Dash分析工作台 (端口: 8050)")
    print("==========================================")
    print("\n访问地址: http://localhost:8050")
    print("按 Ctrl+C 停止服务\n")
    
    os.execvp(venv_python, [venv_python, 'app.py'])

if __name__ == '__main__':
    main()
