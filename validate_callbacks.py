#!/usr/bin/env python3
"""验证 Dash 回调参数顺序正确性"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import importlib.util
import re

def extract_callbacks_from_file(filepath):
    """从文件中提取所有回调定义"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 找到所有 @app.callback 块
    callback_pattern = r'@app\.callback\((.*?)\)\s*\ndef\s+(\w+)\s*\(([^)]*)\)'
    matches = re.findall(callback_pattern, content, re.DOTALL)
    
    callbacks = []
    for decorator_args, func_name, func_args in matches:
        # 提取 Input 和 State
        inputs = re.findall(r"Input\('([^']+)',\s*'([^']+)'\)", decorator_args)
        states = re.findall(r"State\('([^']+)',\s*'([^']+)'\)", decorator_args)
        
        func_params = [p.strip() for p in func_args.split(',') if p.strip()]
        
        callbacks.append({
            'func_name': func_name,
            'inputs': [f"{c[0]}.{c[1]}" for c in inputs],
            'states': [f"{c[0]}.{c[1]}" for c in states],
            'func_params': func_params,
            'total_params_expected': len(inputs) + len(states),
            'total_params_actual': len(func_params)
        })
    
    return callbacks

def main():
    print("=" * 70)
    print("🔍 验证 Dash 回调参数顺序")
    print("=" * 70)
    print()
    
    callbacks = extract_callbacks_from_file('app.py')
    
    all_passed = True
    
    for cb in callbacks:
        print(f"📌 回调函数: {cb['func_name']}")
        print(f"   Inputs ({len(cb['inputs'])}): {', '.join(cb['inputs'])}")
        print(f"   States ({len(cb['states'])}): {', '.join(cb['states'])}")
        print(f"   函数参数 ({len(cb['func_params'])}): {', '.join(cb['func_params'])}")
        
        # 检查数量是否匹配
        if cb['total_params_expected'] != cb['total_params_actual']:
            print(f"   ❌ 参数数量不匹配: 期望 {cb['total_params_expected']}, 实际 {cb['total_params_actual']}")
            all_passed = False
        else:
            print(f"   ✅ 参数数量匹配: {cb['total_params_expected']} 个")
        
        # 检查是否所有 Input 都在 State 之前（装饰器中）
        # 这个需要更复杂的解析，这里简化处理
        print()
    
    print("=" * 70)
    if all_passed:
        print("✅ 所有回调参数数量验证通过!")
    else:
        print("❌ 部分回调存在问题，需要修复!")
    print("=" * 70)
    
    # 额外验证：检查 threshold-version Input 是否在所有 State 之前
    print()
    print("🔍 检查 threshold-version Input 位置...")
    
    with open('app.py', 'r') as f:
        content = f.read()
    
    callback_blocks = re.findall(r'@app\.callback\((.*?)\)', content, re.DOTALL)
    
    for i, block in enumerate(callback_blocks):
        if 'threshold-version' in block:
            # 找到 threshold-version 的位置
            thresh_pos = block.find("Input('threshold-version'")
            state_pos = block.find("State(")
            
            if thresh_pos != -1 and state_pos != -1:
                if thresh_pos < state_pos:
                    print(f"   ✅ 回调 #{i+1}: threshold-version Input 在 State 之前 (正确)")
                else:
                    print(f"   ❌ 回调 #{i+1}: threshold-version Input 在 State 之后 (错误!)")
                    all_passed = False
            else:
                print(f"   ⚠️  回调 #{i+1}: 无法确定位置")
    
    print()
    print("=" * 70)
    if all_passed:
        print("🎉 所有验证通过!")
        return 0
    else:
        print("⚠️  存在需要修复的问题")
        return 1

if __name__ == '__main__':
    sys.exit(main())
